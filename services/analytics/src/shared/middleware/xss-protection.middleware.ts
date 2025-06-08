import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type Sanitizable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Sanitizable[]
  | { [key: string]: Sanitizable };

/**
 * XSS Protection Middleware
 *
 * This middleware sanitizes request body to prevent Cross-Site Scripting (XSS) attacks.
 */
@Injectable()
export class XssProtectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    try {
      if (req.body) {
        req.body = this.sanitizeData(req.body) as Record<string, unknown>;
      }
      next();
    } catch (error) {
      console.error('XSS Protection error:', error);
      next();
    }
  }

  private sanitizeData<T extends Sanitizable>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item)) as T;
    }

    if (typeof data === 'object') {
      const sanitizedData: Record<string, Sanitizable> = {};
      Object.entries(data as Record<string, Sanitizable>).forEach(
        ([key, value]) => {
          sanitizedData[key] = this.sanitizeData(value);
        },
      );
      return sanitizedData as T;
    }

    if (typeof data === 'string') {
      return this.sanitizeString(data) as T;
    }

    return data;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/`/g, '&#96;');
  }
}
