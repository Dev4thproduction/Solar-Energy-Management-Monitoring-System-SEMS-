const express = require('express');
const router = express.Router();
const Weather = require('../models/Weather');
const multer = require('multer');
const XLSX = require('xlsx');
const { parseExcelDate } = require('../utils/dateUtils');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/weather - Get all weather records
router.get('/', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 100 } = req.query;

        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { siteName: { $regex: search, $options: 'i' } },
                { date: { $regex: search, $options: 'i' } }
            ];
        }

        const records = await Weather.find(query)
            .sort({ date: -1, time: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Weather.countDocuments(query);

        res.json({ records, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Error fetching weather records:', error);
        res.status(500).json({ error: 'Failed to fetch weather records' });
    }
});

// GET /api/weather/stats - Get statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await Weather.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Weather.countDocuments();

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
        console.error('Error fetching weather stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /api/weather - Create a new weather record
router.post('/', async (req, res) => {
    try {
        const record = new Weather(req.body);
        await record.save();
        res.status(201).json(record);
    } catch (error) {
        console.error('Error creating weather record:', error);
        res.status(500).json({ error: 'Failed to create weather record' });
    }
});

// POST /api/weather/upload - Bulk upload from Excel
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
            siteName: row['Site Name'] || row['siteName'],
            date: parseExcelDate(row['Date'] || row['date']) || new Date(),
            time: row['Time'] || row['time'],
            poa: parseFloat(row['POA'] || row['poa'] || 0),
            ghi: parseFloat(row['GHI'] || row['ghi'] || 0),
            albedoUp: parseFloat(row['Albedo Up'] || row['albedoUp']),
            albedoDown: parseFloat(row['Albedo Down'] || row['albedoDown']),
            moduleTemp: parseFloat(row['Module Temp'] || row['moduleTemp'] || 0),
            ambientTemp: parseFloat(row['Ambient Temp'] || row['ambientTemp'] || 0),
            windSpeed: parseFloat(row['Wind Speed'] || row['windSpeed']),
            rainfall: parseFloat(row['Rainfall'] || row['rainfall']),
            humidity: parseFloat(row['Humidity'] || row['humidity']),
            status: 'Draft'
        }));

        const inserted = await Weather.insertMany(records);

        res.status(201).json({
            message: `Successfully uploaded ${inserted.length} weather records`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error uploading weather file:', error);
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
});

// PUT /api/weather/:id - Update a weather record
router.put('/:id', async (req, res) => {
    try {
        const record = await Weather.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!record) {
            return res.status(404).json({ error: 'Weather record not found' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error updating weather record:', error);
        res.status(500).json({ error: 'Failed to update weather record' });
    }
});

// DELETE /api/weather/:id - Delete a weather record
router.delete('/:id', async (req, res) => {
    try {
        const record = await Weather.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({ error: 'Weather record not found' });
        }

        res.json({ message: 'Weather record deleted successfully' });
    } catch (error) {
        console.error('Error deleting weather record:', error);
        res.status(500).json({ error: 'Failed to delete weather record' });
    }
});

module.exports = router;
