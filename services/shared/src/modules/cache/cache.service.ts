import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // Добавяне на помощни методи, които улесняват работата с кеша

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = await this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  generateKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }

  // Методи за работа с групи ключове
  async deleteByPrefix(prefix: string): Promise<void> {
    // Забележка: Това изисква достъп до Redis клиент или специфична имплементация
    // Като алтернатива, можете да поддържате списък с ключове по префикс
    // Тук е само примерна имплементация
    const client = (this.cacheManager as any).store.getClient?.();
    if (client) {
      const keys = await client.keys(`${prefix}*`);
      if (keys.length > 0) {
        await client.del(keys);
      }
    }
  }
}
