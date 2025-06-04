import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter: any;

  constructor(private configService: ConfigService) {
    // Създаване на rate limiter с конфигурируеми параметри
    const windowMs = this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000); // 15 минути по подразбиране
    const maxRequests = this.configService.get<number>('RATE_LIMIT_MAX', 100); // 100 заявки по подразбиране

    this.limiter = rateLimit({
      windowMs,
      max: maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: 'Твърде много заявки, моля опитайте отново по-късно',
        error: 'too_many_requests',
        statusCode: 429,
      },
      // Дистинкция на потребителите по IP адрес
      keyGenerator: (req: Request) => {
        // Използване на X-Forwarded-For заглавка, ако е налична (зад прокси)
        const ip = req.ip || 
                   (req.headers['x-forwarded-for'] as string) || 
                   req.socket.remoteAddress || 
                   'unknown-ip';
                   
        return ip;
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Прилагане на rate limiting за всички маршрути
    this.limiter(req, res, next);
  }
}
