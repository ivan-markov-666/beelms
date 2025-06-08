import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';

type RequestHandler = (
  req: Request,
  res: Response,
  next: (err?: Error) => void,
) => void;

/**
 * CSRF Protection Middleware
 *
 * This middleware implements CSRF protection to prevent cross-site request forgery attacks.
 * It uses cookies to store the CSRF token.
 */
@Injectable()
export class CsrfProtectionMiddleware implements NestMiddleware {
  private readonly csrfMiddleware: RequestHandler[];

  constructor() {
    // Initialize cookie-parser and csurf middleware
    this.csrfMiddleware = [
      cookieParser() as unknown as RequestHandler,
      csurf({
        cookie: {
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production', // Only use secure in production
        },
      }) as unknown as RequestHandler,
    ];
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Apply cookie parser first, then CSRF protection
    const applyMiddleware = (
      middlewares: RequestHandler[],
      index: number,
    ): void => {
      if (index >= middlewares.length) {
        return next();
      }

      middlewares[index](req, res, (err?: Error) => {
        if (err) {
          return next(err as unknown as Error);
        }
        applyMiddleware(middlewares, index + 1);
      });
    };

    // Start applying the middleware chain
    applyMiddleware(this.csrfMiddleware, 0);
  }
}
