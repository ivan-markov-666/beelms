import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>(
        'REDIS_URL',
        'redis://localhost:6379',
      );
      this.logger.log(`Connecting to Redis at ${redisUrl}`);
      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err: Error) => {
        this.logger.error(`Redis Client Error: ${err.message}`, err.stack);
      });

      await this.client.connect();
      this.logger.log('Redis client connected successfully');
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to connect to Redis: ${err.message}`,
        err.stack,
      );
      // Не throw-ваме грешка, за да може приложението да стартира дори без Redis
      // Важните функционалности трябва да имат fallback механизъм
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Проверява дали ключ съществува в Redis
   * @param key Ключът, който да се провери
   * @returns true ако ключът съществува, false ако не
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error checking if key exists: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }

  /**
   * Увеличава стойността на ключ с 1
   * @param key Ключът, чиято стойност да се увеличи
   * @returns Новата стойност или null при грешка
   */
  async incr(key: string): Promise<number | null> {
    try {
      if (!this.isConnected()) {
        return null;
      }
      return await this.client.incr(key);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error incrementing key: ${err.message}`, err.stack);
      return null;
    }
  }

  /**
   * Задава стойност на ключ в Redis
   * @param key Ключът
   * @param value Стойността
   * @returns true при успех, false при грешка
   */
  async set(key: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }
      await this.client.set(key, value);
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error setting key: ${err.message}`, err.stack);
      return false;
    }
  }

  /**
   * Взима стойността на ключ от Redis
   * @param key Ключът
   * @returns Стойността или null при грешка или ако ключът не съществува
   */
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected()) {
        return null;
      }
      return await this.client.get(key);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error getting key: ${err.message}`, err.stack);
      return null;
    }
  }

  /**
   * Задава време за изтичане на ключ
   * @param key Ключът
   * @param seconds Секунди до изтичане
   * @returns true при успех, false при грешка
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }
      // Redis връща true ако ключът съществува и е зададен TTL, false ако не съществува
      return await this.client.expire(key, seconds);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error setting expiry: ${err.message}`, err.stack);
      return false;
    }
  }

  /**
   * Изтрива ключ от Redis
   * @param key Ключът, който да се изтрие
   * @returns true при успех, false при грешка
   */
  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }
      const result = await this.client.del(key);
      return result >= 1;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error deleting key: ${err.message}`, err.stack);
      return false;
    }
  }

  /**
   * Проверява дали Redis клиентът е свързан
   * @returns true ако е свързан, false ако не е
   */
  private isConnected(): boolean {
    if (!this.client || !this.client.isOpen) {
      this.logger.warn('Redis client is not connected');
      return false;
    }
    return true;
  }
}
