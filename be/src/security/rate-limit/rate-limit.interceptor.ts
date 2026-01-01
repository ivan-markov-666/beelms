import {
  HttpException,
  HttpStatus,
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { InMemoryRateLimitStore } from './rate-limit.store';
import {
  RATE_LIMIT_METADATA_KEY,
  type RateLimitKey,
  type RateLimitOptions,
} from './rate-limit.types';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
  };
};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly store: InMemoryRateLimitStore,
  ) {
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (global as any).clearRateLimitStore = () => this.store.clear();
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const effectiveOptions: RateLimitOptions = { ...options };

    const limiterId = context.getHandler().name;

    // In test mode, use high limit unless specifically testing rate limiting
    if (process.env.NODE_ENV === 'test') {
      const testedLimiterIds = ['register', 'login', 'exportMe'];
      if (
        !(
          process.env.RATE_LIMIT_TEST_MODE === 'true' &&
          testedLimiterIds.includes(limiterId)
        )
      ) {
        effectiveOptions.limit = 1000;
      }
    }

    const http = context.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const keyValue = this.getKeyValue(effectiveOptions.key, req);
    const storeKey = `${limiterId}:${keyValue}`;

    const result = this.store.consume(
      storeKey,
      effectiveOptions.limit,
      effectiveOptions.windowSeconds,
    );

    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((result.resetAtMs - Date.now()) / 1000),
    );

    res.setHeader('X-RateLimit-Limit', String(effectiveOptions.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader(
      'X-RateLimit-Reset',
      String(Math.floor(result.resetAtMs / 1000)),
    );

    if (!result.allowed) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      throw new HttpException(
        { message: 'Too many requests' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }

  private getKeyValue(key: RateLimitKey, req: AuthenticatedRequest): string {
    const ip = this.getClientIp(req);

    if (key === 'ip') {
      return ip;
    }

    if (key === 'userId') {
      const userId = req.user?.userId;
      return userId && userId.trim().length > 0 ? `user:${userId}` : `ip:${ip}`;
    }

    const emailRaw = (req.body as { email?: unknown } | undefined)?.email;
    const email =
      typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : 'unknown';

    return `${ip}|${email}`;
  }

  private getClientIp(req: Request): string {
    const ip = (req.ip ?? '').trim();
    if (ip.length > 0) {
      return ip;
    }

    const raw = req.headers['x-forwarded-for'];

    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.split(',')[0].trim();
    }

    if (Array.isArray(raw) && raw.length > 0) {
      return String(raw[0]).trim();
    }

    return 'unknown';
  }
}
