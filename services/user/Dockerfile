# services/user/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# В режим на разработка не копираме файловете, 
# вместо това ще ги монтираме от локалната система
# COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
