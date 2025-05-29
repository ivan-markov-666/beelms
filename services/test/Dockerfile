FROM node:20-alpine

WORKDIR /app

# За неразработени сървиси или за първоначално стартиране
# Създаваме минимално приложение
RUN echo '{ \
  "name": "microservice", \
  "version": "0.1.0", \
  "scripts": { \
    "start": "node server.js", \
    "start:dev": "node server.js" \
  } \
}' > package.json

RUN echo 'console.log("Service running on port 3000");\
const http = require("http");\
http.createServer((req, res) => {\
  res.writeHead(200, {"Content-Type": "application/json"});\
  res.end(JSON.stringify({status: "ok", service: "placeholder"}));\
}).listen(3000);' > server.js

EXPOSE 3000

CMD ["npm", "run", "start:dev"]