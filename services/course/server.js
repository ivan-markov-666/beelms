console.log('Service running on port 3000');
const http = require('http');
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'placeholder',
        message: 'This is a temporary service placeholder.',
      }),
    );
  })
  .listen(3000);
