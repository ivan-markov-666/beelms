import {
  Injectable,
  NestMiddleware,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IpBlockingService } from '../services/ip-blocking.service';

/**
 * Middleware for blocking suspicious IP addresses
 * This middleware checks if the incoming request's IP is in the blocklist
 * and rejects the request if necessary
 */
@Injectable()
export class IpBlockingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IpBlockingMiddleware.name);

  constructor(private readonly ipBlockingService: IpBlockingService) {}

  /**
   * Middleware function to check if the requesting IP is blocked
   *
   * @param req The incoming request
   * @param res The outgoing response
   * @param next The next middleware function
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Get IP address from various potential sources
    const ip = this.getClientIp(req);

    // If IP is blocked, throw a ForbiddenException
    if (this.ipBlockingService.isBlocked(ip)) {
      this.logger.warn(`Blocked request from suspended IP: ${ip}`);
      throw new ForbiddenException('Access denied due to suspicious activity.');
    }

    next();
  }

  /**
   * Extract client IP address from the request
   *
   * @param req The incoming request
   * @returns The client IP address
   */
  private getClientIp(req: Request): string {
    // X-Forwarded-For header may contain multiple IPs: client, proxy1, proxy2, ...
    const forwardedFor = req.headers['x-forwarded-for'];

    if (forwardedFor) {
      // If it's a string, get the first IP (client IP)
      if (typeof forwardedFor === 'string') {
        return forwardedFor.split(',')[0].trim();
      }

      // If it's an array, get the first element (client IP)
      if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        return forwardedFor[0].split(',')[0].trim();
      }
    }

    // Fallback to req.ip (express populated) or req.connection.remoteAddress (raw Node.js)
    return (
      req.ip ||
      (req.connection && req.connection.remoteAddress
        ? req.connection.remoteAddress
        : '127.0.0.1')
    );
  }
}
