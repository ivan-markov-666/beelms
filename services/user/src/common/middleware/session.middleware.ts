import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
// Using proper import for express-session
import session from 'express-session';

/**
 * Middleware for session management
 * Handles session creation, validation, and expiration
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly maxAge: number;
  private readonly sessionSecret: string;
  constructor(private readonly configService: ConfigService) {
    // Session expires after 30 minutes of inactivity
    this.maxAge = 30 * 60 * 1000;
    this.sessionSecret =
      this.configService.get<string>('SESSION_SECRET') ||
      'qa4free-secure-session-fallback-secret';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Apply session middleware
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    session({
      secret: this.sessionSecret,
      name: 'qa4free.sid',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: this.maxAge,
      },
      resave: false,
      saveUninitialized: false,
    })(req, res, next);
  }
}
