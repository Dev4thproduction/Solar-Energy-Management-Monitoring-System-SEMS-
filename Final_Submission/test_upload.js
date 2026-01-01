/**
 * Test script to upload sample_final_submission.csv to Final Submission API
 *
 * Usage:
 *   node test_upload.js
 *
 * Requirements:
 *   - All three services must be running (ports 5002, 3000, 5003)
 *   - sample_final_submission.csv must exist in the same directory
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5003/api';
const FILE_PATH = path.join(__dirname, 'sample_final_submission.csv');

async function uploadFile() {
    try {
        // Check if file exists
        if (!fs.existsSync(FILE_PATH)) {
            console.error('❌ Error: sample_final_submission.csv not found!');
            console.log('Please make sure the file exists in the same directory as this script.');
            process.exit(1);
        }

        console.log('📁 Reading file:', FILE_PATH);

        // Create form data
        const form = new FormData();
        form.append('file', fs.createReadStream(FILE_PATH));
        form.append('autoCalculate', 'true');

        console.log('🚀 Uploading file to API...');
        console.log('   URL:', `${API_URL}/submissions/upload`);
        console.log('   Auto-calculate: true');
        console.log('');

        // Upload the file
        const response = await axios.post(`${API_URL}/submissions/upload`, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Display results
        console.log('✅ Success!');
        console.log('');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('');
        console.log(`📊 Imported ${response.data.count} submissions`);
        console.log(`🔄 Auto-calculated: ${response.data.autoCalculated ? 'Yes' : 'No'}`);
        console.log('');
        console.log('🌐 View results at: http://localhost:5176');

    } catch (error) {
        console.error('❌ Upload failed!');
        console.error('');

        if (error.response) {
            // Server responded with error
            console.error('Status:', error.response.status);
            console.error('Error:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // No response received
            console.error('Error: No response from server');
            console.error('Make sure the Final Submission API is running on port 5003');
            console.error('');
            console.error('Start the server with:');
            console.error('  cd Final_Submission/server');
            console.error('  npm start');
        } else {
            // Other error
            console.error('Error:', error.message);
        }

        process.exit(1);
    }
}

// Check service availability first
async function checkServices() {
    const services = [
        { name: 'Final Submission API', url: 'http://localhost:5003/health', required: true },
        { name: 'Inverter Details API', url: 'http://localhost:5002/api/stats', required: true },
        { name: 'WeatherMeter API', url: 'http://localhost:3000/meter', required: true }
    ];

    console.log('🔍 Checking required services...');
    console.log('');

    let allOk = true;

    for (const service of services) {
        try {
            await axios.get(service.url, { timeout: 3000 });
            console.log(`✅ ${service.name} - Running`);
        } catch (error) {
            console.log(`❌ ${service.name} - Not responding`);
            if (service.required) {
                allOk = false;
            }
        }
    }

    console.log('');

    if (!allOk) {
        console.error('⚠️  Some required services are not running!');
        console.error('');
        console.error('Please start all services:');
        console.error('');
        console.error('Terminal 1 - Inverter Details:');
        console.error('  cd Inverter_Details/server');
        console.error('  npm start');
        console.error('');
        console.error('Terminal 2 - WeatherMeter:');
        console.error('  cd WeatherMeterManagement/backend');
        console.error('  npm run start:dev');
        console.error('');
        console.error('Terminal 3 - Final Submission:');
        console.error('  cd Final_Submission/server');
        console.error('  npm start');
        console.error('');
        process.exit(1);
    }

    return true;
}

// Main execution
(async () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Final Submission - Excel Upload Test Script             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    await checkServices();
    await uploadFile();
})();
