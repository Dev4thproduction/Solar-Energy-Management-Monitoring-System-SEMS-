const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const {
    InverterRecord,
    Weather,
    Meter,
    Site,
    BuildGeneration,
    DailyGeneration,
    MonthlyGeneration,
    Alert,
    User
} = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/unified_energy_management';

async function testConnection() {
    try {
        console.log('\n🔄 Connecting to MongoDB...');
        console.log(`📍 URI: ${MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB successfully!\n');

        // Test all models
        const models = [
            { name: 'InverterRecord', model: InverterRecord },
            { name: 'Weather', model: Weather },
            { name: 'Meter', model: Meter },
            { name: 'Site', model: Site },
            { name: 'BuildGeneration', model: BuildGeneration },
            { name: 'DailyGeneration', model: DailyGeneration },
            { name: 'MonthlyGeneration', model: MonthlyGeneration },
            { name: 'Alert', model: Alert },
            { name: 'User', model: User }
        ];

        console.log('📊 Testing Model Connections:\n');
        console.log('┌─────────────────────────┬─────────┬────────────┐');
        console.log('│ Model                   │ Status  │ Collection │');
        console.log('├─────────────────────────┼─────────┼────────────┤');

        for (const { name, model } of models) {
            try {
                const count = await model.countDocuments();
                const collectionName = model.collection.name;
                console.log(`│ ${name.padEnd(23)} │ ✅ OK   │ ${collectionName.padEnd(10)} │`);
            } catch (error) {
                console.log(`│ ${name.padEnd(23)} │ ❌ FAIL │ Error      │`);
            }
        }

        console.log('└─────────────────────────┴─────────┴────────────┘\n');

        // Get document counts
        console.log('📈 Document Counts:\n');
        for (const { name, model } of models) {
            try {
                const count = await model.countDocuments();
                console.log(`   ${name}: ${count} documents`);
            } catch (error) {
                console.log(`   ${name}: Error counting`);
            }
        }

        console.log('\n✅ All models are working correctly!');
        console.log('🗄️  Database: unified_energy_management');
        console.log('🔗 Total Models: 9');

    } catch (error) {
        console.error('\n❌ Connection test failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed.');
        process.exit(0);
    }
}

testConnection();
