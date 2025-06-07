import {
  Injectable,
  Logger,
  LoggerService,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export enum SecurityEventType {
  CSRF_VALIDATION_FAILED = 'csrf_validation_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  AUTH_FAILED = 'authentication_failed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  SESSION_CREATED = 'session_created',
  SESSION_TERMINATED = 'session_terminated',
  SESSION_EXPIRED = 'session_expired',
  ACCESS_DENIED = 'access_denied',
  DATA_ACCESS_VIOLATION = 'data_access_violation',
  SENSITIVE_DATA_EXPOSURE = 'sensitive_data_exposure',
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
  private readonly logger: LoggerService;
  private events: SecurityEvent[] = [];
  private readonly MAX_STORED_EVENTS = 1000;
  private blockedIps: Set<string> = new Set<string>();
  private readonly securityLogPath: string;
  private readonly enableFileLogging: boolean;
  private readonly enableConsoleLogging: boolean;
  private readonly enableExternalLogging: boolean;

  constructor(
    @Optional()
    @Inject('winston')
    private readonly winstonLogger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    // Използваме Winston logger ако е инжектиран, иначе стандартния NestJS logger
    this.logger = winstonLogger || new Logger(SecurityMonitorService.name);

    // Конфигурираме пътя до security log файла
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Could not create logs directory: ${errorMessage}`);
      }
    }
    this.securityLogPath = path.join(logDir, 'security-events.log');

    // Конфигурационни настройки
    this.enableFileLogging =
      configService.get<string>('SECURITY_FILE_LOGGING') !== 'false';
    this.enableConsoleLogging =
      configService.get<string>('SECURITY_CONSOLE_LOGGING') !== 'false';
    this.enableExternalLogging =
      configService.get<string>('ENABLE_EXTERNAL_SECURITY_MONITORING') ===
      'true';

    this.logger.log(
      'SecurityMonitorService initialized with config: ' +
        `fileLogging=${this.enableFileLogging}, ` +
        `consoleLogging=${this.enableConsoleLogging}, ` +
        `externalLogging=${this.enableExternalLogging}`,
    );
  }

  /**
   * Регистрира ново security събитие
   * @param event Детайли за security събитието
   */
  registerEvent(event: SecurityEvent): void {
    // Добавяме събитието в локалната опашка
    this.events.push(event);

    // Determine log level based on event type or metadata
    const logLevel =
      event.metadata?.level || this.getDefaultLogLevel(event.type);
    const logMessage = this.formatLogMessage(event);
    const logContext = this.formatLogContext(event);

    // Логване в конзолата (чрез NestJS/Winston logger)
    if (this.enableConsoleLogging) {
      switch (logLevel) {
        case 'debug':
          if (typeof this.logger.debug === 'function') {
            this.logger.debug(logMessage);
          } else {
            // Fallback if debug is not available
            this.logger.log(`[DEBUG] ${logMessage}`);
          }
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
    }

    // Логване във файл директно (допълнително към Winston логването)
    if (this.enableFileLogging) {
      this.logToFile(event, logMessage);
    }

    // Ограничаваме размера на опашката за локални събития
    if (this.events.length > this.MAX_STORED_EVENTS) {
      this.events.shift();
    }

    // Проверка за подозрителни шаблони
    this.analyzeEvents(event);

    // В реална система бихме изпратили събитието и към външна система за мониторинг
    if (this.enableExternalLogging) {
      this.sendToExternalMonitoring(event);
    }
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
   * Проверява дали даден IP адрес е блокиран
   * @param ipAddress IP адрес за проверка
   * @returns true ако адресът е блокиран, false иначе
   */
  isIpBlocked(ipAddress: string): boolean {
    return this.blockedIps.has(ipAddress);
  }

  /**
   * Блокира IP адрес
   * @param ipAddress IP адрес за блокиране
   * @param reason Причина за блокирането
   */
  blockIp(ipAddress: string, reason: string): void {
    this.blockedIps.add(ipAddress);
    this.logger.warn(`IP ${ipAddress} has been blocked: ${reason}`);

    // В реална имплементация бихме записали блокирането в постоянно хранилище
    // и бихме изпратили алерта до администраторите
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
        this.blockIp(
          latestEvent.ipAddress,
          'Multiple CSRF validation failures',
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
        this.blockIp(latestEvent.ipAddress, 'Repeated rate limit violations');
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
        this.blockIp(latestEvent.ipAddress, 'Repeated authentication failures');
      }
    }

    // Проверка за опити за SQL Инжекции
    if (latestEvent.type === SecurityEventType.SQL_INJECTION_ATTEMPT) {
      const sqlInjectionEvents = this.getEventsByTypeAndIp(
        SecurityEventType.SQL_INJECTION_ATTEMPT,
        latestEvent.ipAddress,
        10 * 60 * 1000, // 10 минути
      );

      if (sqlInjectionEvents.length >= 2) {
        this.registerSuspiciousActivity(
          latestEvent.ipAddress,
          'Multiple SQL injection attempts',
          { failureCount: sqlInjectionEvents.length },
          latestEvent.userId,
        );
        this.blockIp(latestEvent.ipAddress, 'Multiple SQL injection attempts');
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
  }

  /**
   * Изпраща събитието към външна система за мониторинг
   * В реална система бихме използвали message broker или специален API
   */
  private sendToExternalMonitoring(securityEvent: SecurityEvent): void {
    // Пример за интеграция с външна система
    // В реалния свят бихме използвали SIEM система, Elasticsearch, или друг централизиран механизъм
    this.logger.log(
      `Sending security event of type ${securityEvent.type} to external monitoring system`,
      { event: securityEvent.type, sent: true },
    );
    // Примерен код за интеграция
    // await this.messageBroker.publish('security.events', securityEvent);
  }

  /**
   * Записва събитието във файл
   */
  private logToFile(event: SecurityEvent, formattedMessage: string): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${event.type.toUpperCase()}] ${formattedMessage} ${JSON.stringify(event)}\n`;

      fs.appendFileSync(this.securityLogPath, logEntry, { encoding: 'utf8' });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to write to security log file: ${errorMessage}`,
      );
    }
  }

  /**
   * Форматира съобщението за логване
   */
  private formatLogMessage(event: SecurityEvent): string {
    const username = this.safeToString(event.metadata?.username) || 'unknown';
    const userId = event.userId || 'anonymous';
    const ipAddress = event.ipAddress || 'unknown-ip';

    let message = `Security event: ${event.type} from IP ${ipAddress}`;

    // Add contextual information based on the event type
    switch (event.type) {
      case SecurityEventType.SESSION_CREATED:
        message = `Session created for user ${username} (${userId}) from IP ${ipAddress}`;
        break;
      case SecurityEventType.SESSION_TERMINATED: {
        const reason =
          this.safeToString(event.metadata?.reason) || 'unknown reason';
        message = `Session terminated for user ${username} (${userId}) from IP ${ipAddress}: ${reason}`;
        break;
      }
      case SecurityEventType.SESSION_EXPIRED:
        message = `Session expired due to inactivity for user ${username} (${userId}) from IP ${ipAddress}`;
        break;
      case SecurityEventType.AUTH_FAILED:
        message = `Authentication failed for user ${username} from IP ${ipAddress}`;
        break;
      case SecurityEventType.ACCESS_DENIED: {
        const endpoint = event.endpoint || 'unknown resource';
        message = `Access denied for user ${username} (${userId}) to ${endpoint}`;
        break;
      }
      default:
        if (event.endpoint) {
          message += ` on ${event.endpoint}`;
        }
    }

    return message;
  }

  /**
   * Форматира контекста за логване
   */
  private formatLogContext(event: SecurityEvent): Record<string, any> {
    return {
      securityEvent: {
        type: event.type,
        userId: event.userId || 'anonymous',
        ipAddress: event.ipAddress,
        endpoint: event.endpoint,
        timestamp: event.timestamp,
      },
      metadata: event.metadata || {},
      security: true, // Маркер за филтриране в система за логване
    };
  }

  /**
   * Определя ниво на логване по подразбиране според типа събитие
   */
  /**
   * Safely converts any value to string, handling null/undefined and objects
   */

  private safeToString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[object]';
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(value);
  }

  private getDefaultLogLevel(
    eventType: SecurityEventType,
  ): 'debug' | 'info' | 'warn' | 'error' {
    switch (eventType) {
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
      case SecurityEventType.XSS_ATTEMPT:
      case SecurityEventType.SENSITIVE_DATA_EXPOSURE:
      case SecurityEventType.DATA_ACCESS_VIOLATION:
        return 'error';

      case SecurityEventType.CSRF_VALIDATION_FAILED:
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
      case SecurityEventType.AUTH_FAILED:
      case SecurityEventType.ACCESS_DENIED:
        return 'warn';

      case SecurityEventType.SESSION_CREATED:
      case SecurityEventType.SESSION_TERMINATED:
      case SecurityEventType.SESSION_EXPIRED:
        return 'info';

      default:
        return 'info';
    }
  }
}
