const https = require('https');

const body = JSON.stringify({
  path: "seedFeaturedTravelers:seedAll",
  args: {},
  format: "json"
});

const options = {
  hostname: 'warmhearted-lion-878.convex.cloud',
  port: 443,
  path: '/api/mutation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Convex-Client': 'npm-1.0.0'
  }
};

console.log('Calling Convex seed mutation...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.status === 'success') {
        console.log('✅ Seed successful!');
        console.log(JSON.stringify(result.value, null, 2));
      } else {
        console.error('❌ Seed failed:', JSON.stringify(result, null, 2));
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(body);
req.end();
