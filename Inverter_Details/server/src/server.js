const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import all routes
const inverterRoutes = require('./routes/inverterRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const meterRoutes = require('./routes/meterRoutes');
const solarRoutes = require('./routes/solarRoutes');

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes - All modules now use the same MongoDB database
app.use('/api/inverter', inverterRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/meter', meterRoutes);
app.use('/api/solar', solarRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        modules: ['inverter', 'weather', 'meter', 'solar']
    });
});

// Connect to MongoDB - Single unified database for all modules
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/unified_energy_management';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to Unified MongoDB Database');
        console.log('📊 Database: unified_energy_management');
        console.log('🔗 Available modules: Inverter, Weather, Meter, Solar');
        app.listen(PORT, () => {
            console.log(`🚀 Unified Energy Management API running on http://localhost:${PORT}`);
            console.log(`📍 Endpoints:`);
            console.log(`   - /api/inverter (Inverter Records)`);
            console.log(`   - /api/weather (Weather Data)`);
            console.log(`   - /api/meter (Meter Readings)`);
            console.log(`   - /api/solar (Solar Power Generation)`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

module.exports = app;
