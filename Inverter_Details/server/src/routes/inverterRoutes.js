const express = require('express');
const router = express.Router();
const InverterRecord = require('../models/InverterRecord');
const multer = require('multer');
const XLSX = require('xlsx');
const { parseExcelDate } = require('../utils/dateUtils');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/inverter/sites - Get unique site names for dynamic dropdown
router.get('/sites', async (req, res) => {
    try {
        const sites = await InverterRecord.distinct('siteName');
        res.json(sites.filter(s => s).sort());
    } catch (error) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ error: 'Failed to fetch sites' });
    }
});

// GET /api/records - Get all records
router.get('/records', async (req, res) => {
    try {
        const { status, search, site, page = 1, limit = 100 } = req.query;

        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (site && site !== 'all') {
            query.siteName = site;
        }

        if (search) {
            query.$or = [
                { siteName: { $regex: search, $options: 'i' } },
                { date: { $regex: search, $options: 'i' } }
            ];
        }

        const records = await InverterRecord.find(query)
            .sort({ uploadedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await InverterRecord.countDocuments(query);

        // Convert Map to object for frontend
        const formattedRecords = records.map(record => {
            const obj = record.toObject();
            obj.inverterValues = Object.fromEntries(record.inverterValues || new Map());
            return obj;
        });

        res.json({ records: formattedRecords, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ error: 'Failed to fetch records' });
    }
});

// GET /api/stats - Get statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await InverterRecord.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await InverterRecord.countDocuments();

        const result = {
            total,
            draft: 0,
            Active: 0,
            Inactive: 0,
            Maintenance: 0
        };

        stats.forEach(s => {
            result[s._id] = s.count;
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /api/records - Create a new record
router.post('/records', async (req, res) => {
    try {
        const { siteName, date, status, inverterValues } = req.body;

        const record = new InverterRecord({
            siteName,
            date: new Date(date),
            status: status || 'Draft',
            inverterValues: new Map(Object.entries(inverterValues || {}))
        });

        await record.save();

        const obj = record.toObject();
        obj.inverterValues = Object.fromEntries(record.inverterValues);

        res.status(201).json(obj);
    } catch (error) {
        console.error('Error creating record:', error);
        res.status(500).json({ error: 'Failed to create record' });
    }
});

// POST /api/records/upload - Bulk upload from Excel
router.post('/records/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return res.status(400).json({ error: 'File is empty' });
        }

        const records = [];

        for (const row of jsonData) {
            // Extract siteName and date
            const siteName = row['Site Name'] || row['site name'] || row['SiteName'] || 'Unknown Site';
            const dateStr = row['Date'] || row['date'] || new Date().toISOString().split('T')[0];

            // Normalize status to match enum values
            const statusRaw = (row['Status'] || row['status'] || 'Draft').toLowerCase();
            const statusMap = {
                'draft': 'Draft',
                'site publish': 'Site Publish',
                'send to hq approval': 'Send to HQ Approval',
                'hq approved': 'HQ Approved',
                'site hold': 'Site Hold'
            };
            const status = statusMap[statusRaw] || 'Draft';

            // Extract inverter values (columns containing 'inverter' or starting with 'inv')
            const inverterValues = {};
            Object.keys(row).forEach(key => {
                if ((key.toLowerCase().includes('inverter') || key.toLowerCase().startsWith('inv')) &&
                    key !== 'id' && key !== '_id') {
                    inverterValues[key] = row[key];
                }
            });

            const parsedDate = parseExcelDate(dateStr) || new Date();

            records.push({
                siteName,
                date: parsedDate,
                status: status,
                inverterValues: new Map(Object.entries(inverterValues))
            });
        }

        const inserted = await InverterRecord.insertMany(records);

        res.status(201).json({
            message: `Successfully uploaded ${inserted.length} records`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
});

// PUT /api/records/:id - Update a record
router.put('/records/:id', async (req, res) => {
    try {
        const { siteName, date, status, inverterValues } = req.body;

        const updateData = {
            updatedAt: new Date()
        };

        if (siteName !== undefined) updateData.siteName = siteName;
        if (date !== undefined) updateData.date = new Date(date);
        if (status !== undefined) updateData.status = status;
        if (inverterValues !== undefined) {
            updateData.inverterValues = new Map(Object.entries(inverterValues));
        }

        const record = await InverterRecord.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const obj = record.toObject();
        obj.inverterValues = Object.fromEntries(record.inverterValues || new Map());

        res.json(obj);
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ error: 'Failed to update record' });
    }
});

// DELETE /api/records/:id - Delete a record
router.delete('/records/:id', async (req, res) => {
    try {
        const record = await InverterRecord.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

// DELETE /api/records - Delete all records
router.delete('/records', async (req, res) => {
    try {
        await InverterRecord.deleteMany({});
        res.json({ message: 'All records deleted successfully' });
    } catch (error) {
        console.error('Error deleting records:', error);
        res.status(500).json({ error: 'Failed to delete records' });
    }
});

module.exports = router;
