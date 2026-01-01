const axios = require('axios');

const API_URL = 'http://localhost:5005/api';

async function createSubmissionsForJune2025() {
    console.log('Creating submission records for June 2025...\n');

    const submissions = [];

    // Create submissions for all 30 days of June 2025
    for (let day = 1; day <= 30; day++) {
        const date = `2025-06-${String(day).padStart(2, '0')}`;

        submissions.push({
            site: 'Site-A',
            date: date,
            poa: 0, // POA will need to be filled from weather data if needed
            status: 'Draft'
        });
    }

    try {
        console.log(`Creating ${submissions.length} submission records with auto-calculated invGen and abtExport...\n`);

        const response = await axios.post(`${API_URL}/submissions/bulk`, {
            submissions: submissions
        });

        console.log('✅ Success!');
        console.log(`📊 Created ${response.data.count} submissions`);
        console.log('\n💡 Note: The invGen and abtExport values are set to 0.');
        console.log('   Use the "Recalculate" button in the UI to fetch actual values from Inverter Details and Meter data.');

    } catch (error) {
        console.error('❌ Error creating submissions:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

createSubmissionsForJune2025();
