import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: this.configService.get<string>('redis.host'),
        port: this.configService.get<number>('redis.port'),
      },
      password: this.configService.get<string>('redis.password'),
    });

    this.client.on('error', (err) => {
      console.error('Redis client error', err);
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expiresIn?: number): Promise<void> {
    if (expiresIn) {
      await this.client.set(key, value, { EX: expiresIn });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    await this.set(`blacklist:${token}`, 'revoked', expiresIn);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.get(`blacklist:${token}`);
    return result !== null;
  }

  async exists(key: string): Promise<number> {
    const value = await this.get(key);
    return value !== null ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const currentValue = await this.get(key);
    const newValue = currentValue ? parseInt(currentValue, 10) + 1 : 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const value = await this.get(key);
    if (value !== null) {
      await this.set(key, value, seconds);
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }
}
