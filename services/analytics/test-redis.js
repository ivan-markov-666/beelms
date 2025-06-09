// Simple Redis connection test
const Redis = require('ioredis');
require('dotenv').config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD;

console.log('Redis connection test:');
console.log(`Host: ${redisHost}`);
console.log(`Port: ${redisPort}`);
console.log(`Password: ${redisPassword ? '******' : 'Not set'}`);

const redisConfig = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: 3,
};

if (redisPassword) {
  redisConfig.password = redisPassword;
  console.log('Using password authentication');
}

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  console.log('Successfully connected to Redis');
  redisClient.set('test-key', 'Hello from Redis test', (err) => {
    if (err) {
      console.error('Error setting test key:', err);
    } else {
      console.log('Test key set successfully');
      redisClient.get('test-key', (err, result) => {
        if (err) {
          console.error('Error getting test key:', err);
        } else {
          console.log('Test key value:', result);
          redisClient.quit();
        }
      });
    }
  });
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});
