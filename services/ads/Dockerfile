# services/ads/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# In development mode, we'll mount the local files as volumes
# instead of copying them during the build
# COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
