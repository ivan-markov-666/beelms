import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * HTTPS Check Middleware
 *
 * Проверява дали връзката е през HTTPS в production режим.
 * Забележка: Този middleware е предназначен за работа с reverse proxy като Nginx,
 * който добавя 'X-Forwarded-Proto' хедър.
 */
@Injectable()
export class HttpsCheckMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // Проверяваме дали е настроена форсирана HTTPS проверка
      const enforceHttps =
        this.configService.get<string>('ENFORCE_HTTPS', 'true') === 'true';

      if (!enforceHttps) {
        return next();
      }

      // Проверяваме дали връзката е през HTTPS
      // Когато се използва reverse proxy като Nginx, проверяваме X-Forwarded-Proto хедъра
      const protocol =
        (req.headers['x-forwarded-proto'] as string) || req.protocol;

      if (protocol === 'https') {
        return next();
      }

      // При API заявки връщаме грешка
      if (req.path.startsWith('/api/')) {
        throw new ForbiddenException(
          'Изисква се HTTPS връзка за достъп до API',
        );
      }

      // За web заявки пренасочваме към HTTPS
      const host = req.headers.host || '';
      const redirectUrl = `https://${host}${req.originalUrl}`;
      res.redirect(301, redirectUrl);
    } catch (error) {
      next(error);
    }
  }
}
