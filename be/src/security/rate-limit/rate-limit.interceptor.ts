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
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return next.handle();
    }

    if (
      process.env.NODE_ENV === 'test' &&
      process.env.RATE_LIMIT_TEST_MODE !== 'true'
    ) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const keyValue = this.getKeyValue(options.key, req);
    const limiterId = `${context.getClass().name}.${context.getHandler().name}`;
    const storeKey = `${limiterId}:${keyValue}`;

    const result = this.store.consume(
      storeKey,
      options.limit,
      options.windowSeconds,
    );

    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((result.resetAtMs - Date.now()) / 1000),
    );

    res.setHeader('X-RateLimit-Limit', String(options.limit));
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
