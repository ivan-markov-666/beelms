import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { Inject } from '@nestjs/common';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly DEFAULT_RATE_LIMIT: number;
  private readonly DEFAULT_RATE_WINDOW_SECONDS: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {
    this.DEFAULT_RATE_LIMIT = this.configService.get<number>(
      'DEFAULT_RATE_LIMIT',
      100,
    );
    this.DEFAULT_RATE_WINDOW_SECONDS = this.configService.get<number>(
      'DEFAULT_RATE_WINDOW_SECONDS',
      60,
    );
  }

  /**
   * Проверява дали заявката надвишава лимита и актуализира брояча
   * @param key Уникален идентификатор (например IP адрес или userId)
   * @param route Маршрут на заявката за специфични ограничения
   * @returns true ако заявката е разрешена, false ако е надвишен лимитът
   */
  async checkRateLimit(key: string, route?: string): Promise<boolean> {
    try {
      const redis = this.redisService.client;
      const rateKey = route ? `rate:${key}:${route}` : `rate:${key}`;
      const now = Date.now();

      // Use proper casing for Redis methods
      const multi = redis.multi();
      // Correct method names with proper casing
      multi.zAdd(rateKey, { score: now, value: now.toString() });
      multi.zRangeByScore(
        rateKey,
        '-inf',
        now - this.DEFAULT_RATE_WINDOW_SECONDS * 1000,
      );
      multi.zRemRangeByScore(
        rateKey,
        '-inf',
        now - this.DEFAULT_RATE_WINDOW_SECONDS * 1000,
      );
      multi.expire(rateKey, this.DEFAULT_RATE_WINDOW_SECONDS);

      const result = await multi.exec();

      const requestCount = (result[1] as number[]).length;

      const limit = this.getLimitForRoute(route);

      if (requestCount >= limit) {
        this.logger.warn(
          `Rate limit exceeded for ${key} on route ${route || 'all'}: ${requestCount}/${limit}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error in rate limiting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Връща специфичен лимит за определен маршрут или подразбиращия се лимит
   */
  private getLimitForRoute(route?: string): number {
    if (!route) {
      return this.DEFAULT_RATE_LIMIT;
    }

    // Тук можете да добавите специфични лимити за различни маршрути
    const routeLimits: Record<string, number> = {
      '/auth/login': 10, // По-строг лимит за опити за вписване
      '/auth/register': 5, // Много строг лимит за регистрации
      '/auth/password-reset': 3, // Много строг лимит за заявки за рестартиране на парола
    };

    // Use explicit check and return to avoid formatting issues
    if (route in routeLimits) {
      return routeLimits[route];
    }

    return this.DEFAULT_RATE_LIMIT;
  }

  /**
   * Нулира брояча за даден ключ
   */
  async resetRateLimit(key: string, route?: string): Promise<void> {
    const redis = this.redisService.client;
    const rateKey = route ? `rate:${key}:${route}` : `rate:${key}`;

    await redis.del(rateKey);
  }
}
