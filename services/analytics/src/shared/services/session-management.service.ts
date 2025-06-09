import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

interface SessionInfo {
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
}

@Injectable()
export class SessionManagementService implements OnModuleInit {
  private readonly logger = new Logger(SessionManagementService.name);
  private redisClient: Redis;
  private readonly sessionDuration: number; // в милисекунди
  private readonly sessionInactivityTimeout: number; // в милисекунди

  constructor(private configService: ConfigService) {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    const redisConfig: Record<string, unknown> = {
      host: redisHost,
      port: redisPort,
      keyPrefix: 'session:',
      maxRetriesPerRequest: 3,
    };

    if (redisPassword) {
      redisConfig.password = redisPassword;
    }

    this.redisClient = new Redis(redisConfig);

    this.sessionDuration = this.configService.get(
      'SESSION_DURATION_MS',
      86400000,
    ); // 24 часа по подразбиране

    this.sessionInactivityTimeout = this.configService.get(
      'SESSION_INACTIVITY_TIMEOUT_MS',
      1800000,
    ); // 30 минути по подразбиране
  }

  onModuleInit(): void {
    // Стартираме периодично почистване на изтекли сесии на всеки час
    setInterval(() => {
      void this.cleanupExpiredSessions();
    }, 3600000); // 1 час
  }

  /**
   * Създава нова сесия
   */
  async createSession(userId: string): Promise<string> {
    try {
      const sessionId = this.generateSessionId();
      const now = Date.now();

      const sessionInfo = {
        userId,
        createdAt: now,
        expiresAt: now + this.sessionDuration,
        lastActivityAt: now,
      };

      await this.redisClient.set(
        sessionId,
        JSON.stringify(sessionInfo),
        'EX',
        Math.ceil(this.sessionDuration / 1000),
      );

      return sessionId;
    } catch (error) {
      this.logger.error(
        `Грешка при създаване на сесия за потребител ${userId}: ${(error as Error).message}`,
      );
      throw new Error('Неуспешно създаване на сесия');
    }
  }

  /**
   * Проверява валидността на сесия и обновява timestamp-а за последна активност
   */
  async validateSession(
    sessionId: string,
  ): Promise<{ valid: boolean; userId?: string }> {
    try {
      const sessionData = await this.redisClient.get(sessionId);
      if (!sessionData) {
        return { valid: false };
      }

      const sessionInfo = JSON.parse(sessionData) as SessionInfo;
      const now = Date.now();

      // Проверка за изтекла сесия
      if (sessionInfo.expiresAt < now) {
        await this.redisClient.del(sessionId);
        return { valid: false };
      }

      // Проверка за неактивност
      if (now - sessionInfo.lastActivityAt > this.sessionInactivityTimeout) {
        await this.redisClient.del(sessionId);
        return { valid: false };
      }

      // Обновяваме времето на последна активност
      sessionInfo.lastActivityAt = now;

      // Обновяваме сесията в Redis със същото време на изтичане
      const remainingTime = Math.max(
        0,
        Math.ceil((sessionInfo.expiresAt - Date.now()) / 1000),
      );

      await this.redisClient.set(
        sessionId,
        JSON.stringify(sessionInfo),
        'EX',
        remainingTime,
      );

      return { valid: true, userId: sessionInfo.userId };
    } catch (error) {
      this.logger.error(
        `Грешка при валидиране на сесия ${sessionId}: ${(error as Error).message}`,
      );
      return { valid: false };
    }
  }

  /**
   * Обновява времето на последна активност за сесия
   */
  async updateSessionActivity(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.redisClient.get(sessionId);

      if (!sessionData) {
        return false;
      }

      const sessionInfo = JSON.parse(sessionData) as SessionInfo;

      // Обновяваме времето на последна активност
      sessionInfo.lastActivityAt = Date.now();

      // Обновяваме сесията в Redis със същото време на изтичане
      const remainingTime = Math.max(
        0,
        Math.ceil((sessionInfo.expiresAt - Date.now()) / 1000),
      );

      await this.redisClient.set(
        sessionId,
        JSON.stringify(sessionInfo),
        'EX',
        remainingTime,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Грешка при валидиране на сесия ${sessionId}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Прекратява сесия
   */
  async terminateSession(sessionId: string): Promise<boolean> {
    try {
      await this.redisClient.del(sessionId);
      return true;
    } catch (error) {
      this.logger.error(
        `Грешка при прекратяване на сесия ${sessionId}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Прекратява всички сесии на конкретен потребител
   */
  async terminateAllUserSessions(userId: string): Promise<boolean> {
    try {
      // Сканираме всички ключове за сесии
      const stream = this.redisClient.scanStream({
        match: '*',
        count: 100,
      });

      // Създаваме нов Promise, който ще се resolve когато scan операцията приключи
      await new Promise<void>((resolve) => {
        stream.on('data', (keys: string[]) => {
          // Използваме IIFE, за да можем да използваме async/await вътре в callback
          void (async () => {
            for (const key of keys) {
              try {
                const sessionData = await this.redisClient.get(key);
                if (!sessionData) continue;

                const sessionInfo = JSON.parse(sessionData) as SessionInfo;

                if (sessionInfo.userId === userId) {
                  await this.redisClient.del(key);
                  this.logger.debug(
                    `Прекратена сесия ${key} за потребител ${userId}`,
                  );
                }
              } catch {
                // Игнорираме индивидуални грешки при обработката на ключове
              }
            }
          })();
        });

        stream.on('end', () => {
          resolve();
        });
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Грешка при прекратяване на сесиите за потребител ${userId}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Почиства изтеклите сесии
   */
  /**
   * Генерира уникален идентификатор за сесия
   */
  private generateSessionId(): string {
    return uuidv4();
  }

  /**
   * Почиства изтеклите сесии
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = Date.now();
      let expiredCount = 0;
      let inactiveCount = 0;

      // Сканираме всички ключове за сесии
      const stream = this.redisClient.scanStream({
        match: '*',
        count: 100,
      });

      // Създаваме Promise, който ще се resolve когато сканирането приключи
      await new Promise<void>((resolve) => {
        stream.on('data', (keys: string[]) => {
          // Използваме IIFE, за да можем да използваме async/await вътре в callback
          void (async () => {
            for (const key of keys) {
              try {
                const sessionData = await this.redisClient.get(key);
                if (!sessionData) continue;

                const sessionInfo = JSON.parse(sessionData) as SessionInfo;
                const userId = sessionInfo.userId;

                // Проверка дали сесията е изтекла
                if (now > sessionInfo.expiresAt) {
                  await this.redisClient.del(key);
                  expiredCount++;
                  this.logger.debug(
                    `Прекратена сесия ${key} за потребител ${userId}`,
                  );
                }
                // Проверка за неактивност
                else if (
                  now - sessionInfo.lastActivityAt >
                  this.sessionInactivityTimeout
                ) {
                  await this.redisClient.del(key);
                  inactiveCount++;
                  this.logger.debug(
                    `Прекратена сесия ${key} за потребител ${userId}`,
                  );
                }
              } catch {
                // Игнорираме индивидуални грешки при обработката на ключове
              }
            }
          })();
        });

        stream.on('end', () => {
          this.logger.log(
            `Почистени сесии: ${expiredCount} изтекли, ${inactiveCount} неактивни`,
          );
          resolve();
        });
      });
    } catch (error) {
      this.logger.error(
        `Грешка при почистване на изтеклите сесии: ${(error as Error).message}`,
      );
    }
  }
}
