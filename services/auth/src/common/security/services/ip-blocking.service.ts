import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class IpBlockingService {
  private readonly logger = new Logger(IpBlockingService.name);
  private readonly maxFailedAttempts: number;
  private readonly ipBlockDurationSeconds: number;
  private readonly failedAttemptExpirySeconds: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.maxFailedAttempts = configService.get<number>(
      'MAX_FAILED_ATTEMPTS',
      5,
    );
    this.ipBlockDurationSeconds = configService.get<number>(
      'IP_BLOCK_DURATION_SECONDS',
      3600,
    );
    this.failedAttemptExpirySeconds = configService.get<number>(
      'FAILED_ATTEMPT_EXPIRY_SECONDS',
      1800,
    );
  }

  /**
   * Проверява дали IP адресът е блокиран
   */
  async isBlocked(ip: string): Promise<boolean> {
    try {
      const blockKey = `blocked:${ip}`;
      const exists = await this.redisService.exists(blockKey);
      return exists === 1;
    } catch (error) {
      this.logger.error(
        `Error checking if IP is blocked: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false; // По подразбиране не е блокирано при грешка, за да не блокираме легитимни потребители
    }
  }

  /**
   * Записва неуспешен опит от IP адрес
   */
  async recordFailedAttempt(ip: string): Promise<void> {
    try {
      const attemptsKey = `failed_attempts:${ip}`;

      // Увеличаване на брояча за неуспешни опити
      const attempts = await this.redisService.incr(attemptsKey);

      // Задаване на време за изтичане на брояча ако това е първият опит
      if (attempts === 1) {
        await this.redisService.expire(
          attemptsKey,
          this.failedAttemptExpirySeconds,
        );
      }

      this.logger.debug(
        `Recorded failed attempt for IP ${ip}. Total: ${attempts}`,
      );

      // Блокиране на IP адреса, ако е надвишен лимитът
      if (attempts >= this.maxFailedAttempts) {
        await this.blockIp(ip);
        await this.redisService.del(attemptsKey); // Изчистване на брояча след блокиране
      }
    } catch (error) {
      this.logger.error(
        `Error recording failed attempt: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Блокира IP адрес за определено време
   */
  async blockIp(ip: string): Promise<void> {
    try {
      const blockKey = `blocked:${ip}`;

      await this.redisService.set(blockKey, '1');
      await this.redisService.expire(blockKey, this.ipBlockDurationSeconds);

      this.logger.warn(
        `Blocked IP ${ip} for ${this.ipBlockDurationSeconds} seconds`,
      );
    } catch (error) {
      this.logger.error(
        `Error blocking IP: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Деблокира IP адрес
   */
  async unblockIp(ip: string): Promise<void> {
    try {
      const blockKey = `blocked:${ip}`;

      await this.redisService.del(blockKey);
      this.logger.log(`IP ${ip} has been unblocked`);
    } catch (error) {
      this.logger.error(
        `Error unblocking IP: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
