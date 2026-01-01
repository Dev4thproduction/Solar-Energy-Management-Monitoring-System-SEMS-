const mongoose = require('mongoose');
const InverterRecord = require('./src/models/InverterRecord');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/unified_energy_management';

async function cleanup() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const cutoffDate = new Date('2100-01-01');
        const result = await InverterRecord.deleteMany({ date: { $gt: cutoffDate } });

        console.log(`Deleted ${result.deletedCount} records with future dates (year > 2100).`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

cleanup();
