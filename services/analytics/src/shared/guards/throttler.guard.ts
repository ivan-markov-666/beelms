import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Custom implementation of ThrottlerGuard with enhanced functionality
 * - Allows for customization of throttling behavior based on request properties
 * - Provides hooks for whitelisting certain IPs or routes
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  /**
   * Method to extract tracking key for rate limiting
   * By default uses the IP address from standard headers or connection object
   * @param req The incoming request
   * @returns A string representing the key to track for rate limiting
   */
  protected getTrackingKey(req: Request): string {
    // Get the IP from the request
    // First check for X-Forwarded-For header (when behind proxy/load balancer)
    // Then fallback to standard connection remote address
    const ip =
      req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    return typeof ip === 'string'
      ? ip
      : Array.isArray(ip)
        ? ip[0]
        : '127.0.0.1';
  }

  /**
   * Method to determine if the request should be throttled
   * Override this method to whitelist certain requests, paths, or IPs
   * @param req The incoming request
   * @returns boolean - true if the request should be throttled, false to exclude it
   */
  protected shouldThrottle(req: Request): boolean {
    // Don't throttle Swagger documentation
    if (req.path.startsWith('/api/docs')) {
      return false;
    }

    // Don't throttle health check endpoints
    if (req.path === '/health' || req.path === '/health/check') {
      return false;
    }

    // Implement whitelist based on environment variables if needed
    // const whitelist = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];
    // const ip = this.getTrackingKey(req);
    // if (whitelist.includes(ip)) {
    //   return false;
    // }

    // All other requests should be throttled
    return true;
  }
}
