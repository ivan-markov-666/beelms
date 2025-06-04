import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';

/**
 * Middleware за ограничаване на честотата на заявките (rate limiting)
 * Предпазва от brute force атаки, DoS атаки и прекомерно натоварване
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly limiter: any;

  constructor(private configService: ConfigService) {
    // Конфигуриране на rate limiter
    const windowMs =
      this.configService.get<number>('RATE_LIMIT_WINDOW_MS') || 15 * 60 * 1000; // 15 минути по подразбиране
    const maxRequests = this.configService.get<number>('RATE_LIMIT_MAX') || 100; // 100 заявки по подразбиране

    this.limiter = rateLimit({
      windowMs,
      max: maxRequests,
      standardHeaders: true, // Връща стандартните rate limit хедъри
      legacyHeaders: false, // Деактивира остарелите X-RateLimit хедъри
      message: {
        status: 429,
        message: 'Твърде много заявки. Моля опитайте по-късно.',
        error: 'Too Many Requests',
      },
      // Логване на блокирани заявки
      handler: (
        req: Request,
        res: Response,
        next: NextFunction,
        options: any,
      ) => {
        this.logger.warn(
          `Rate limit exceeded: ${req.ip} - ${req.method} ${req.url}`,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        res.status(options.statusCode).json(options.message);
      },
      // Определяне на ключ за ограничение на базата на IP адрес
      keyGenerator: (req: Request) => {
        return req.ip || 'unknown';
      },
      // Пропускане на някои пътища
      skip: (req: Request) => {
        // Статичните файлове и health check не подлежат на rate limiting
        return req.path.startsWith('/public/') || req.path === '/health';
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Прилагане на rate limiting middleware
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.limiter(req, res, next);
  }
}
