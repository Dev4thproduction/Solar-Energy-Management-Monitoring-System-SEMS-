const express = require('express');
const router = express.Router();
const Submission = require('./models/Submission');
const axios = require('axios');
const multer = require('multer');
const XLSX = require('xlsx');
const { parseDate, formatISO, formatDDMMYYYY, formatDDMMMYY, cloneDate } = require('./utils/dateUtils');
const { verifyToken, isUser, isAdmin, isSuperAdmin } = require('./middleware/auth');
const mongoose = require('mongoose');

// Helper function to get models from unified database using native MongoDB driver
const getUnifiedDbModels = () => {
    // Access the native MongoDB connection
    const db = mongoose.connection.client.db('unified_energy_management');
    return {
        Weather: db.collection('weathers'),
        Meter: db.collection('meters'),
        Site: db.collection('sites'),
        DailyGeneration: db.collection('dailygenerations'),
        MonthlyGeneration: db.collection('monthlygenerations'),
        BuildGeneration: db.collection('buildgenerations'),
        InverterRecord: db.collection('inverterrecords')
    };
};

// Configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Configuration for external APIs
const INVERTER_API = process.env.INVERTER_API_URL || 'http://localhost:5002/api';
const METER_API = process.env.METER_API_URL || 'http://localhost:3000/meter';

// Legacy function names for backward compatibility
const parseExcelDate = parseDate;
const formatDateDDMMYYYY = (dateObj) => formatDDMMYYYY(dateObj);

// Helper function to calculate Inverter Generation from Inverter Details
async function calculateInverterGeneration(siteName, date) {
    try {
        // Fetch ALL inverter records (we'll filter client-side)
        const response = await axios.get(`${INVERTER_API}/inverter/records`, {
            params: { limit: 1000 }
        });

        if (!response.data || !response.data.records) {
            console.log(`No records found from Inverter API`);
            return 0;
        }

        // Filter records by exact site name and date
        // Clone the date to avoid mutation
        const targetDate = new Date(new Date(date).getTime());
        targetDate.setHours(0, 0, 0, 0);

        const matchingRecords = response.data.records.filter(record => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);

            return record.siteName === siteName &&
                recordDate.getTime() === targetDate.getTime();
            // Accept all statuses - status logic will be managed separately
        });

        if (matchingRecords.length === 0) {
            console.log(`No inverter records found for site: ${siteName}, date: ${targetDate.toISOString().split('T')[0]}`);
            return 0;
        }

        // Sum all inverter values from the matching record
        let totalGeneration = 0;
        matchingRecords.forEach(record => {
            if (record.inverterValues) {
                Object.values(record.inverterValues).forEach(value => {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        totalGeneration += numValue;
                    }
                });
            }
        });

        const result = totalGeneration / 1000;
        console.log(`Calculated invGen for ${siteName} on ${targetDate.toISOString().split('T')[0]}: ${result} kWh (total: ${totalGeneration}, records: ${matchingRecords.length})`);

        // Convert to kWh by dividing by 1000
        return result;
    } catch (error) {
        console.error('Error calculating inverter generation:', error.message);
        return 0;
    }
}

