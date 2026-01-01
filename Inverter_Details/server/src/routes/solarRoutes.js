const express = require('express');
const router = express.Router();
const {
    Site,
    BuildGeneration,
    DailyGeneration,
    MonthlyGeneration,
    Alert,
    User
} = require('../models');

// ===== SITE ROUTES =====

// GET /api/solar/sites - Get all sites
router.get('/sites', async (req, res) => {
    try {
        const sites = await Site.find().sort({ siteNumber: 1 });
        res.json(sites);
    } catch (error) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ error: 'Failed to fetch sites' });
    }
});

// POST /api/solar/sites - Create a new site
router.post('/sites', async (req, res) => {
    try {
        const site = new Site(req.body);
        await site.save();
        res.status(201).json(site);
    } catch (error) {
        console.error('Error creating site:', error);
        res.status(500).json({ error: 'Failed to create site' });
    }
});

// PUT /api/solar/sites/:id - Update a site
router.put('/sites/:id', async (req, res) => {
    try {
        const site = await Site.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!site) {
            return res.status(404).json({ error: 'Site not found' });
        }

        res.json(site);
    } catch (error) {
        console.error('Error updating site:', error);
        res.status(500).json({ error: 'Failed to update site' });
    }
});

// DELETE /api/solar/sites/:id - Delete a site
router.delete('/sites/:id', async (req, res) => {
    try {
        const site = await Site.findByIdAndDelete(req.params.id);

        if (!site) {
            return res.status(404).json({ error: 'Site not found' });
        }

        res.json({ message: 'Site deleted successfully' });
    } catch (error) {
        console.error('Error deleting site:', error);
        res.status(500).json({ error: 'Failed to delete site' });
    }
});

// ===== BUILD GENERATION ROUTES =====

// GET /api/solar/build-generation - Get all build generation records
router.get('/build-generation', async (req, res) => {
    try {
        const { siteId, year } = req.query;
        let query = {};

        if (siteId) query.site = siteId;
        if (year) query.year = parseInt(year);

        const records = await BuildGeneration.find(query)
            .populate('site')
            .sort({ year: -1 });

        res.json(records);
    } catch (error) {
        console.error('Error fetching build generation:', error);
        res.status(500).json({ error: 'Failed to fetch build generation' });
    }
});

// POST /api/solar/build-generation - Create build generation record
router.post('/build-generation', async (req, res) => {
    try {
        const record = new BuildGeneration(req.body);
        await record.save();
        const populated = await record.populate('site');
        res.status(201).json(populated);
    } catch (error) {
        console.error('Error creating build generation:', error);
        res.status(500).json({ error: 'Failed to create build generation' });
    }
});

// PUT /api/solar/build-generation/:id - Update build generation
router.put('/build-generation/:id', async (req, res) => {
    try {
        const record = await BuildGeneration.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('site');

        if (!record) {
            return res.status(404).json({ error: 'Build generation record not found' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error updating build generation:', error);
        res.status(500).json({ error: 'Failed to update build generation' });
    }
});

// ===== DAILY GENERATION ROUTES =====

// GET /api/solar/daily-generation - Get daily generation records
router.get('/daily-generation', async (req, res) => {
    try {
        const { siteId, startDate, endDate, page = 1, limit = 100 } = req.query;
        let query = {};

        if (siteId) query.site = siteId;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const records = await DailyGeneration.find(query)
            .populate('site')
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await DailyGeneration.countDocuments(query);

        res.json({ records, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Error fetching daily generation:', error);
        res.status(500).json({ error: 'Failed to fetch daily generation' });
    }
});

// POST /api/solar/daily-generation - Create daily generation record
router.post('/daily-generation', async (req, res) => {
    try {
        const record = new DailyGeneration(req.body);
        await record.save();
        const populated = await record.populate('site');
        res.status(201).json(populated);
    } catch (error) {
        console.error('Error creating daily generation:', error);
        res.status(500).json({ error: 'Failed to create daily generation' });
    }
});

// PUT /api/solar/daily-generation/:id - Update daily generation
router.put('/daily-generation/:id', async (req, res) => {
    try {
        const record = await DailyGeneration.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('site');

        if (!record) {
            return res.status(404).json({ error: 'Daily generation record not found' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error updating daily generation:', error);
        res.status(500).json({ error: 'Failed to update daily generation' });
    }
});

// ===== MONTHLY GENERATION ROUTES =====

// GET /api/solar/monthly-generation - Get monthly generation records
router.get('/monthly-generation', async (req, res) => {
    try {
        const { siteId, year, month } = req.query;
        let query = {};

        if (siteId) query.site = siteId;
        if (year) query.year = parseInt(year);
        if (month !== undefined) query.month = parseInt(month);

        const records = await MonthlyGeneration.find(query)
            .populate('site')
            .sort({ year: -1, month: -1 });

        res.json(records);
    } catch (error) {
        console.error('Error fetching monthly generation:', error);
        res.status(500).json({ error: 'Failed to fetch monthly generation' });
    }
});

// POST /api/solar/monthly-generation - Create monthly generation record
router.post('/monthly-generation', async (req, res) => {
    try {
        const record = new MonthlyGeneration(req.body);
        await record.save();
        const populated = await record.populate('site');
        res.status(201).json(populated);
    } catch (error) {
        console.error('Error creating monthly generation:', error);
        res.status(500).json({ error: 'Failed to create monthly generation' });
    }
});

// PUT /api/solar/monthly-generation/:id - Update monthly generation
router.put('/monthly-generation/:id', async (req, res) => {
    try {
        const record = await MonthlyGeneration.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('site');

        if (!record) {
            return res.status(404).json({ error: 'Monthly generation record not found' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error updating monthly generation:', error);
        res.status(500).json({ error: 'Failed to update monthly generation' });
    }
});

// ===== ALERT ROUTES =====

// GET /api/solar/alerts - Get all alerts
router.get('/alerts', async (req, res) => {
    try {
        const { siteId, resolved, severity } = req.query;
        let query = {};

        if (siteId) query.site = siteId;
        if (resolved !== undefined) query.resolved = resolved === 'true';
        if (severity) query.severity = severity;

        const alerts = await Alert.find(query)
            .populate('site')
            .sort({ createdAt: -1 });

        res.json(alerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// POST /api/solar/alerts - Create an alert
router.post('/alerts', async (req, res) => {
    try {
        const alert = new Alert(req.body);
        await alert.save();
        const populated = await alert.populate('site');
        res.status(201).json(populated);
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

// PUT /api/solar/alerts/:id - Update an alert
router.put('/alerts/:id', async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('site');

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json(alert);
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

// ===== USER ROUTES =====

// GET /api/solar/users - Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/solar/users - Create a new user
router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        const userObj = user.toObject();
        delete userObj.password;
        res.status(201).json(userObj);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// POST /api/solar/users/login - User login
router.post('/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userObj = user.toObject();
        delete userObj.password;
        res.json(userObj);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
