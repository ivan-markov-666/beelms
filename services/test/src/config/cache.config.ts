import { CacheModuleOptions } from '@nestjs/cache-manager';
import { registerAs } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export default registerAs('cache', async (): Promise<CacheModuleOptions> => {
  const store = await redisStore({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10) * 1000, // Default TTL: 1 hour
  });

  return {
    store: store as any,
    isGlobal: true,
  };
});
