import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestLoggerService } from '../services/request-logger.service';
import { User } from '../../auth/interfaces/user.interface';

declare module 'express' {
  interface Request {
    id?: string;
    user?: User;
  }
}

interface RequestLogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  ip: string;
  userId?: string;
  requestId: string;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly requestLogger: RequestLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl: url } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      const userId = this.extractUserId(req);

      const logEntry: RequestLogEntry = {
        timestamp: new Date().toISOString(),
        method,
        url,
        statusCode,
        duration,
        ip: req.ip || 'unknown',
        userId: userId ? String(userId) : undefined,
        requestId: req.id || 'none',
      };

      this.requestLogger.logRequest(logEntry);
    });

    next();
  }

  private extractUserId(req: Request): string | undefined {
    const userId = req.user?.userId;
    return userId !== undefined ? String(userId) : undefined;
  }
}
