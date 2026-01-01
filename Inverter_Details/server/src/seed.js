const mongoose = require('mongoose');
require('dotenv').config();

const InverterRecord = require('./models/InverterRecord');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inverter_details';

// Sample sites and inverter configurations
const SITES = [
    { name: 'Alpha Solar Farm', inverters: 8 },
    { name: 'Beta Industrial Park', inverters: 5 },
    { name: 'Gamma Rooftop Array', inverters: 3 },
    { name: 'Delta Power Station', inverters: 10 }
];

const STATUSES = ['Active', 'Active', 'Active', 'Maintenance', 'Inactive'];

// Generate random inverter value (60-100 for performance %)
const randomInverterValue = () => Math.round(60 + Math.random() * 40);

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('Clearing existing records...');
        await InverterRecord.deleteMany({});

        console.log('Generating sample data...');
        const records = [];

        // Generate data for the last 30 days for each site
        const today = new Date();

        for (const site of SITES) {
            for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
                const date = new Date(today);
                date.setDate(date.getDate() - daysAgo);
                date.setHours(0, 0, 0, 0);

                // Generate inverter values
                const inverterValues = {};
                for (let i = 1; i <= site.inverters; i++) {
                    inverterValues[`Inverter ${i}`] = randomInverterValue();
                }

                // Random status (mostly Active)
                const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

                records.push({
                    siteName: site.name,
                    date: date,
                    status: daysAgo === 0 ? 'draft' : status,
                    inverterValues: new Map(Object.entries(inverterValues)),
                    uploadedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
                });
            }
        }

        await InverterRecord.insertMany(records);

        console.log(`\n🚀 Successfully seeded ${records.length} inverter records!`);
        console.log(`   - ${SITES.length} sites`);
        console.log(`   - 30 days of data per site`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
