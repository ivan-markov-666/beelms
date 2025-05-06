import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', 'redis'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD', ''),
        ttl: configService.get<number>('CACHE_TTL', 60 * 60), // По подразбиране 1 час
        max: configService.get<number>('CACHE_MAX_ITEMS', 10000),
        isGlobal: true,
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
