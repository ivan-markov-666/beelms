import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SessionManagementService } from '../services/session-management.service';

/**
 * Session Timeout Middleware
 *
 * Този middleware проверява валидността на сесията и автоматично прекратява
 * неактивните сесии след опредено време на неактивност
 */
@Injectable()
export class SessionTimeoutMiddleware implements NestMiddleware {
  constructor(private sessionManagementService: SessionManagementService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Извличаме идентификатора на сесията от cookie или headers
      const sessionId = this.extractSessionId(req);

      if (!sessionId) {
        // Ако няма сесия, просто продължаваме
        return next();
      }

      // Валидираме сесията
      const { valid, userId } =
        await this.sessionManagementService.validateSession(sessionId);

      if (!valid) {
        // Ако сесията е невалидна или е изтекла поради неактивност, изчистваме session cookie
        this.clearSessionCookie(res);
        throw new UnauthorizedException(
          'Сесията е изтекла поради неактивност. Моля, влезте отново.',
        );
      }

      // Запазваме информация за потребителя в заявката, ако вече няма такава
      if (userId && !req['user']) {
        req['user'] = { id: userId };
      }

      // Ако сесията е валидна, опресняваме сесионната бисквитка
      this.refreshSessionCookie(res, sessionId);

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Извлича идентификатора на сесията от заявката
   */
  private extractSessionId(req: Request): string | null {
    // Първо проверяваме cookie
    if (req.cookies && req.cookies['session_id']) {
      return String(req.cookies['session_id']);
    }

    // Като алтернатива, проверяваме хедъра
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Session ')) {
      return authHeader.replace('Session ', '').trim();
    }

    return null;
  }

  /**
   * Изчиства бисквитката със сесията
   */
  private clearSessionCookie(res: Response): void {
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  /**
   * Опреснява бисквитката със сесията
   */
  private refreshSessionCookie(res: Response, sessionId: string): void {
    // Задаваме бисквитката със същия sessionId, но с нов expiry time
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 часа
    });
  }
}
