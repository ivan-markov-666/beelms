FROM node:20-alpine

WORKDIR /app

# За неразработен frontend или за първоначално стартиране
RUN echo '{ \
  "name": "frontend", \
  "version": "0.1.0", \
  "scripts": { \
    "start": "node server.js" \
  } \
}' > package.json

RUN echo 'console.log("Frontend running on port 3000");\
const http = require("http");\
http.createServer((req, res) => {\
  res.writeHead(200, {"Content-Type": "text/html"});\
  res.end("<html><body><h1>Frontend Placeholder</h1><p>This is a temporary frontend.</p></body></html>");\
}).listen(3000);' > server.js

EXPOSE 3000

CMD ["npm", "start"]