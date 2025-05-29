console.log('Frontend running on port 3000');
const http = require('http');
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Learning Platform</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Learning Platform Frontend</h1>
          <p>This is a temporary frontend placeholder.</p>
        </div>
      </body>
    </html>
  `);
  })
  .listen(3000);
