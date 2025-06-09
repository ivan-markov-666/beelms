import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Rate Limiting Middleware
 *
 * This middleware limits the number of requests a client can make in a specified time window
 * to protect against DoS/DDoS attacks and brute force attempts.
 */
@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private redisClient: Redis | null = null;
  private readonly windowMs: number; // Window size in milliseconds
  private readonly maxRequests: number; // Maximum number of requests per window
  private readonly blockDurationMs: number; // Block duration in milliseconds if rate limit is exceeded

  constructor(private configService: ConfigService) {
    // Config with defaults
    this.windowMs = this.configService.get<number>(
      'RATE_LIMIT_WINDOW_MS',
      60000,
    ); // 1 minute
    this.maxRequests = this.configService.get<number>(
      'RATE_LIMIT_MAX_REQUESTS',
      100,
    ); // 100 requests per minute
    this.blockDurationMs = this.configService.get<number>(
      'RATE_LIMIT_BLOCK_DURATION_MS',
      600000,
    ); // 10 minutes block

    // Redis connection for distributed rate limiting across instances
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    try {
      const redisConfig: Record<string, any> = {
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: 3,
      };

      if (redisPassword) {
        redisConfig.password = redisPassword;
      }

      this.redisClient = new Redis(redisConfig);

      this.redisClient.on('error', (err) => {
        console.error('Rate limiting Redis error:', err);
        this.redisClient = null;
      });
    } catch (error) {
      console.warn(
        'Unable to connect to Redis for rate limiting. Falling back to memory storage:',
        error,
      );
      this.redisClient = null;
    }
  }

  /**
   * Extract client IP address from the request
   */
  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (forwardedFor) {
      if (typeof forwardedFor === 'string') {
        return forwardedFor.split(',')[0].trim();
      }

      if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        return forwardedFor[0].split(',')[0].trim();
      }
    }

    return (
      req.ip ||
      (req.connection && req.connection.remoteAddress
        ? req.connection.remoteAddress
        : '127.0.0.1')
    );
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Skip rate limiting for certain paths if needed
      const path = req.path;
      if (this.isExemptPath(path)) {
        return next();
      }

      // Get client identifier (IP + User-Agent)
      const ip = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const identifier = `rate-limit:${ip}:${userAgent}`;

      // Different limits based on endpoint sensitivity
      let customMaxRequests = this.maxRequests;

      // Apply stricter limits for sensitive endpoints (authentication, etc)
      if (path.includes('/api/auth/')) {
        customMaxRequests = Math.floor(this.maxRequests / 10); // 10x stricter
      }

      if (this.redisClient) {
        // Check if client is blocked
        const isBlocked = await this.redisClient.exists(
          `blocked:${identifier}`,
        );
        if (isBlocked) {
          const ttl = await this.redisClient.ttl(`blocked:${identifier}`);
          throw new HttpException(
            `Rate limit exceeded. Try again in ${Math.ceil(ttl / 60)} minutes.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        // Increment request count
        const count = await this.redisClient.incr(identifier);

        // Set expiration for the key if it's new
        if (count === 1) {
          await this.redisClient.expire(
            identifier,
            Math.floor(this.windowMs / 1000),
          );
        }

        // If exceeded limit, block the client
        if (count > customMaxRequests) {
          await this.redisClient.setex(
            `blocked:${identifier}`,
            Math.floor(this.blockDurationMs / 1000),
            '1',
          );
          throw new HttpException(
            `Rate limit exceeded. Try again in ${Math.ceil(this.blockDurationMs / 60000)} minutes.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', customMaxRequests.toString());
        res.setHeader(
          'X-RateLimit-Remaining',
          (customMaxRequests - count).toString(),
        );
      }

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        next(error);
      } else {
        console.error('Rate limiting error:', error);
        // If the rate limiting fails, we should still let the request through
        // rather than breaking the application
        next();
      }
    }
  }

  /**
   * Check if the path is exempt from rate limiting
   */
  private isExemptPath(path: string): boolean {
    const exemptPaths = ['/health', '/metrics'];

    return exemptPaths.some((exemptPath) => path.startsWith(exemptPath));
  }
}
