import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';

// Типът за безопасен обект
type SafeObject = Record<string, unknown> | unknown[];
// Типът за входящи данни
type SafeValue = string | number | boolean | null | undefined | SafeObject;

@Injectable()
export class XssMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Добавяме основни XSS защитни хедъри
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

    // В продукционен режим, добавяме строги Content Security Policy хедъри
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'; form-action 'self'",
      );
    }

    // Санитизиране на входните данни в body
    if (req.body) {
      // Използваме безопасно типизиране за body
      const sanitizedBody = this.sanitizeObject(
        req.body as unknown as SafeObject,
      );
      req.body = sanitizedBody as Record<string, unknown>;
    }

    // Санитизиране на входните данни в query параметрите
    if (req.query) {
      // Използваме тип от Express Query
      const sanitizedQuery = this.sanitizeObject(
        req.query as unknown as SafeObject,
      );
      // Използваме типа ParsedQs от Express за безопасно присвояване
      req.query = sanitizedQuery as unknown as ParsedQs;
    }

    next();
  }

  private sanitizeObject(obj: SafeValue): SafeValue {
    if (obj === null || typeof obj !== 'object') {
      return this.sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item: SafeValue) => this.sanitizeObject(item));
    }

    const sanitized: Record<string, SafeValue> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const objRecord = obj as Record<string, SafeValue>;
        sanitized[key] = this.sanitizeObject(objRecord[key]);
      }
    }

    return sanitized;
  }

  private sanitizeValue(value: SafeValue): SafeValue {
    if (typeof value !== 'string') {
      return value;
    }

    // Заменяме потенциално опасни символи
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;')
      .replace(/\$/g, '&#36;');
  }
}
