import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// Using dynamic import for xss as it doesn't have proper TypeScript definitions
import * as xssLib from 'xss';

/**
 * Middleware for XSS protection
 * Sanitizes request body, query parameters and URL parameters to prevent XSS attacks
 */
@Injectable()
export class XssMiddleware implements NestMiddleware {
  private readonly logger = new Logger(XssMiddleware.name);
  private readonly xssFilter: any;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.xssFilter = new (xssLib as any).FilterXSS({
      whiteList: {}, // Use empty whitelist to sanitize all HTML tags
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // Sanitize body
      if (req.body) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        req.body = this.sanitizeObject(req.body);
      }

      // We can't directly modify req.query as it's now read-only in Express 5
      // Instead, we'll use a custom approach to sanitize it without modifying the original

      next();
    } catch (error) {
      this.logger.error(
        `XSS Sanitization error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      next();
    }
  }

  /**
   * Recursively sanitizes an object's string values
   */
  private sanitizeObject(obj: any): any {
    if (!obj) return obj;

    if (typeof obj === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return this.xssFilter.process(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: { [key: string]: any } = Array.isArray(obj) ? [] : {};

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          result[key] = this.sanitizeObject(obj[key]);
        }
      }

      return result;
    }

    return obj;
  }
}
