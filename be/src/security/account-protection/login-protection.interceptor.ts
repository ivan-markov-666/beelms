import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { InMemoryLoginAttemptStore } from './login-attempts.store';

type LoginBody = { email?: unknown };

@Injectable()
export class LoginProtectionInterceptor implements NestInterceptor {
  private readonly windowMs = 5 * 60 * 1000;
  private readonly maxFailures = 5;
  private readonly blockMs = 15 * 60 * 1000;

  constructor(private readonly store: InMemoryLoginAttemptStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    if (
      process.env.NODE_ENV === 'test' &&
      process.env.ACCOUNT_PROTECTION_TEST_MODE !== 'true'
    ) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const ip = this.getClientIp(req);
    const email = this.getEmail(req);
    const key = `${ip}|${email}`;

    const nowMs = Date.now();

    const blockedUntilMs = this.store.getBlockedUntilMs(key, nowMs);
    if (blockedUntilMs !== undefined) {
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil((blockedUntilMs - nowMs) / 1000),
      );
      res.setHeader('Retry-After', String(retryAfterSeconds));
      throw new HttpException(
        { message: 'Too many failed login attempts' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle().pipe(
      tap(() => {
        this.store.clear(key);
      }),
      catchError((error: unknown) => {
        if (error instanceof UnauthorizedException) {
          this.store.recordFailure(
            key,
            Date.now(),
            this.windowMs,
            this.maxFailures,
            this.blockMs,
          );
        }

        return throwError(() => error);
      }),
    );
  }

  private getEmail(req: Request): string {
    const emailRaw = (req.body as LoginBody | undefined)?.email;

    if (typeof emailRaw === 'string') {
      const normalized = emailRaw.trim().toLowerCase();
      return normalized.length > 0 ? normalized : 'unknown';
    }

    return 'unknown';
  }

  private getClientIp(req: Request): string {
    const raw = req.headers['x-forwarded-for'];

    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.split(',')[0].trim();
    }

    if (Array.isArray(raw) && raw.length > 0) {
      return String(raw[0]).trim();
    }

    return (req.ip ?? '').trim() || 'unknown';
  }
}
