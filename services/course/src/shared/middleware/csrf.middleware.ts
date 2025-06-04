import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csrf from 'csurf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: any;

  constructor(private configService: ConfigService) {
    // Инициализиране на CSRF защитата със съответните настройки
    this.csrfProtection = csrf({
      cookie: {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'strict',
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Пропускане на CSRF защитата за определени маршрути (като публични API endpoints)
    if (
      req.path.includes('/api-docs') ||
      req.path.includes('/swagger') ||
      req.path === '/health'
    ) {
      return next();
    }

    // Прилагане на CSRF защита за всички останали маршрути
    this.csrfProtection(req, res, (err: any) => {
      if (err) {
        return res.status(403).json({
          message: 'CSRF валидацията е неуспешна',
          error: 'forbidden',
          statusCode: 403,
        });
      }
      next();
    });
  }
}
