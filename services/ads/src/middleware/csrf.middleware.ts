import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { doubleCsrf, DoubleCsrfConfigOptions } from 'csrf-csrf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void;
  private generateToken: (req: Request, res: Response) => string;

  constructor(private configService: ConfigService) {
    // Конфигурация на CSRF защитата
    const csrfOptions: DoubleCsrfConfigOptions = {
      getSecret: () => this.configService.get<string>('CSRF_SECRET') || 'default-csrf-secret-key',
      cookieName: 'x-csrf-token',
      cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        path: '/',
      },
      size: 64, // размер на токена в байтове
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
      getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
      // Добавяне на задължителния getSessionIdentifier
      getSessionIdentifier: (req: Request) => req.ip || 'default-session',
    };
    
    const csrfUtilities = doubleCsrf(csrfOptions);

    this.csrfProtection = csrfUtilities.doubleCsrfProtection;
    // Явно привеждане на типа за generateToken
    this.generateToken = csrfUtilities['generateToken'] as (req: Request, res: Response) => string;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Проверяваме дали заявката е от тип, който трябва да бъде защитен
    const method = req.method;
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      // За тези методи автоматично генерираме нов CSRF токен и го прикачваме към отговора
      try {
        const csrfToken = this.generateToken(req, res);
        // Добавяме токена и като HTTP хедър, който фронтендът може да прочете
        res.setHeader('X-CSRF-Token', csrfToken);
        next();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('CSRF error');
        next(error);
      }
    } else {
      // За останалите методи (POST, PUT, DELETE, PATCH) проверяваме за валиден CSRF токен
      try {
        this.csrfProtection(req, res, next);
      } catch (err) {
        // Специфична обработка на CSRF грешките
        console.error('CSRF грешка:', err);
        res.status(403).json({
          statusCode: 403,
          message: 'Невалиден или липсващ CSRF токен',
          error: 'Forbidden',
        });
      }
    }
  }
}
