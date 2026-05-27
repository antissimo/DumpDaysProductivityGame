const http = require('http');
const data = JSON.stringify({ name: 'TestUser', score: 12345, ts: new Date().toISOString() });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/scores',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, res => {
  console.log('STATUS', res.statusCode);
  let body='';
  res.on('data', chunk => body+=chunk);
  res.on('end', () => { console.log('RESPONSE', body.slice(0,200)); });
});
req.on('error', err => { console.error('ERR', err); });
req.write(data);
req.end();
