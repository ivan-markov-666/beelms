import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { IpBlockingService } from '../services/ip-blocking.service';
import { SecurityMonitoringService } from '../services/security-monitoring.service';
import { SecurityEventType } from '../services/security-monitoring.service';

/**
 * Интерфейс за сервиз за блокиране на IP адреси
 */
interface IIpBlockingService {
  isBlocked: (ip: string) => Promise<boolean>;
  recordFailedAttempt: (ip: string) => Promise<void>;
}

/**
 * Проверява дали обект имплементира интерфейса IIpBlockingService
 * @param obj Обектът, който трябва да бъде проверен
 * @returns true ако обектът имплементира IIpBlockingService
 */
function isIpBlockingService(obj: unknown): obj is IIpBlockingService {
  if (!obj) return false;
  const service = obj as Record<string, unknown>;
  return (
    typeof service.isBlocked === 'function' &&
    typeof service.recordFailedAttempt === 'function'
  );
}

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly ipBlockingService: IpBlockingService,
    private readonly securityMonitoringService: SecurityMonitoringService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    // Получаваме информацията за заявката и отговора
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method;
    const url = request.url;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const userAgent = (request.headers['user-agent'] as string) || 'Unknown';

    // Проверка дали IP адресът е блокиран
    let isBlocked = false;
    // Проверка за типова безопасност
    if (isIpBlockingService(this.ipBlockingService)) {
      try {
        isBlocked = await this.ipBlockingService.isBlocked(ip);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Error checking if IP is blocked: ${errorMessage}`);
      }
    }
    if (isBlocked) {
      this.logger.warn(
        `Blocked request from blocked IP: ${ip} to ${method} ${url}`,
      );

      // Записваме събитието
      void this.securityMonitoringService.recordEvent({
        type: SecurityEventType.PERMISSION_DENIED,
        ip,
        userAgent,
        severity: 'high',
        details: {
          method,
          url,
          reason: 'IP address is blocked',
        },
      });
      throw new UnauthorizedException('Access denied: IP address is blocked');
    }

    // Добавяне на заглавия за сигурност
    this.addSecurityHeaders(response);

    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `${method} ${url} completed in ${responseTime}ms - IP: ${ip}, User-Agent: ${userAgent}`,
          );
        },
        error: (err: unknown) => {
          // При неуспешна заявка, може да се логва грешката
          // или да се увеличи броячът за неуспешни опити от дадено IP
          // Не-200 отговор, вероятно грешка
          const errorObj = err as Error;
          const errorMessage = errorObj?.message || 'Unknown error';
          this.logger.error(`${method} ${url} - Error: ${errorMessage}`);
          if (ip) {
            // Безопасно записване на неуспешен опит
            if (isIpBlockingService(this.ipBlockingService)) {
              try {
                void this.ipBlockingService.recordFailedAttempt(ip);
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                this.logger.error(
                  `Error recording failed attempt: ${errorMessage}`,
                );
              }
            }
            // Записваме неуспешен опит в мониторинг системата
            let eventType: SecurityEventType =
              SecurityEventType.UNUSUAL_ACTIVITY;
            let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

            if (url.includes('/auth/login')) {
              eventType = SecurityEventType.LOGIN_FAILURE;
              severity = 'medium';
            } else if (url.includes('/auth/admin')) {
              eventType = SecurityEventType.PERMISSION_DENIED;
              severity = 'high';
            } else if (err instanceof UnauthorizedException) {
              eventType = SecurityEventType.RATE_LIMIT_EXCEEDED;
              severity = 'medium';
            }

            // Проверка за XSS опит
            if (
              method === 'POST' &&
              request.body &&
              JSON.stringify(request.body).includes('<script>')
            ) {
              eventType = SecurityEventType.XSS_ATTEMPT;
              severity = 'critical';
            }

            // Проверка за SQL injection опит
            if (
              method === 'POST' &&
              request.body &&
              JSON.stringify(request.body).match(
                /('|\s)\s*(OR|AND)\s*('|\d)\s*('|\s)/i,
              )
            ) {
              eventType = SecurityEventType.SQL_INJECTION_ATTEMPT;
              severity = 'critical';
            }
            void this.securityMonitoringService.recordEvent({
              type: eventType,
              severity,
              ip,
              userAgent,
              details: {
                method,
                url,
                error: errorMessage,
                stack: errorObj?.stack || undefined,
              },
            });
          }
        },
      }),
    );
  }

  private addSecurityHeaders(response: Response): void {
    // Content Security Policy (CSP)
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'",
    );

    // Добавяме security headers
    if (response.setHeader) {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      // Защита от clickjacking
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('X-XSS-Protection', '1; mode=block');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.setHeader('Content-Security-Policy', "default-src 'self'");
      // Премахване на информация за сървъра
      if (response.removeHeader) {
        response.removeHeader('X-Powered-By');
      }
    }
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Remove fingerprinting headers
    response.removeHeader('X-Powered-By');
  }
}
