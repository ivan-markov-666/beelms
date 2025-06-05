import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  SecurityMonitorService,
  SecurityEventType,
} from '../services/security-monitor.service';

/**
 * Middleware за защита срещу SQL Injection атаки
 * Филтрира подозрителни SQL шаблони от заявките
 */
@Injectable()
export class SqlInjectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SqlInjectionMiddleware.name);
  private readonly sqlPatterns = [
    /(%27)|(')|(--)|(%23)|#/i,
    /((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|:)/i,
    /\w*((%27)|('))((%6[Ff])|o|(%4[Ff]))((%72)|r|(%52))/i,
    /((%27)|('))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /(?:insert|update|delete|drop|select|union|exec|declare|cast|script)/i,
  ];

  constructor(private securityMonitor: SecurityMonitorService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // Получаем IP адрес из req.ip или используем fallback
      const ipAddress = req.ip || '127.0.0.1';

      if (this.securityMonitor.isIpBlocked(ipAddress)) {
        res.status(403).json({
          statusCode: 403,
          message: 'IP адресът е блокиран поради подозрителна активност',
          error: 'Forbidden',
        });
        return;
      }

      const hasSqlInjection = this.checkSqlInjection(req);

      if (hasSqlInjection) {
        this.logger.warn(
          `Възможна SQL инжекция засечена: ${req.method} ${
            req.url
          } - IP: ${ipAddress} - Body: ${JSON.stringify(req.body)}`,
        );

        // Регистриране на събитието в SecurityMonitor
        this.securityMonitor.registerEvent({
          type: SecurityEventType.SQL_INJECTION_ATTEMPT,
          timestamp: new Date(),
          ipAddress,
          endpoint: req.url,
          metadata: {
            method: req.method,
            body: JSON.stringify(req.body),
            level: 'error',
          },
        });

        res.status(403).json({
          statusCode: 403,
          message: 'Засечен е опит за SQL инжекция',
          error: 'Forbidden',
        });
        return;
      }
    } catch (error) {
      this.logger.error(
        `Грешка при проверка за SQL инжекция: ${(error as Error).message}`,
      );
    }

    next();
  }

  /**
   * Проверява заявката за SQL инжекции в параметрите и тялото
   */
  private checkSqlInjection(req: Request): boolean {
    // Проверка на query параметрите
    const query = req.query;
    for (const key in query) {
      if (Object.prototype.hasOwnProperty.call(query, key)) {
        const value = query[key] as string;
        if (this.containsSqlInjection(value)) {
          return true;
        }
      }
    }

    // Проверка на body параметрите
    if (req.body && typeof req.body === 'object') {
      const stringifiedBody = JSON.stringify(req.body);
      if (this.containsSqlInjection(stringifiedBody)) {
        return true;
      }
    }

    // Проверка на URL параметрите
    if (req.params) {
      for (const key in req.params) {
        if (Object.prototype.hasOwnProperty.call(req.params, key)) {
          const value = req.params[key];
          if (this.containsSqlInjection(value)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Проверява дали даден текст съдържа SQL инжекции
   */
  private containsSqlInjection(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Проверка срещу подозрителни SQL шаблони
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(value)) {
        return true;
      }
    }

    return false;
  }
}
