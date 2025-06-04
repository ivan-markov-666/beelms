import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// Using import for helmet to fix TypeScript compatibility issues
import helmet from 'helmet';

/**
 * Middleware for HTTP security headers
 * Sets various HTTP headers to improve security
 */
@Injectable()
export class HelmetMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Apply Helmet with configured CSP directives

    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      xssFilter: true,
      noSniff: true,
      frameguard: {
        action: 'deny',
      },
    })(req, res, next);
  }
}
