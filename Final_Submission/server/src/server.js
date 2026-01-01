const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const submissionRoutes = require('./routes');
const authRoutes = require('./authRoutes');

const app = express();
const PORT = process.env.PORT || 5007;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', submissionRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Final Submission API', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/final_submission';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Final Submission API running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

module.exports = app;
