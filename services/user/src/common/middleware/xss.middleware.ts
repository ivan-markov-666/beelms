import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as xssLib from 'xss';
import { SecurityMonitorService } from '../services/security-monitor.service';

/**
 * Middleware for XSS protection
 * Sanitizes request body, query parameters and URL parameters to prevent XSS attacks
 */
@Injectable()
export class XssMiddleware implements NestMiddleware {
  private readonly logger = new Logger(XssMiddleware.name);
  private readonly xssFilter: {
    process: (html: string) => string;
  };

  constructor(private readonly securityMonitor: SecurityMonitorService) {
    // Configure XSS filter with strict rules
    this.xssFilter = new (
      xssLib as {
        FilterXSS: new (options: unknown) => {
          process: (html: string) => string;
        };
      }
    ).FilterXSS({
      // XSS filter configuration
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
      allowCommentTag: false,
      css: false,
      stripBlankChar: true,
      whiteList: {
        a: ['href', 'title', 'target', 'rel', 'noreferrer', 'noopener'],
        p: [],
        br: [],
        ul: [],
        ol: [],
        li: [],
        strong: [],
        em: [],
        u: [],
        blockquote: [],
      },
    });

    // No logging or security events during initialization to keep logs completely clean
  }

  private sanitizeObject(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        sanitized[key] = value;
        continue;
      }

      // Handle strings
      if (typeof value === 'string') {
        sanitized[key] = this.xssFilter.process(value);
      }
      // Handle nested objects
      else if (typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        const sanitizedArray = value.map((item: unknown) => {
          if (typeof item === 'string') {
            return this.xssFilter.process(item);
          }
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            return this.sanitizeObject(item as Record<string, unknown>);
          }
          return item;
        });
        sanitized[key] = sanitizedArray;
      }
      // Pass through other types as-is
      else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  public use(req: Request, _res: Response, next: NextFunction): void {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(
          JSON.parse(JSON.stringify(req.body)) as Record<string, unknown>,
        );
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        const sanitizedQuery = this.sanitizeObject(
          JSON.parse(JSON.stringify(req.query)) as Record<string, unknown>,
        );
        // Replace query parameters with sanitized version
        Object.keys(req.query).forEach((key) => {
          delete req.query[key];
        });
        Object.assign(req.query, sanitizedQuery);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        const sanitizedParams = this.sanitizeObject(
          JSON.parse(JSON.stringify(req.params)) as Record<string, unknown>,
        );
        // Replace URL parameters with sanitized version
        Object.keys(req.params).forEach((key) => {
          delete req.params[key];
        });
        Object.assign(req.params, sanitizedParams);
      }

      next();
    } catch (error) {
      this.logger.error('XSS Middleware Error:', error);
      next(error);
    }
  }
}