// Helper function to calculate ABT Export from Meter Data
async function calculateAbtExport(siteName, dateInput) {
    try {
        // Clone the date to avoid mutation
        const dateObj = parseExcelDate(dateInput);
        if (!dateObj) {
            console.log(`Invalid date for ABT calculation: ${dateInput}`);
            return 0;
        }

        // Create a new date object for formatting to avoid mutation
        const clonedDate = new Date(dateObj.getTime());
        const formattedDate = formatDateDDMMYYYY(clonedDate);

        console.log(`Fetching meter data for date: ${formattedDate}`);

        // Fetch meter records
        const response = await axios.get(`${METER_API}`, {
            params: {
                date: formattedDate,
                limit: 1000
            },
            timeout: 30000
        });

        if (!response.data || !response.data.data) {
            console.log(`No meter data found for date: ${formattedDate}`);
            return 0;
        }

        console.log(`Found ${response.data.data.length} meter records for ${formattedDate}`);

        // Sum all activeEnergyExport values for the matching date
        let totalExport = 0;
        let count = 0;
        response.data.data.forEach(record => {
            if (record.date === formattedDate && record.activeEnergyExport) {
                const exportValue = parseFloat(record.activeEnergyExport);
                if (!isNaN(exportValue)) {
                    totalExport += exportValue;
                    count++;
                }
            }
        });

        console.log(`Calculated abtExport for ${formattedDate}: ${totalExport} kWh (from ${count} records)`);

        return parseFloat(totalExport.toFixed(2));
    } catch (error) {
        console.error('Error calculating ABT export:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return 0;
    }
}

// Helper function to calculate POA from Weather Data
async function calculatePOA(siteName, dateInput) {
    try {
        const dateObj = parseExcelDate(dateInput);
        if (!dateObj) {
            return 0;
        }

        // Create a new date object for formatting to avoid mutation
        const clonedDate = new Date(dateObj.getTime());
        const formattedDate = formatDateDDMMYYYY(clonedDate);

        console.log(`Calculated POA: Fetching weather data for ${siteName} on ${formattedDate}`);

        // Logic: Fetch weather records. We filter manually because API might be limited.
        const response = await axios.get(`${INVERTER_API}/weather`, {
            params: { limit: 5000 }
        });

        if (!response.data || !response.data.records) {
            return 0;
        }

        // Filter for matching site and date
        console.log(`Looking for ${siteName} on ${formattedDate}`);
        console.log(`Total weather records: ${response.data.records.length}`);

        const matchingRecords = response.data.records.filter(record => {
            // Check site (case-insensitive)
            if (!record.siteName || record.siteName.toLowerCase() !== siteName.toLowerCase()) return false;

            // Check date - Parse weather API date format (supports DD-MMM-YY, ISO, DD-MM-YYYY)
            const recordParsed = parseExcelDate(record.date);
            if (!recordParsed) {
                console.log(`Failed to parse weather date: ${record.date}`);
                return false;
            }

            const recordDateStr = formatDateDDMMYYYY(recordParsed);
            const matches = recordDateStr === formattedDate;

            if (matches) {
                console.log(`✓ MATCH: Weather ${record.date} → ${recordDateStr} === ${formattedDate}`);
            }

            return matches;
        });

        if (matchingRecords.length === 0) {
            console.log(`No weather records found for ${siteName} on ${formattedDate}`);
            return 0;
        }

        // Sum POA
        let totalPOA = 0;
        matchingRecords.forEach(record => {
            const val = parseFloat(record.poa);
            if (!isNaN(val)) totalPOA += val;
        });

        // Conversion: If POA is in W/m² (irradiance), we need simple avg or sum? 
        // Daily POA is usually Irradiation in kWh/m². 
        // Assuming raw values are irradiation for the period.
        // For now, dividing sum by 1000 to convert to kWh/m^2 if incoming is Wh/m^2 or W/m^2
        const result = totalPOA / 1000;

        console.log(`Calculated POA for ${formattedDate}: ${result} (from ${matchingRecords.length} records, raw sum: ${totalPOA})`);

        return parseFloat(result.toFixed(2));

    } catch (error) {
        console.error('Error calculating POA:', error.message);
        return 0;
    }
}

// Status synchronization across collections
async function syncStatusToRelatedRecords(submission, newStatus) {
    try {
        const site = submission.site;
        const date = new Date(submission.date);

        // Format date as string for Weather/Meter matching (DD-MM-YYYY)
        const dateString = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

        // Extract year and month for MonthlyGeneration
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11

        console.log(`🔄 Syncing status "${newStatus}" for site: ${site}, date: ${dateString}`);

        // Get collections from unified database
        const collections = getUnifiedDbModels();

        // 1. Update InverterRecord status
        // Match by date range (entire day) to handle time component differences
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const inverterResult = await collections.InverterRecord.updateMany(
            { siteName: site, date: { $gte: startOfDay, $lte: endOfDay } },
            { $set: { status: newStatus, updatedAt: new Date() } }
        );
        if (inverterResult.modifiedCount > 0) {
            console.log(`✅ Updated ${inverterResult.modifiedCount} InverterRecord(s) status to ${newStatus}`);
        }

        // 2. Update Weather records
        const weatherResult = await collections.Weather.updateMany(
            { siteName: site, date: dateString },
            { $set: { status: newStatus, updatedAt: new Date() } }
        );
        if (weatherResult.modifiedCount > 0) {
            console.log(`✅ Updated ${weatherResult.modifiedCount} Weather record(s) status to ${newStatus}`);
        }

        // 3. Update Meter records
        const meterResult = await collections.Meter.updateMany(
            { date: dateString },
            { $set: { status: newStatus, updatedAt: new Date() } }
        );
        if (meterResult.modifiedCount > 0) {
            console.log(`✅ Updated ${meterResult.modifiedCount} Meter record(s) status to ${newStatus}`);
        }

        // 4. Update DailyGeneration, MonthlyGeneration, and BuildGeneration
        const siteDoc = await collections.Site.findOne({ siteName: site });
        if (siteDoc) {
            // DailyGeneration - reuse the date range already calculated
            const dailyResult = await collections.DailyGeneration.updateMany(
                {
                    site: siteDoc._id,
                    date: { $gte: startOfDay, $lte: endOfDay }
                },
                { $set: { status: newStatus, updatedAt: new Date() } }
            );
            if (dailyResult.modifiedCount > 0) {
                console.log(`✅ Updated ${dailyResult.modifiedCount} DailyGeneration record(s) status to ${newStatus}`);
            }

            // MonthlyGeneration
            const monthlyResult = await collections.MonthlyGeneration.updateMany(
                {
                    site: siteDoc._id,
                    year: year,
                    month: month
                },
                { $set: { status: newStatus, updatedAt: new Date() } }
            );
            if (monthlyResult.modifiedCount > 0) {
                console.log(`✅ Updated ${monthlyResult.modifiedCount} MonthlyGeneration record(s) status to ${newStatus}`);
            }

            // BuildGeneration
            const buildResult = await collections.BuildGeneration.updateMany(
                {
                    site: siteDoc._id,
                    year: year
                },
                { $set: { status: newStatus, updatedAt: new Date() } }
            );
            if (buildResult.modifiedCount > 0) {
                console.log(`✅ Updated ${buildResult.modifiedCount} BuildGeneration record(s) status to ${newStatus}`);
            }
        }

        console.log(`✅ Status synchronization complete for ${site} on ${dateString}`);
    } catch (error) {
        console.error('❌ Error syncing status to related records:', error.message);
        // Don't throw - allow submission update to succeed even if sync fails
    }
}

// GET /api/calculate - Calculate invGen and abtExport for a site and date
router.get('/calculate', verifyToken, isUser, async (req, res) => {
    try {
        const { site, date } = req.query;

        if (!site || !date) {
            return res.status(400).json({
                error: 'Both site and date parameters are required'
            });
        }

        // Calculate both values in parallel
        const [invGen, abtExport, poa] = await Promise.all([
            calculateInverterGeneration(site, date),
            calculateAbtExport(site, date),
            calculatePOA(site, date)
        ]);

        res.json({
            site,
            date,
            invGen: parseFloat(invGen.toFixed(2)),
            abtExport: parseFloat(abtExport.toFixed(2)),
            poa: parseFloat(poa.toFixed(2))
        });
    } catch (error) {
        console.error('Error in calculate endpoint:', error);
        res.status(500).json({ error: 'Failed to calculate values' });
    }
});

// GET /api/sites - Get unique site names for dropdown (fetches from both Inverter Details API and existing submissions)
router.get('/sites', verifyToken, isUser, async (req, res) => {
    try {
        // Get sites from existing submissions in database
        const dbSites = await Submission.distinct('site');

        // Also fetch sites from Inverter Details API to include new sites
        let inverterSites = [];
        try {
            const response = await axios.get(`${INVERTER_API}/inverter/sites`);
            if (response.data && Array.isArray(response.data)) {
                inverterSites = response.data;
            } else if (response.data && Array.isArray(response.data.sites)) {
                inverterSites = response.data.sites;
            }
        } catch (err) {
            console.log('Could not fetch sites from Inverter API, using only database sites:', err.message);
        }

        // Merge and deduplicate sites
        const allSites = [...new Set([...dbSites, ...inverterSites])];
        res.json(allSites.filter(s => s).sort());
    } catch (error) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ error: 'Failed to fetch sites' });
    }
});

