const https = require('https');

// To run: node scripts/list-models.js YOUR_API_KEY
const apiKey = process.argv[2];

if (!apiKey) {
    console.error('Please provide an API key as an argument.');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error('API Error:', json.error.message);
            } else {
                console.log('Available Models:');
                json.models.forEach(m => {
                    if (m.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`- ${m.name}`);
                    }
                });
            }
        } catch (e) {
            console.error('Failed to parse response:', e.message);
            console.log('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.error('Request error:', err.message);
});
