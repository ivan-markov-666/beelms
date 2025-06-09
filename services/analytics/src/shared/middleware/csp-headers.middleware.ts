import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Content Security Policy (CSP) Headers Middleware
 *
 * Този middleware добавя CSP хедъри към HTTP отговорите за защита срещу
 * различни атаки като XSS, clickjacking и други инжекции на код.
 */
@Injectable()
export class CspHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Базови CSP политики
    const cspPolicies = [
      // Основни източници
      "default-src 'self'",
      // JavaScript източници
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // CSS източници
      "style-src 'self' 'unsafe-inline'",
      // Изображения
      "img-src 'self' data: https:",
      // Шрифтове
      "font-src 'self'",
      // Connect източници (XHR, WebSockets, и т.н.)
      "connect-src 'self'",
      // Рамки
      "frame-src 'self'",
      // Обекти (PDF, Flash и т.н.)
      "object-src 'none'",
      // Media (аудио, видео)
      "media-src 'self'",
      // Защита от Clickjacking
      "frame-ancestors 'self'",
      // Обработка на нарушения
      'report-uri /api/security/csp-violation',
      // Блокиране на mixed content
      'block-all-mixed-content',
      // Форсиране на HTTPS връзки
      'upgrade-insecure-requests',
    ];

    // Задаване на CSP хедър
    res.setHeader('Content-Security-Policy', cspPolicies.join('; '));

    // Допълнителни хедъри за сигурност

    // X-Content-Type-Options предотвратява MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options предпазва от clickjacking атаки
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // X-XSS-Protection включва вградената XSS защита на браузъра
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy контролира колко информация за референта се изпраща
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Feature-Policy/Permissions-Policy контролира достъпа до API функции на браузъра
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
    );

    // HSTS принуждава браузъра да използва HTTPS за бъдещи заявки
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    next();
  }
}
