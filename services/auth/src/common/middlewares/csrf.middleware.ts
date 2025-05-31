import { Injectable, NestMiddleware } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

// Разширяваме типа Request за Express
type RequestWithCookies = Request & {
  cookies?: Record<string, string>;
};

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(
    req: RequestWithCookies,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // Пропускаме CSRF защитата за GET заявки, които са по принцип безопасни
    if (req.method === 'GET') {
      // Проверяваме дали има cookies и csrfToken
      const cookies = req.cookies as Record<string, string> | undefined;
      if (!cookies || !cookies.csrfToken) {
        const token = this.generateToken();
        res.cookie('csrfToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000, // 24 часа
        });

        // Съхраняваме токена в Redis за валидация
        await this.redisService.set(`csrf:${token}`, 'valid', 24 * 60 * 60);
      }
      return next();
    }

    // За всички останали заявки (POST, PUT, DELETE) изискваме CSRF токен
    // Изваждаме токена от cookies
    const cookies = req.cookies as Record<string, string> | undefined;
    const cookieToken = cookies ? cookies.csrfToken : undefined;
    const headerToken = req.headers['x-csrf-token'] as string;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      res.status(403).json({
        message: 'Невалиден или липсващ CSRF токен',
      });
      return;
    }

    // Проверяваме дали токенът съществува в Redis
    const isValid = await this.redisService.get(`csrf:${cookieToken}`);
    if (!isValid) {
      res.status(403).json({
        message: 'Невалиден CSRF токен',
      });
      return;
    }

    next();
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
