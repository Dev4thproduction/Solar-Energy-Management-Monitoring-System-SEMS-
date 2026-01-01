const express = require('express');
const router = express.Router();
const Meter = require('../models/Meter');
const multer = require('multer');
const XLSX = require('xlsx');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/meter - Get all meter records
router.get('/', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 100 } = req.query;

        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { date: { $regex: search, $options: 'i' } }
            ];
        }

        const records = await Meter.find(query)
            .sort({ date: -1, time: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Meter.countDocuments(query);

        res.json({ records, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Error fetching meter records:', error);
        res.status(500).json({ error: 'Failed to fetch meter records' });
    }
});

// GET /api/meter/stats - Get statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await Meter.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Meter.countDocuments();

        const result = {
            total,
            draft: 0,
            published: 0
        };

        stats.forEach(s => {
            result[s._id] = s.count;
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching meter stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /api/meter - Create a new meter record
router.post('/', async (req, res) => {
    try {
        const record = new Meter(req.body);
        await record.save();
        res.status(201).json(record);
    } catch (error) {
        console.error('Error creating meter record:', error);
        res.status(500).json({ error: 'Failed to create meter record' });
    }
});

// POST /api/meter/upload - Bulk upload from Excel
router.post('/upload', upload.single('file'), async (req, res) => {
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

        const records = jsonData.map(row => ({
            date: row['Date'] || row['date'],
            time: row['Time'] || row['time'],
            plantStartTime: row['Plant Start Time'] || row['plantStartTime'],
            plantStopTime: row['Plant Stop Time'] || row['plantStopTime'] || '00:00',
            total: row['Total'] || row['total'] || '00:00',
            activeEnergyImport: parseFloat(row['Active Energy Import'] || row['activeEnergyImport'] || 0),
            activeEnergyExport: parseFloat(row['Active Energy Export'] || row['activeEnergyExport'] || 0),
            reactiveEnergyImport: parseFloat(row['Reactive Energy Import'] || row['reactiveEnergyImport'] || 0),
            reactiveEnergyExport: parseFloat(row['Reactive Energy Export'] || row['reactiveEnergyExport'] || 0),
            voltage: parseFloat(row['Voltage'] || row['voltage'] || 0),
            current: parseFloat(row['Current'] || row['current'] || 0),
            frequency: parseFloat(row['Frequency'] || row['frequency'] || 0),
            powerFactor: parseFloat(row['Power Factor'] || row['powerFactor'] || 0),
            status: 'Draft'
        }));

        const inserted = await Meter.insertMany(records);

        res.status(201).json({
            message: `Successfully uploaded ${inserted.length} meter records`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error uploading meter file:', error);
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
});

// PUT /api/meter/:id - Update a meter record
router.put('/:id', async (req, res) => {
    try {
        const record = await Meter.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!record) {
            return res.status(404).json({ error: 'Meter record not found' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error updating meter record:', error);
        res.status(500).json({ error: 'Failed to update meter record' });
    }
});

// DELETE /api/meter/:id - Delete a meter record
router.delete('/:id', async (req, res) => {
    try {
        const record = await Meter.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({ error: 'Meter record not found' });
        }

        res.json({ message: 'Meter record deleted successfully' });
    } catch (error) {
        console.error('Error deleting meter record:', error);
        res.status(500).json({ error: 'Failed to delete meter record' });
    }
});

module.exports = router;
