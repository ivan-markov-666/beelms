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
    const redis = this.redisService.client;
    const rateKey = route ? `rate:${key}:${route}` : `rate:${key}`;

    // Получаване на текущия брой заявки
    const currentCount = await redis.get(rateKey);

    // Определяне на специфичен лимит за маршрута или използване на подразбиращия се
    const limit = this.getLimitForRoute(route);

    // Ако ключът не съществува, създаваме го и разрешаваме заявката
    if (!currentCount) {
      await redis.set(rateKey, '1', { EX: this.DEFAULT_RATE_WINDOW_SECONDS });
      return true;
    }

    const count = parseInt(currentCount, 10);

    // Проверка дали лимитът е достигнат
    if (count >= limit) {
      this.logger.warn(
        `Rate limit exceeded for ${key} on route ${route || 'all'}: ${count}/${limit}`,
      );
      return false;
    }

    // Увеличаване на брояча
    await redis.incr(rateKey);
    return true;
  }

  /**
   * Връща специфичен лимит за определен маршрут или подразбиращия се лимит
   */
  private getLimitForRoute(route?: string): number {
    if (!route) {
      return this.DEFAULT_RATE_LIMIT;
    }

    // Тук можете да добавите специфични лимити за различни маршрути
    const routeLimits = {
      '/auth/login': 10, // По-строг лимит за опити за вписване
      '/auth/register': 5, // Много строг лимит за регистрации
      '/auth/password-reset': 3, // Много строг лимит за заявки за рестартиране на парола
    };

    return routeLimits[route] || this.DEFAULT_RATE_LIMIT;
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
