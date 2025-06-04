import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// Using import for hpp with TypeScript definitions
import hpp from 'hpp';

/**
 * Middleware for sanitizing input parameters
 * Prevents parameter pollution and sanitizes user input
 */
@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Apply HTTP parameter pollution protection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    hpp()(req, res, next);
  }
}
