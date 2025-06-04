import { Injectable, Logger } from '@nestjs/common';

export enum SecurityEventType {
  CSRF_VALIDATION_FAILED = 'csrf_validation_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  AUTH_FAILED = 'authentication_failed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

export interface SecurityEventMetadata {
  component?: string;
  action?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  [key: string]: unknown;
}

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  ipAddress: string;
  userId?: string;
  endpoint?: string;
  metadata?: SecurityEventMetadata;
}

@Injectable()
export class SecurityMonitorService {
  private readonly logger = new Logger(SecurityMonitorService.name);
  private events: SecurityEvent[] = [];
  private readonly MAX_STORED_EVENTS = 1000;

  /**
   * Регистрира ново security събитие
   * @param event Детайли за security събитието
   */
  registerEvent(event: SecurityEvent): void {
    // Добавяме събитието в локалната опашка
    this.events.push(event);

    // Determine log level based on event type or metadata
    const logLevel = event.metadata?.level || 'warn';
    const logMessage = `Security event: ${event.type} from IP ${event.ipAddress} on ${event.endpoint || 'N/A'}`;
    const logContext = {
      securityEvent: event,
      userId: event.userId || 'anonymous',
    };

    // Log with appropriate level - limit context info for debug logs
    switch (logLevel) {
      case 'debug':
        // For debug level, only log the message without exposing full object details
        this.logger.debug(logMessage);
        break;
      case 'info':
        this.logger.log(logMessage, logContext);
        break;
      case 'warn':
        this.logger.warn(logMessage, logContext);
        break;
      case 'error':
        this.logger.error(logMessage, logContext);
        break;
      default:
        this.logger.log(logMessage, logContext);
    }

    // Ограничаваме размера на опашката за локални събития
    if (this.events.length > this.MAX_STORED_EVENTS) {
      this.events.shift();
    }

    // Проверка за подозрителни шаблони
    this.analyzeEvents(event);

    // В реална система бихме изпратили събитието и към външна система за мониторинг
    // например чрез message broker до централизирана security monitoring система
    this.sendToExternalMonitoring(event);
  }

  /**
   * Връща събития от определен тип за посочения IP адрес за даден период от време
   * @param type Тип събитие, което търсим
   * @param ipAddress IP адрес, за който търсим събития
   * @param timeWindowMs Прозорец от време в милисекунди назад от сегашния момент
   * @returns Списък със събития, отговарящи на критериите
   */
  getEventsByTypeAndIp(
    type: SecurityEventType,
    ipAddress: string,
    timeWindowMs: number,
  ): SecurityEvent[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.events.filter(
      (event) =>
        event.type === type &&
        event.ipAddress === ipAddress &&
        event.timestamp >= cutoffTime,
    );
  }

  /**
   * Връща всички събития, регистрирани за даден IP адрес
   * @param ipAddress IP адрес, за който търсим събития
   * @returns Списък със събития, отговарящи на критериите
   */
  getEventsByIp(ipAddress: string): SecurityEvent[] {
    return this.events.filter((event) => event.ipAddress === ipAddress);
  }

  /**
   * Анализира събития за откриване на подозрителни шаблони
   * @param latestEvent Последното регистрирано събитие
   */
  private analyzeEvents(latestEvent: SecurityEvent): void {
    // Проверка за многократни CSRF нарушения от един IP
    if (latestEvent.type === SecurityEventType.CSRF_VALIDATION_FAILED) {
      const csrfEvents = this.getEventsByTypeAndIp(
        SecurityEventType.CSRF_VALIDATION_FAILED,
        latestEvent.ipAddress,
        5 * 60 * 1000, // 5 минути
      );

      if (csrfEvents.length >= 5) {
        this.registerSuspiciousActivity(
          latestEvent.ipAddress,
          'Multiple CSRF validation failures',
          { failureCount: csrfEvents.length },
          latestEvent.userId,
        );
      }
    }

    // Проверка за многократни rate limit нарушения от един IP
    if (latestEvent.type === SecurityEventType.RATE_LIMIT_EXCEEDED) {
      const rateLimitEvents = this.getEventsByTypeAndIp(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        latestEvent.ipAddress,
        30 * 60 * 1000, // 30 минути
      );

      if (rateLimitEvents.length >= 3) {
        this.registerSuspiciousActivity(
          latestEvent.ipAddress,
          'Repeated rate limit violations',
          { failureCount: rateLimitEvents.length },
          latestEvent.userId,
        );
      }
    }

    // Проверка за многократни неуспешни опити за логин
    if (latestEvent.type === SecurityEventType.AUTH_FAILED) {
      const authEvents = this.getEventsByTypeAndIp(
        SecurityEventType.AUTH_FAILED,
        latestEvent.ipAddress,
        15 * 60 * 1000, // 15 минути
      );

      if (authEvents.length >= 5) {
        this.registerSuspiciousActivity(
          latestEvent.ipAddress,
          'Repeated authentication failures',
          { failureCount: authEvents.length },
          latestEvent.userId,
        );
      }
    }
  }

  /**
   * Регистрира подозрителна активност
   */
  private registerSuspiciousActivity(
    ipAddress: string,
    reason: string,
    metadata: Record<string, any> = {},
    userId?: string,
  ): void {
    const suspiciousEvent: SecurityEvent = {
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      timestamp: new Date(),
      ipAddress,
      userId,
      metadata: {
        reason,
        ...metadata,
      },
    };

    // Добавяме събитието в локалната опашка
    this.events.push(suspiciousEvent);

    // Логваме високо-приоритетно съобщение
    this.logger.error(
      `SUSPICIOUS ACTIVITY DETECTED: ${reason} from IP ${ipAddress}`,
      {
        securityEvent: suspiciousEvent,
        userId: userId || 'anonymous',
      },
    );

    // В реална имплементация бихме задействали допълнителни защити:
    // 1. Блокиране на IP за определен период
    // 2. Изпращане на алерта до администратор
    // 3. Добавяне в blacklist
    // 4. CAPTCHA challenge за бъдещи заявки
  }

  /**
   * Изпраща събитието към външна система за мониторинг
   * В реална система бихме използвали message broker или специален API
   */
  private sendToExternalMonitoring(securityEvent: SecurityEvent): void {
    // Пример за интеграция с външна система
    // В реалния свят бихме използвали SIEM система, Elasticsearch, или друг централизиран механизъм
    if (process.env.ENABLE_EXTERNAL_SECURITY_MONITORING === 'true') {
      this.logger.log(
        `Sending security event of type ${securityEvent.type} to external monitoring system`,
      );
      // Примерен код за интеграция
      // await this.messageBroker.publish('security.events', securityEvent);
    }
  }
}
