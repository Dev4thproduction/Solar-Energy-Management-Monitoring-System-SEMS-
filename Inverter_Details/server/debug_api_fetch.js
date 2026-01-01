const http = require('http');

http.get('http://localhost:5003/api/inverter/records?limit=1', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
}).on('error', err => {
    console.error('Error:', err.message);
});
