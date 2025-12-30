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
import {
  buildLoginAttemptKey,
  getClientIp,
  getLoginEmailFromRequest,
  LOGIN_PROTECTION_WINDOW_MS,
} from './login-protection.utils';

@Injectable()
export class LoginProtectionInterceptor implements NestInterceptor {
  private readonly windowMs = LOGIN_PROTECTION_WINDOW_MS;
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

    const ip = getClientIp(req);
    const email = getLoginEmailFromRequest(req);
    const key = buildLoginAttemptKey(ip, email);

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
}
