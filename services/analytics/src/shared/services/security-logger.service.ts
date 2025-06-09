import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Нива на сигурност за логване
 */
export enum SecurityLogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ALERT = 'ALERT',
  CRITICAL = 'CRITICAL',
}

/**
 * Типове събития за сигурност
 */
export enum SecurityEventType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  INPUT_VALIDATION = 'INPUT_VALIDATION',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SESSION_MANIPULATION = 'SESSION_MANIPULATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  DATA_LEAK = 'DATA_LEAK',
  ENCRYPTION = 'ENCRYPTION',
}

/**
 * Информация за събитие за сигурност
 */
export interface SecurityEvent {
  timestamp: Date;
  level: SecurityLogLevel;
  eventType: SecurityEventType;
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestUrl?: string;
  requestMethod?: string;
}

/**
 * Security Logger Service
 *
 * Централизирана услуга за логване на събития свързани със сигурността.
 * Поддържа различни нива на сигурност и типове събития, като може да записва
 * логове както в стандартния NestJS Logger, така и във файл за одит.
 */
@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger('SecurityLogger');
  private readonly enableFileLogging: boolean;
  private readonly logDirectory: string;
  private readonly maxLogSize: number; // bytes
  private readonly maxLogFiles: number;

  constructor(private configService: ConfigService) {
    this.enableFileLogging =
      this.configService.get<string>('SECURITY_LOG_TO_FILE', 'false') ===
      'true';

    this.logDirectory = this.configService.get<string>(
      'SECURITY_LOG_DIR',
      path.join(process.cwd(), 'logs', 'security'),
    );

    this.maxLogSize = this.configService.get<number>(
      'SECURITY_LOG_MAX_SIZE',
      10 * 1024 * 1024, // 10 MB по подразбиране
    );

    this.maxLogFiles = this.configService.get<number>(
      'SECURITY_LOG_MAX_FILES',
      10, // 10 файла по подразбиране
    );

    if (this.enableFileLogging) {
      this.ensureLogDirectoryExists();
    }
  }

  /**
   * Логва събитие на ниво INFO
   */
  info(
    eventType: SecurityEventType,
    message: string,
    metadata?: Omit<
      SecurityEvent,
      'level' | 'eventType' | 'message' | 'timestamp'
    >,
  ): void {
    this.log(SecurityLogLevel.INFO, eventType, message, metadata);
  }

  /**
   * Логва събитие на ниво WARN
   */
  warn(
    eventType: SecurityEventType,
    message: string,
    metadata?: Omit<
      SecurityEvent,
      'level' | 'eventType' | 'message' | 'timestamp'
    >,
  ): void {
    this.log(SecurityLogLevel.WARN, eventType, message, metadata);
  }

  /**
   * Логва събитие на ниво ALERT
   */
  alert(
    eventType: SecurityEventType,
    message: string,
    metadata?: Omit<
      SecurityEvent,
      'level' | 'eventType' | 'message' | 'timestamp'
    >,
  ): void {
    this.log(SecurityLogLevel.ALERT, eventType, message, metadata);
  }

  /**
   * Логва събитие на ниво CRITICAL
   */
  critical(
    eventType: SecurityEventType,
    message: string,
    metadata?: Omit<
      SecurityEvent,
      'level' | 'eventType' | 'message' | 'timestamp'
    >,
  ): void {
    this.log(SecurityLogLevel.CRITICAL, eventType, message, metadata);
  }

  /**
   * Основна функция за логване
   */
  private log(
    level: SecurityLogLevel,
    eventType: SecurityEventType,
    message: string,
    metadata?: Omit<
      SecurityEvent,
      'level' | 'eventType' | 'message' | 'timestamp'
    >,
  ): void {
    const timestamp = new Date();

    const event: SecurityEvent = {
      timestamp,
      level,
      eventType,
      message,
      ...metadata,
    };

    // Логваме в стандартния NestJS Logger
    const logMessage = `[${eventType}] ${message}`;

    switch (level) {
      case SecurityLogLevel.INFO:
        this.logger.log(logMessage);
        break;
      case SecurityLogLevel.WARN:
        this.logger.warn(logMessage);
        break;
      case SecurityLogLevel.ALERT:
      case SecurityLogLevel.CRITICAL:
        this.logger.error(logMessage);
        break;
    }

    // Записваме във файл ако е активирано
    if (this.enableFileLogging) {
      this.writeToFile(event);
    }
  }

  /**
   * Записва събитие във файл за одит
   */
  private writeToFile(event: SecurityEvent): void {
    try {
      const today = new Date();
      const logFileName = `security-${today.getFullYear()}-${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}.log`;

      const logFilePath = path.join(this.logDirectory, logFileName);

      // Проверяваме размера на файла
      this.checkAndRotateLogFile(logFilePath);

      // Форматираме събитието като JSON стринг с нов ред накрая
      const logEntry = JSON.stringify(event) + '\n';

      // Добавяме към файла
      fs.appendFileSync(logFilePath, logEntry);
    } catch (error) {
      this.logger.error(
        `Грешка при запис на събитие за сигурност във файл: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Проверява и ротира лог файловете ако е необходимо
   */
  private checkAndRotateLogFile(logFilePath: string): void {
    try {
      // Ако файлът не съществува, няма нужда от ротация
      if (!fs.existsSync(logFilePath)) {
        return;
      }

      const stats = fs.statSync(logFilePath);

      // Ако файлът надвишава максималния размер, ротираме го
      if (stats.size >= this.maxLogSize) {
        const timestamp = new Date().getTime();
        const rotatedFileName = `${logFilePath}.${timestamp}`;

        fs.renameSync(logFilePath, rotatedFileName);

        // Почистваме стари лог файлове
        this.cleanupOldLogFiles();
      }
    } catch (error) {
      this.logger.error(
        `Грешка при ротация на лог файл: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Почиства стари лог файлове
   */
  private cleanupOldLogFiles(): void {
    try {
      const files = fs.readdirSync(this.logDirectory);

      // Филтрираме само ротирани файлове
      const rotatedLogs = files
        .filter((file) => /\.log\.\d+$/.test(file))
        .map((file) => ({
          name: file,
          path: path.join(this.logDirectory, file),
          time: fs.statSync(path.join(this.logDirectory, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time); // Сортираме по време, най-новите първи

      // Изтриваме най-старите файлове, ако надвишават лимита
      if (rotatedLogs.length > this.maxLogFiles) {
        for (let i = this.maxLogFiles; i < rotatedLogs.length; i++) {
          fs.unlinkSync(rotatedLogs[i].path);
          this.logger.debug(`Изтрит стар лог файл: ${rotatedLogs[i].name}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Грешка при почистване на стари лог файлове: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Проверява и създава директорията за логове ако не съществува
   */
  private ensureLogDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    } catch (error) {
      this.logger.error(
        `Грешка при създаване на директория за лог файлове: ${(error as Error).message}`,
      );
    }
  }
}
