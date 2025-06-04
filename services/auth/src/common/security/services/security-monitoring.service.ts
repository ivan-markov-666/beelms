import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  REGISTER_SUCCESS = 'register_success',
  REGISTER_FAILURE = 'register_failure',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGE = 'password_change',
  IP_BLOCKED = 'ip_blocked',
  IP_UNBLOCKED = 'ip_unblocked',
  ACCOUNT_LOCKED = 'account_locked',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  PERMISSION_DENIED = 'permission_denied',
  TOKEN_REVOKED = 'token_revoked',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
}

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly events: SecurityEvent[] = [];
  private readonly maxEventsInMemory: number;
  private readonly alertThresholds: Record<SecurityEventType, number>;

  constructor(private readonly configService: ConfigService) {
    this.maxEventsInMemory = this.configService.get<number>(
      'MAX_SECURITY_EVENTS_IN_MEMORY',
      1000,
    );

    // Настройки за праговете за алармиране за различни типове събития
    this.alertThresholds = {
      [SecurityEventType.LOGIN_FAILURE]: this.configService.get<number>(
        'ALERT_THRESHOLD_LOGIN_FAILURE',
        5,
      ),
      [SecurityEventType.IP_BLOCKED]: this.configService.get<number>(
        'ALERT_THRESHOLD_IP_BLOCKED',
        3,
      ),
      [SecurityEventType.UNUSUAL_ACTIVITY]: this.configService.get<number>(
        'ALERT_THRESHOLD_UNUSUAL_ACTIVITY',
        2,
      ),
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: this.configService.get<number>(
        'ALERT_THRESHOLD_RATE_LIMIT',
        10,
      ),
      [SecurityEventType.XSS_ATTEMPT]: this.configService.get<number>(
        'ALERT_THRESHOLD_XSS_ATTEMPT',
        1,
      ),
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: this.configService.get<number>(
        'ALERT_THRESHOLD_SQL_INJECTION',
        1,
      ),
    } as Record<SecurityEventType, number>;
  }

  /**
   * Записва security event в паметта и логовете
   * @param event Информация за събитието, свързано със сигурността
   */
  recordEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Добавяне на събитието към паметта
    this.events.unshift(fullEvent);

    // Ограничаване на броя събития в паметта
    if (this.events.length > this.maxEventsInMemory) {
      this.events.pop();
    }

    // Логване на събитието с подходящо ниво
    const logMessage = this.formatEventLogMessage(fullEvent);

    switch (fullEvent.severity) {
      case 'critical':
        this.logger.error(logMessage, fullEvent.details);
        break;
      case 'high':
        this.logger.warn(logMessage, fullEvent.details);
        break;
      case 'medium':
        this.logger.log(logMessage, fullEvent.details);
        break;
      default:
        this.logger.debug(logMessage, fullEvent.details);
    }

    // Проверка дали да се активира аларма
    this.checkForAlertTrigger(fullEvent);
  }

  /**
   * Форматира съобщение за логване
   */
  private formatEventLogMessage(event: SecurityEvent): string {
    let message = `[SECURITY] ${event.type} | Severity: ${event.severity}`;

    if (event.userId) {
      message += ` | User: ${event.userId}`;
    }

    if (event.ip) {
      message += ` | IP: ${event.ip}`;
    }

    return message;
  }

  /**
   * Проверява дали трябва да се активира аларма за събитие
   */
  private checkForAlertTrigger(event: SecurityEvent): void {
    // Игнорираме събития, които нямат праг за алармиране
    if (!(event.type in this.alertThresholds)) {
      return;
    }

    // Броим подобни събития от същия IP в последните 10 минути
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const similarEvents = this.events.filter(
      (e) =>
        e.type === event.type &&
        e.ip === event.ip &&
        e.timestamp >= tenMinutesAgo,
    );

    // Ако броят на събитията надхвърля прага, активираме аларма
    if (similarEvents.length >= this.alertThresholds[event.type]) {
      this.triggerAlert(event, similarEvents.length);
    }
  }

  /**
   * Активира аларма при подозрителна активност
   */
  private triggerAlert(event: SecurityEvent, count: number): void {
    const alertMessage = `[SECURITY ALERT] Detected ${count} ${event.type} events from IP ${event.ip} in the last 10 minutes!`;

    // Логване на алармата с най-високо ниво на важност
    this.logger.error(alertMessage, {
      ...event.details,
      securityEventType: event.type,
      count,
      ip: event.ip,
      userId: event.userId,
    });

    // Тук може да се добави интеграция с външна система за нотификации
    // Например Slack, Email, SMS, или система за мониторинг
    this.sendAlertNotification(alertMessage);
  }

  /**
   * Изпраща нотификация за аларма (примерна имплементация)
   */
  private sendAlertNotification(message: string): void {
    // Тук бихме добавили реална интеграция с външна система
    // Например:
    // - this.emailService.sendSecurityAlert(message, event);
    // - this.slackService.postSecurityAlert(message, event);

    this.logger.log(`Alert notification would be sent: ${message}`);
  }

  /**
   * Връща списък с последните security събития
   */
  getRecentEvents(limit = 100): SecurityEvent[] {
    return this.events.slice(0, Math.min(limit, this.events.length));
  }

  /**
   * Връща статистика за събитията по тип
   */
  getEventStatistics(timeRange?: {
    start: Date;
    end: Date;
  }): Record<SecurityEventType, number> {
    const stats = {} as Record<SecurityEventType, number>;

    // Филтрираме събитията по времеви диапазон ако е посочен
    let filteredEvents = this.events;

    if (timeRange) {
      filteredEvents = this.events.filter(
        (e) => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end,
      );
    }

    // Броим събитията по тип
    filteredEvents.forEach((event) => {
      if (!stats[event.type]) {
        stats[event.type] = 0;
      }
      stats[event.type]++;
    });

    return stats;
  }
}
