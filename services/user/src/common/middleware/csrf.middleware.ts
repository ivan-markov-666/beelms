import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';
import {
  SecurityMonitorService,
  SecurityEventType,
} from '../services/security-monitor.service';

// Разширяваме Request типа, за да включва user с id
interface RequestWithUser extends Request {
  user?: { id: string };
  csrfToken(): string;
}

// Дефинираме тип за CSRF грешки
interface CsrfError extends Error {
  code?: string;
}

// Типът с метода csrfToken и user обект се дефинира в RequestWithUser

/**
 * Middleware за защита от CSRF атаки
 * Генерира CSRF токен, който трябва да бъде включен във всички заявки,
 * модифициращи данни (POST, PUT, PATCH, DELETE)
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: (
    req: Request,
    res: Response,
    next: (err?: Error) => void,
  ) => void;

  constructor(
    private readonly logger: Logger,
    private readonly securityMonitor: SecurityMonitorService,
  ) {
    // Use type assertion to fix linting issues with the csurf package
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const csrfMiddleware = csurf({
      cookie: {
        httpOnly: true,
        sameSite: 'strict' as const,
        secure: process.env.NODE_ENV === 'production',
      },
    }) as unknown;

    this.csrfProtection = csrfMiddleware as (
      req: Request,
      res: Response,
      next: (err?: Error) => void,
    ) => void;
  }

  use(req: RequestWithUser, res: Response, next: NextFunction): void {
    // CSRF защитата не е необходима за API endpoints които са използвани
    // от външни системи и се автентикират с API keys
    if (req.path.startsWith('/api/external')) {
      return next();
    }

    // CSRF защитата не се прилага за OAuth callbacks
    if (req.path.startsWith('/auth/oauth')) {
      return next();
    }

    // Прилагаме CSRF защита за всички останали routes
    this.csrfProtection(req, res, (err?: Error) => {
      if (err) {
        // Ако грешката е свързана с CSRF, логваме я и продължаваме
        // Използваме типово предположение за грешката
        const csrfError = err as CsrfError;
        if (csrfError.code === 'EBADCSRFTOKEN') {
          const errorMessage = csrfError.message || 'Invalid CSRF token';
          this.logger.error(
            `CSRF validation failed: ${errorMessage}`,
            csrfError.stack,
          );
          // Регистрираме security събитие
          this.securityMonitor.registerEvent({
            type: SecurityEventType.CSRF_VALIDATION_FAILED,
            timestamp: new Date(),
            ipAddress: req.ip || 'unknown',
            userId: req.user?.id,
            endpoint: req.path,
            metadata: {
              userAgent: req.headers['user-agent'],
              error: errorMessage,
            },
          });
          // Връщаме 403 Forbidden
          res.locals.csrfValidationFailed = true;
          next(csrfError);
          return;
        }
        // За други грешки, просто логваме и продължаваме
        this.logger.error('Middleware error:', err.message || 'Unknown error');
        return res.status(403).json({
          statusCode: 403,
          message: 'CSRF token validation failed',
          error: 'Forbidden',
        });
      }

      // Прикачваме CSRF токен към response обекта
      // за да може да бъде използван от frontend-a
      res.locals.csrfToken = req.csrfToken();
      // Добавяме CSRF токен в заглавието на отговора
      res.setHeader('X-CSRF-Token', req.csrfToken());

      next();
    });
  }
}
