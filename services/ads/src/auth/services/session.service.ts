import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SecurityMonitorService,
  SecurityEventType,
} from '../../shared/services/security-monitor.service';

// Добавляем новые типы событий безопасности для сессий
// Эти типы будут добавлены в enum SecurityEventType позже
const SESSION_CREATED = 'session_created';
const SESSION_TERMINATED = 'session_terminated';
const SESSION_EXPIRED = 'session_expired';

export interface SessionData {
  userId: number;
  username: string;
  jti: string; // JWT Token ID
  roles: string[];
  lastActivity: Date;
  ipAddress: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  private readonly sessions: Map<string, SessionData> = new Map();
  private readonly sessionTimeout: number; // в минутах

  constructor(
    private readonly configService: ConfigService,
    private readonly securityMonitor: SecurityMonitorService,
  ) {
    // Конфигурация timeout сессии, по умолчанию 30 минут
    this.sessionTimeout =
      configService.get<number>('SESSION_TIMEOUT_MINUTES') || 30;

    // Запускаем интервал для проверки неактивных сессий каждую минуту
    setInterval(() => this.checkInactiveSessions(), 60000);
  }

  /**
   * Создава нова сесия
   * @param sessionData Данни за сесията
   * @returns ID на сесията (jti)
   */
  createSession(sessionData: SessionData): string {
    this.sessions.set(sessionData.jti, {
      ...sessionData,
      lastActivity: new Date(),
    });

    // Логираме създаването на сесия
    this.securityMonitor.registerEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY, // Временно използваме SUSPICIOUS_ACTIVITY
      timestamp: new Date(),
      ipAddress: sessionData.ipAddress,
      userId: sessionData.userId.toString(),
      endpoint: 'auth/login',
      metadata: {
        event: SESSION_CREATED,
        username: sessionData.username,
        component: 'SessionService',
        action: 'createSession',
        level: 'info',
      },
    });

    return sessionData.jti;
  }

  /**
   * Обновява времето на последна активност за сесията
   * @param jti ID на сесията (от JWT токена)
   * @returns true ако сесията съществува и е обновена, false иначе
   */
  updateActivity(jti: string): boolean {
    if (!this.sessions.has(jti)) {
      return false;
    }

    const sessionData = this.sessions.get(jti);
    if (!sessionData) return false;
    sessionData.lastActivity = new Date();
    this.sessions.set(jti, sessionData);
    return true;
  }

  /**
   * Проверява дали сесията е активна
   * @param jti ID на сесията
   * @returns true ако сесията съществува и не е изтекла, false иначе
   */
  isSessionActive(jti: string): boolean {
    if (!this.sessions.has(jti)) {
      return false;
    }

    const session = this.sessions.get(jti);
    if (!session) return false;
    const now = new Date();
    const inactiveTime =
      (now.getTime() - session.lastActivity.getTime()) / 60000; // в минути

    return inactiveTime < this.sessionTimeout;
  }

  /**
   * Прекратява сесията
   * @param jti ID на сесията за прекратяване
   * @param reason Причина за прекратяване
   * @returns true ако сесията е намерена и прекратена, false иначе
   */
  terminateSession(jti: string, reason: string = 'manual_logout'): boolean {
    if (!this.sessions.has(jti)) {
      return false;
    }

    const session = this.sessions.get(jti);
    if (!session) return false;

    // Логираме прекратяването
    this.securityMonitor.registerEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY, // Временно използваме SUSPICIOUS_ACTIVITY
      timestamp: new Date(),
      ipAddress: session.ipAddress,
      userId: session.userId.toString(),
      endpoint: 'session/terminate',
      metadata: {
        event: SESSION_TERMINATED,
        username: session.username,
        component: 'SessionService',
        action: 'terminateSession',
        reason,
        level: 'info',
      },
    });

    // Премахваме сесията
    this.sessions.delete(jti);

    return true;
  }

  /**
   * Прекратява всички сесии на потребителя
   * @param userId ID на потребителя
   * @param reason Причина за прекратяване
   * @returns Брой прекратени сесии
   */
  terminateUserSessions(
    userId: number,
    reason: string = 'admin_action',
  ): number {
    let count = 0;

    for (const [jti, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.terminateSession(jti, reason);
        count++;
      }
    }

    return count;
  }

  /**
   * Проверява за неактивни сесии и ги прекратява
   * @returns Брой прекратени неактивни сесии
   */
  private checkInactiveSessions(): number {
    const now = new Date();
    let terminatedCount = 0;

    for (const [jti, session] of this.sessions.entries()) {
      const inactiveTime =
        (now.getTime() - session.lastActivity.getTime()) / 60000; // в минути

      if (inactiveTime >= this.sessionTimeout) {
        this.terminateSession(jti, 'inactivity_timeout');
        terminatedCount++;

        // Специално логване за прекратяване поради неактивност
        this.securityMonitor.registerEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY, // Временно използваме SUSPICIOUS_ACTIVITY
          timestamp: now,
          ipAddress: session.ipAddress,
          userId: session.userId.toString(),
          metadata: {
            event: SESSION_EXPIRED,
            username: session.username,
            component: 'SessionService',
            action: 'checkInactiveSessions',
            inactiveDuration: `${inactiveTime.toFixed(1)} minutes`,
            level: 'info',
          },
        });
      }
    }

    return terminatedCount;
  }

  /**
   * Връща всички активни сесии
   * @returns Списък с активни сесии
   */
  getActiveSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Връща броя активни сесии
   * @returns Общ брой активни сесии
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Връща всички активни сесии на потребителя
   * @param userId ID на потребителя
   * @returns Списък със сесии на потребителя
   */
  getUserSessions(userId: number): SessionData[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );
  }
}
