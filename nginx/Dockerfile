FROM nginx:1.25-alpine

# Проверка дали nginx.conf съществува, ако не - създаване на прост такъв
RUN [ -f /etc/nginx/nginx.conf ] || echo 'events {\n  worker_connections 1024;\n}\n\nhttp {\n  server {\n    listen 80;\n    location / {\n      return 200 "Nginx placeholder running";\n    }\n  }\n}' > /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]