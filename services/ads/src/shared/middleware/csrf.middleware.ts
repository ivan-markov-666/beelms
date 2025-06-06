import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csrf from 'csurf';
import {
  SecurityMonitorService,
  SecurityEventType,
} from '../services/security-monitor.service';

/**
 * Middleware за защита от CSRF атаки
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  private readonly csrfProtection = csrf({ cookie: true });

  constructor(private securityMonitor: SecurityMonitorService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Пропускаме CSRF проверката за GET заявки и заявки с определени пътища
    // напр. публични API endpoints или callbacks от външни системи
    if (req.method === 'GET' || this.isExemptPath(req.path)) {
      return next();
    }

    // CSRF проверка за всички останали заявки
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.csrfProtection(req, res, (err: unknown) => {
      if (err) {
        this.logger.warn(
          `CSRF validation failed for ${req.method} ${req.url} from IP: ${req.ip || '127.0.0.1'}`,
        );

        // Регистриране на събитието в SecurityMonitor
        this.securityMonitor.registerEvent({
          type: SecurityEventType.CSRF_VALIDATION_FAILED,
          timestamp: new Date(),
          ipAddress: req.ip ?? '127.0.0.1',
          endpoint: req.url,
          metadata: {
            method: req.method,
            level: 'warn',
          },
        });

        return res.status(403).json({
          statusCode: 403,
          message: 'CSRF token validation failed',
          error: 'Forbidden',
        });
      }

      next();
    });
  }

  /**
   * Проверява дали даден път е освободен от CSRF защита
   */
  private isExemptPath(path: string): boolean {
    // Пътища, които са освободени от CSRF защита
    const exemptPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token',
      '/api/ads/impression',
      '/api/ads/click',
      '/api/ads/random',
      // Други публични пътища
    ];

    return exemptPaths.some((exemptPath) => path.startsWith(exemptPath));
  }
}
