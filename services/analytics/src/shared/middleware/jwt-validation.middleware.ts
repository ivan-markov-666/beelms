import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { JwtPayload } from '../../auth/types/auth.types';

type ErrorWithName = {
  name?: string;
  message?: string;
};

/**
 * JWT валидационен middleware
 * Проверява дали JWT токенът е валиден и не е в черния списък
 * @implements {NestMiddleware}
 */
@Injectable()
export class JwtValidationMiddleware implements NestMiddleware {
  private redisClient: Redis | null = null;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Свързваме се с Redis за проверка на черния списък с токени
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    try {
      const redisConfig: Record<string, any> = {
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: 3,
      };

      // Добавяме парола само ако е конфигурирана
      if (redisPassword) {
        redisConfig.password = redisPassword;
      }

      this.redisClient = new Redis(redisConfig);

      // Добавяме обработчик на грешки за справяне със ситуацията, когато автентикацията е изискуема
      this.redisClient.on('error', (err) => {
        if (
          err.message &&
          err.message.includes('NOAUTH Authentication required')
        ) {
          console.error(
            'Redis изисква автентикация. Моля, добавете REDIS_PASSWORD в конфигурацията.',
          );
          // Нулираме клиента, за да предотвратим грешки при следващи операции
          this.redisClient = null;
        } else {
          console.error('Грешка при комуникация с Redis:', err);
        }
      });
    } catch (redisError) {
      console.warn(
        'Не можахме да се свържем с Redis, JWT черен списък няма да работи:',
        redisError,
      );
      // При грешка с инициализацията, нулираме клиента
      this.redisClient = null;
    }
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = req.path;

    // Проверяваме дали пътя е публичен и не изисква JWT валидация
    if (this.isPublicRoute(path)) {
      return next();
    }

    try {
      // Извличаме JWT токена от заглавката Authorization
      const authHeader = req.header('Authorization');

      if (!authHeader) {
        throw new UnauthorizedException('Липсва JWT токен');
      }

      const token = authHeader.replace('Bearer ', '');

      // Проверяваме дали токенът не е в черния списък
      const isBlacklisted = await this.checkIfTokenIsBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('JWT токенът е в черния списък');
      }

      try {
        // Валидираме JWT токена
        const payload = this.jwtService.verify<JwtPayload>(token);

        // Запазваме данните от токена в request обекта за по-нататъшна употреба
        req.user = {
          userId: (payload.userId || payload.sub || '').toString(),
          email: payload.email || '',
          roles: payload.roles || [],
        };

        // Логваме успешното удостоверяване
        console.log(
          `JWT токен валидиран успешно за потребител: ${payload.email}`,
        );
      } catch (error) {
        const err = error as ErrorWithName;
        // Проверяваме за конкретен тип грешка при изтекъл токен
        if (err?.name === 'TokenExpiredError') {
          throw new UnauthorizedException('JWT токенът е изтекъл');
        }
        throw new UnauthorizedException('Невалиден JWT токен');
      }

      next();
    } catch (error) {
      // Логваме грешката и я подаваме на следващия middleware/handler
      const err = error as ErrorWithName;
      const errorMessage = err?.message || 'Неизвестна грешка';

      console.error('Грешка при валидация на JWT токен:', errorMessage);
      next(error);
    }
  }

  private isPublicRoute(path: string): boolean {
    // Масив с публични пътища, които не изискват JWT валидация
    const publicRoutes = [
      '/api/docs',
      '/health',
      '/api/security/csp-violation',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/refresh-token',
      '/api/prompts.json',
      // добавете други публични пътища тук
    ];

    // Премахваме всички параметри от URL пътя преди сравнение
    const pathWithoutQuery = path.split('?')[0];

    // Проверяваме дали пътя започва с някой от публичните маршрути
    return publicRoutes.some(
      (route) =>
        pathWithoutQuery === route || pathWithoutQuery.startsWith(route + '/'),
    );
  }

  private async checkIfTokenIsBlacklisted(token: string): Promise<boolean> {
    if (!this.redisClient) {
      // Ако нямаме връзка с Redis, предполагаме, че токенът не е в черния списък
      return false;
    }

    try {
      // Проверяваме дали токенът е в черния списък в Redis
      const isBlacklisted = await this.redisClient.exists(`blacklist:${token}`);
      return isBlacklisted === 1;
    } catch (error) {
      console.error('Грешка при проверка на черния списък в Redis:', error);
      // При грешка в Redis допускаме токена (за да не блокираме всички потребители)
      // но трябва да имплементираме по-добър failover механизъм в реална система
      return false;
    }
  }
}
