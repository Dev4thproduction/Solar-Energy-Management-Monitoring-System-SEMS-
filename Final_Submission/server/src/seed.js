const mongoose = require('mongoose');
require('dotenv').config();

const Submission = require('./models/Submission');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/final_submission';

// Sample sites
const SITES = [
    'Alpha Solar Farm',
    'Beta Industrial Park',
    'Gamma Rooftop Array',
    'Delta Power Station',
    'Epsilon Commercial Center'
];

// Generate random value within range
const randomValue = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('Clearing existing submissions...');
        await Submission.deleteMany({});

        console.log('Generating sample data...');
        const submissions = [];
        const today = new Date();
        const statuses = ['Pending', 'Pending', 'Submitted', 'Approved'];

        // Generate data for the last 60 days for each site
        for (const site of SITES) {
            for (let daysAgo = 0; daysAgo < 60; daysAgo++) {
                const date = new Date(today);
                date.setDate(date.getDate() - daysAgo);
                date.setHours(0, 0, 0, 0);

                // Generate realistic values
                const invGen = randomValue(500, 2500);    // Inverter Generation (kWh)
                const abtExport = randomValue(400, 2200);  // ABT Export (kWh)
                const poa = randomValue(4, 8);             // POA (kWh/m²)

                // Older records more likely to be approved
                const statusIndex = daysAgo < 7 ? 0 : daysAgo < 30 ? Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 2);
                const status = statuses[Math.min(statusIndex, statuses.length - 1)];

                submissions.push({
                    site,
                    date,
                    invGen,
                    abtExport,
                    poa,
                    status
                });
            }
        }

        await Submission.insertMany(submissions);

        console.log(`\n🚀 Successfully seeded ${submissions.length} submissions!`);
        console.log(`   - ${SITES.length} sites`);
        console.log(`   - 60 days of data per site`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seed();