// GET /api/years - Get unique years for dropdown
router.get('/years', verifyToken, isUser, async (req, res) => {
    try {
        const submissions = await Submission.find({}, { date: 1 });
        const years = [...new Set(submissions.map(s => new Date(s.date).getFullYear()))];
        res.json(years.sort((a, b) => b - a));
    } catch (error) {
        console.error('Error fetching years:', error);
        res.status(500).json({ error: 'Failed to fetch years' });
    }
});

// DELETE /api/submissions/cleanup - Delete all submissions (for cleanup)
router.delete('/submissions/cleanup', verifyToken, isSuperAdmin, async (req, res) => {
    try {
        const result = await Submission.deleteMany({});
        res.json({
            message: `Deleted ${result.deletedCount} submissions`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting submissions:', error);
        res.status(500).json({ error: 'Failed to delete submissions' });
    }
});

// POST /api/sync-inverter - Auto-create submissions from inverter records
router.post('/sync-inverter', verifyToken, isAdmin, async (req, res) => {
    try {
        const { site } = req.body; // Optional: sync only for specific site

        // Fetch all inverter records
        const inverterResponse = await axios.get(`${INVERTER_API}/inverter/records`, {
            params: { limit: 5000 }
        });

        if (!inverterResponse.data || !inverterResponse.data.records) {
            return res.json({ message: 'No inverter records found', created: 0 });
        }

        const inverterRecords = inverterResponse.data.records;

        // Group records by site and date to get unique combinations
        const siteDataMap = {};
        inverterRecords.forEach(record => {
            if (site && record.siteName !== site) return; // Skip if filtering by site

            // Parse the date properly and clone it to avoid mutation
            const dateObj = parseExcelDate(record.date);
            if (!dateObj) return;

            const dateKey = dateObj.toISOString().split('T')[0];
            const key = `${record.siteName}_${dateKey}`;

            if (!siteDataMap[key]) {
                // Store a cloned date object to avoid mutation during calculations
                siteDataMap[key] = {
                    site: record.siteName,
                    date: new Date(dateObj.getTime()),
                    records: []
                };
            }
            siteDataMap[key].records.push(record);
        });

        // Check which combinations already have submissions
        const existingSubs = await Submission.find({}, { site: 1, date: 1 });
        const existingKeys = new Set(existingSubs.map(s => {
            const d = new Date(s.date);
            if (isNaN(d.getTime())) return null;
            const dateKey = d.toISOString().split('T')[0];
            return `${s.site}_${dateKey}`;
        }).filter(k => k));

        // Create new submissions for missing combinations
        // Use Promise.all to fetch data in parallel for much better performance
        const submissionPromises = Object.entries(siteDataMap).map(async ([key, data]) => {
            if (existingKeys.has(key)) return null;

            // Calculate invGen from inverter values
            let invGen = 0;
            data.records.forEach(record => {
                if (record.inverterValues) {
                    Object.values(record.inverterValues).forEach(value => {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                            invGen += numValue;
                        }
                    });
                }
            });
            invGen = invGen / 1000; // Convert to kWh

            // Calculate ABT and POA
            // Pass cloned dates to avoid mutation during async operations
            let abtExport = 0;
            let poa = 0;
            try {
                const [abt, p] = await Promise.all([
                    calculateAbtExport(data.site, new Date(data.date.getTime())),
                    calculatePOA(data.site, new Date(data.date.getTime()))
                ]);
                abtExport = abt;
                poa = p;
            } catch (err) {
                console.log(`Could not calculate properties for ${data.site}:`, err.message);
            }

            return {
                site: data.site,
                date: new Date(data.date.getTime()), // Return a fresh clone
                invGen: parseFloat(invGen.toFixed(2)),
                abtExport: parseFloat(abtExport.toFixed(2)),
                poa: parseFloat(poa.toFixed(2)),
                status: 'Draft'
            };
        });

        const results = await Promise.all(submissionPromises);
        const newSubmissions = results.filter(res => res !== null);

        if (newSubmissions.length > 0) {
            await Submission.insertMany(newSubmissions);
        }

        res.json({
            message: `Synced ${newSubmissions.length} new submissions from inverter data`,
            created: newSubmissions.length,
            total: Object.keys(siteDataMap).length
        });
    } catch (error) {
        console.error('Error syncing inverter data:', error);
        res.status(500).json({ error: 'Failed to sync inverter data' });
    }
});

// GET /api/submissions - Get submissions with filters
router.get('/submissions', verifyToken, isUser, async (req, res) => {
    try {
        const { site, month, year, startDate, endDate, status, page = 1, limit = 100 } = req.query;

        let query = {};

        // Role-based filtering
        if (req.user.role === 'user') {
            // Users can only see Draft status (not Site Publish or beyond)
            query.status = { $in: ['Draft'] };
        } else if (req.user.role === 'admin') {
            // Admins can see Site Publish and Site Hold (records they manage)
            query.status = { $in: ['Site Publish', 'Site Hold'] };
        } else if (req.user.role === 'superadmin') {
            // Superadmins can see Send to HQ Approval and Site Hold on main dashboard
            // HQ Approved records are shown on separate Submitted Data page
            query.status = { $in: ['Send to HQ Approval', 'Site Hold'] };
        }

        // Site filter
        if (site && site !== 'all') {
            query.site = site;
        }

        // Status filter (only if user has permission to see those statuses)
        if (status && status !== 'all') {
            if (req.user.role === 'user' && status === 'Draft') {
                query.status = status;
            } else if (req.user.role === 'admin' && ['Site Publish', 'Site Hold'].includes(status)) {
                query.status = status;
            } else if (req.user.role === 'superadmin') {
                // Allow filtering by 'Send to HQ Approval', 'Site Hold', or 'HQ Approved'
                // If status is 'HQ Approved', it means request is from Submitted Data page
                if (['Send to HQ Approval', 'Site Hold', 'HQ Approved'].includes(status)) {
                    query.status = status;
                }
            }
        }

        console.log('Submissions Query:', JSON.stringify(query, null, 2));

        // Date filters
        // Priority: Custom Date Range > Month/Year
        if (startDate && endDate) {
            // Custom Date Range
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            query.date = {
                $gte: start,
                $lte: end
            };
        } else if (month || year) {
            // Month/Year Filter
            const start = new Date();
            const end = new Date();

            if (year) {
                start.setFullYear(parseInt(year), month ? parseInt(month) - 1 : 0, 1);
                end.setFullYear(parseInt(year), month ? parseInt(month) : 12, 0);
            }

            if (month && year) {
                start.setFullYear(parseInt(year), parseInt(month) - 1, 1);
                end.setFullYear(parseInt(year), parseInt(month), 0);
            }

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            if (year || month) {
                query.date = {
                    $gte: start,
                    $lte: end
                };
            }
        }

        const submissions = await Submission.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Submission.countDocuments(query);

        res.json({
            submissions,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// GET /api/stats - Get statistics
router.get('/stats', verifyToken, isUser, async (req, res) => {
    try {
        const { site, month, year, startDate, endDate, status } = req.query;

        // Role-based filtering for stats
        let matchQuery = {};
        if (req.user.role === 'user') {
            matchQuery.status = { $in: ['Draft'] };
        } else if (req.user.role === 'admin') {
            matchQuery.status = { $in: ['Site Publish', 'Site Hold'] };
        } else if (req.user.role === 'superadmin') {
            // Check if filtering for specific status (from Submitted Data page)
            if (status === 'HQ Approved') {
                matchQuery.status = { $in: ['HQ Approved'] };
            } else {
                // Default: show Send to HQ Approval and Site Hold on main dashboard
                matchQuery.status = { $in: ['Send to HQ Approval', 'Site Hold'] };
            }
        }

        // Apply site filter to stats
        if (site && site !== 'all') {
            matchQuery.site = site;
        }

        // Apply date filters to stats
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchQuery.date = { $gte: start, $lte: end };
        } else if (month || year) {
            const start = new Date();
            const end = new Date();
            if (year) {
                start.setFullYear(parseInt(year), month ? parseInt(month) - 1 : 0, 1);
                end.setFullYear(parseInt(year), month ? parseInt(month) : 12, 0);
            }
            if (month && year) {
                start.setFullYear(parseInt(year), parseInt(month) - 1, 1);
                end.setFullYear(parseInt(year), parseInt(month), 0);
            }
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            matchQuery.date = { $gte: start, $lte: end };
        }

        const stats = await Submission.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Submission.countDocuments(matchQuery);

        const result = {
            total,
            'Draft': 0,
            'Site Publish': 0,
            'Send to HQ Approval': 0,
            'HQ Approved': 0
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

// POST /api/submissions - Create a new submission
router.post('/submissions', verifyToken, isAdmin, async (req, res) => {
    try {
        let { site, date, invGen, abtExport, poa, status, autoCalculate } = req.body;

        // If autoCalculate is true or invGen/abtExport not provided, calculate from source data
        if (autoCalculate === true || invGen === undefined || abtExport === undefined) {
            const [calculatedInvGen, calculatedAbtExport] = await Promise.all([
                invGen === undefined ? calculateInverterGeneration(site, date) : Promise.resolve(invGen),
                abtExport === undefined ? calculateAbtExport(site, date) : Promise.resolve(abtExport)
            ]);

            invGen = invGen === undefined ? calculatedInvGen : invGen;
            abtExport = abtExport === undefined ? calculatedAbtExport : abtExport;
        }

        const submission = new Submission({
            site,
            date: new Date(date),
            invGen: parseFloat(invGen) || 0,
            abtExport: parseFloat(abtExport) || 0,
            poa: parseFloat(poa) || 0,
            status: status || 'Draft'
        });

        await submission.save();
        res.status(201).json(submission);
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});

// PUT /api/submissions/:id - Update a submission with role-based status transitions
router.put('/submissions/:id', verifyToken, isUser, async (req, res) => {
    try {
        const { site, date, invGen, abtExport, poa, status, action } = req.body;

        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Status transition validation based on role and action
        if (status !== undefined) {
            const currentStatus = submission.status;
            const role = req.user.role;

            // HQ Approved records are locked - cannot be modified
            if (currentStatus === 'HQ Approved') {
                return res.status(403).json({ error: 'HQ Approved records cannot be modified' });
            }

            // User role transitions
            if (role === 'user') {
                if (action === 'submit' && currentStatus === 'Draft') {
                    submission.previousStatus = currentStatus;
                    submission.status = 'Site Publish';
                    submission.submittedBy = req.user._id;
                } else {
                    return res.status(403).json({ error: 'Users can only submit Draft records' });
                }
            }
            // Admin role transitions
            else if (role === 'admin') {
                // Admins cannot modify Send to HQ Approval (already submitted)
                if (currentStatus === 'Send to HQ Approval') {
                    return res.status(403).json({ error: 'Cannot modify records already sent to HQ' });
                }

                if (action === 'site-hold' && currentStatus === 'Site Publish') {
                    submission.previousStatus = currentStatus;
                    submission.status = 'Site Hold';
                } else if (action === 'release' && currentStatus === 'Site Hold') {
                    submission.status = submission.previousStatus || 'Site Publish';
                    submission.previousStatus = currentStatus;
                } else if (action === 'submit' && currentStatus === 'Site Publish') {
                    submission.previousStatus = currentStatus;
                    submission.status = 'Send to HQ Approval';
                } else {
                    return res.status(403).json({ error: 'Invalid status transition for admin' });
                }
            }
            // Superadmin role transitions
            else if (role === 'superadmin') {
                if (action === 'approve' && currentStatus === 'Send to HQ Approval') {
                    submission.previousStatus = currentStatus;
                    submission.status = 'HQ Approved';
                } else if (action === 'site-hold' && currentStatus === 'Send to HQ Approval') {
                    submission.previousStatus = currentStatus;
                    submission.status = 'Site Hold';
                } else if (action === 'release' && currentStatus === 'Site Hold') {
                    submission.status = submission.previousStatus || 'Send to HQ Approval';
                    submission.previousStatus = currentStatus;
                } else {
                    return res.status(403).json({ error: 'Invalid status transition for superadmin' });
                }
            }
        }

        // Update other fields (only if not locked)
        const updateData = { updatedAt: new Date() };

        if (site !== undefined) updateData.site = site;
        if (date !== undefined) updateData.date = new Date(date);
        if (invGen !== undefined) updateData.invGen = parseFloat(invGen);
        if (abtExport !== undefined) updateData.abtExport = parseFloat(abtExport);
        if (poa !== undefined) updateData.poa = parseFloat(poa);

        Object.assign(submission, updateData);
        await submission.save();

        // Sync status to related records
        if (status !== undefined) {
            await syncStatusToRelatedRecords(submission, submission.status);
        }

        res.json(submission);
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ error: 'Failed to update submission' });
    }
});

// DELETE /api/submissions/:id - Delete a submission
router.delete('/submissions/:id', verifyToken, isSuperAdmin, async (req, res) => {
    try {
        const submission = await Submission.findByIdAndDelete(req.params.id);

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ error: 'Failed to delete submission' });
    }
});

// POST /api/submissions/bulk - Bulk create submissions
router.post('/submissions/bulk', verifyToken, isAdmin, async (req, res) => {
    try {
        const { submissions } = req.body;

        if (!Array.isArray(submissions) || submissions.length === 0) {
            return res.status(400).json({ error: 'Invalid submissions array' });
        }

        const records = submissions.map(s => ({
            site: s.site,
            date: new Date(s.date),
            invGen: parseFloat(s.invGen) || 0,
            abtExport: parseFloat(s.abtExport) || 0,
            poa: parseFloat(s.poa) || 0,
            status: s.status || 'Draft'
        }));

        const inserted = await Submission.insertMany(records);

        res.status(201).json({
            message: `Successfully created ${inserted.length} submissions`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error bulk creating submissions:', error);
        res.status(500).json({ error: 'Failed to create submissions' });
    }
});

// POST /api/submissions/upload - Upload Excel/CSV file and auto-calculate invGen and abtExport
router.post('/submissions/upload', verifyToken, isAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { autoCalculate = 'true' } = req.body;
        const shouldAutoCalculate = autoCalculate === 'true' || autoCalculate === true;

        // Read the Excel/CSV file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return res.status(400).json({ error: 'File is empty' });
        }

        const records = [];
        const calculationPromises = [];

        for (const row of jsonData) {
            const site = row['Site'] || row['site'] || row['SITE'];
            const dateStr = row['Date'] || row['date'] || row['DATE'];
            const poa = parseFloat(row['POA (kWh/m²)'] || row['POA'] || row['poa'] || 0);
            const status = row['Status'] || row['status'] || 'Draft';

            if (!site || !dateStr) {
                continue; // Skip rows without site or date
            }

            const date = new Date(dateStr);

            if (shouldAutoCalculate) {
                // Calculate invGen and abtExport from source data
                calculationPromises.push(
                    Promise.all([
                        calculateInverterGeneration(site, date),
                        calculateAbtExport(site, date)
                    ]).then(([invGen, abtExport]) => ({
                        site,
                        date,
                        invGen,
                        abtExport,
                        poa,
                        status
                    }))
                );
            } else {
                // Use values from Excel if provided
                const invGen = parseFloat(row['Inv Gen (kWh)'] || row['invGen'] || row['InvGen'] || 0);
                const abtExport = parseFloat(row['ABT Export (kWh)'] || row['abtExport'] || row['AbtExport'] || 0);

                records.push({
                    site,
                    date,
                    invGen,
                    abtExport,
                    poa,
                    status
                });
            }
        }

        // Wait for all calculations to complete
        if (shouldAutoCalculate && calculationPromises.length > 0) {
            const calculatedRecords = await Promise.all(calculationPromises);
            records.push(...calculatedRecords);
        }

        if (records.length === 0) {
            return res.status(400).json({ error: 'No valid records found in file' });
        }

        // Insert all records into database
        const inserted = await Submission.insertMany(records);

        res.status(201).json({
            message: `Successfully uploaded ${inserted.length} submissions`,
            count: inserted.length,
            autoCalculated: shouldAutoCalculate
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
});

// POST /api/recalculate-all - Bulk recalculate invGen and abtExport for all submissions (optimized)
router.post('/recalculate-all', verifyToken, isAdmin, async (req, res) => {
    try {
        const { submissionIds } = req.body;

        if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
            return res.status(400).json({ error: 'submissionIds array is required' });
        }

        // Fetch all submissions at once
        const submissions = await Submission.find({ _id: { $in: submissionIds } });

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'No submissions found' });
        }

        // Calculate all values in parallel (batched for performance)
        const batchSize = 10; // Process 10 at a time to avoid overwhelming external APIs
        const results = [];

        for (let i = 0; i < submissions.length; i += batchSize) {
            const batch = submissions.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(async (sub) => {
                    const [invGen, abtExport] = await Promise.all([
                        calculateInverterGeneration(sub.site, sub.date),
                        calculateAbtExport(sub.site, sub.date)
                    ]);
                    return { id: sub._id, invGen, abtExport };
                })
            );
            results.push(...batchResults);
        }

        // Bulk update all submissions in database
        const bulkOps = results.map(r => ({
            updateOne: {
                filter: { _id: r.id },
                update: {
                    $set: {
                        invGen: parseFloat(r.invGen.toFixed(2)),
                        abtExport: parseFloat(r.abtExport.toFixed(2)),
                        updatedAt: new Date()
                    }
                }
            }
        }));

        await Submission.bulkWrite(bulkOps);

        res.json({
            message: `Successfully recalculated ${results.length} submissions`,
            count: results.length,
            results: results.map(r => ({
                id: r.id,
                invGen: parseFloat(r.invGen.toFixed(2)),
                abtExport: parseFloat(r.abtExport.toFixed(2))
            }))
        });
    } catch (error) {
        console.error('Error in bulk recalculate:', error);
        res.status(500).json({ error: 'Failed to recalculate: ' + error.message });
    }
});

module.exports = router;
