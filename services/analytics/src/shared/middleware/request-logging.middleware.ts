import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestLoggerService } from '../services/request-logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  constructor(private readonly requestLoggerService: RequestLoggerService) {}

  use(
    req: Request & { id?: string; startTime?: number },
    res: Response,
    next: NextFunction,
  ): void {
    // Generate unique request ID and store it on the request object
    const requestId = uuidv4();
    req.id = requestId;
    req.startTime = Date.now();

    // Extract client IP
    const ip = this.extractClientIp(req);

    // Get request information
    const { method, originalUrl, headers, body } = req as {method: string; originalUrl: string; headers: any; body: any};
    const userAgent = headers['user-agent'];
    // Ensure referrer is always a string or undefined
    const referrer: string | undefined = Array.isArray(headers['referer']) 
      ? headers['referer'][0] 
      : (headers['referer'] as string) || (headers['referrer'] as string);

    // Extract user ID if available (adjust according to your auth implementation)
    const userId = this.extractUserId(req);

    // Capture response data
    const originalSend = res.send;
    let responseBody: any;

    // Override the send method to capture the response
    res.send = function(data: any): Response {
      responseBody = data;
      return originalSend.call(res, data);
    } as any;

    // Process after response is sent
    res.on('finish', () => {
      const responseTime = Date.now() - (req.startTime || Date.now());
      const statusCode = res.statusCode;

      // Log the complete request information
      this.requestLoggerService.logRequest({

        timestamp: new Date().toISOString(),
        method,
        url: originalUrl,
        statusCode,
        ip,
        userAgent,
        userId,
        responseTime,
        referrer,
        requestId,
        requestBody: this.shouldLogBody(req) ? body : undefined,
        responseBody: this.shouldLogResponseBody(req, statusCode)
          ? responseBody
          : undefined,
      });

      // Log specific security events
      this.logSecurityEvents(req, res, ip, userId);
    });

    next();
  }

  private extractClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }

  private extractUserId(req: Request): string | undefined {
    // Extract user ID from request (adjust based on your auth system)
    // For example, if using JWT stored in request.user:
    if (!req.user) return undefined;
    
    // Handle different user object structures
    const user = req.user as any; // Cast to any as user type varies by auth strategy
    return user.id || user.userId || user.sub || undefined;
  }

  private shouldLogBody(req: Request): boolean {
    // Don't log bodies for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return false;
    }

    // Don't log file uploads
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      return false;
    }

    return true;
  }

  private shouldLogResponseBody(req: Request, statusCode: number): boolean {
    // Only log responses with error status codes or from specific sensitive endpoints
    return (
      statusCode >= 400 || 
      req.path.includes('/auth/') || 
      req.path.includes('/admin/')
    );
  }

  private logSecurityEvents(
    req: Request,
    res: Response,
    ip: string,
    userId?: string,
  ): void {
    const statusCode = res.statusCode;
    
    // Log authentication attempts
    if (req.path.includes('/auth/login') || req.path.includes('/auth/signin')) {
      this.requestLoggerService.logSecurityEvent(
        statusCode === 200 ? 'AUTH_SUCCESS' : 'AUTH_FAILURE',
        { path: req.path, method: req.method },
        ip,
        userId
      );
    }

    // Log authorization failures
    if (statusCode === 401 || statusCode === 403) {
      this.requestLoggerService.logSecurityEvent(
        'AUTH_VIOLATION',
        { path: req.path, method: req.method, statusCode },
        ip,
        userId
      );
    }

    // Log admin actions
    if (req.path.includes('/admin/') && statusCode < 400) {
      this.requestLoggerService.logSecurityEvent(
        'ADMIN_ACTION',
        { path: req.path, method: req.method },
        ip,
        userId
      );
    }
  }
}
