import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

interface RequestLogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  ip: string;
  userAgent?: string;
  userId?: string;
  responseTime?: number;
  referrer?: string;
  requestId: string;
  requestBody?: any;
  responseBody?: any;
}

@Injectable()
export class RequestLoggerService {
  private readonly logger = new Logger(RequestLoggerService.name);
  private readonly logToFile: boolean;
  private readonly logDirectory: string;
  private readonly sensitiveFields: string[] = [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'jwt',
    'apiKey',
    'api_key',
    'key',
    'credential',
  ];

  constructor(private readonly configService: ConfigService) {
    this.logToFile = this.configService.get<boolean>(
      'REQUEST_LOGGING_TO_FILE',
      false,
    );
    this.logDirectory = this.configService.get<string>(
      'REQUEST_LOG_DIRECTORY',
      path.join(process.cwd(), 'logs'),
    );

    // Create log directory if logging to file is enabled
    if (this.logToFile) {
      try {
        if (!fs.existsSync(this.logDirectory)) {
          fs.mkdirSync(this.logDirectory, { recursive: true });
        }
      } catch (error) {
        this.logger.error(`Failed to create log directory: ${error.message}`);
      }
    }
  }

  /**
   * Log request details for security audit purposes
   */
  logRequest(logEntry: RequestLogEntry): void {
    // Sanitize sensitive information before logging
    const sanitizedEntry = this.sanitizeLogEntry(logEntry);

    // Console logging
    this.logger.log(
      `[REQUEST] ${sanitizedEntry.method} ${sanitizedEntry.url} - Status: ${sanitizedEntry.statusCode} - IP: ${sanitizedEntry.ip} - User: ${sanitizedEntry.userId || 'anonymous'} - ReqID: ${sanitizedEntry.requestId}`,
    );

    // File logging if enabled
    if (this.logToFile) {
      try {
        const logFilePath = path.join(
          this.logDirectory,
          `request-log-${new Date().toISOString().split('T')[0]}.log`,
        );

        // Append to daily log file
        fs.appendFileSync(logFilePath, `${JSON.stringify(sanitizedEntry)}\n`);
      } catch (error) {
        this.logger.error(`Failed to write to log file: ${error.message}`);
      }
    }
  }

  /**
   * Log security events separately (login attempts, permission violations, etc.)
   */
  logSecurityEvent(
    eventType: string,
    details: Record<string, any>,
    ip: string,
    userId?: string,
  ): void {
    const sanitizedDetails = this.sanitizeObject(details);

    const securityLog = {
      timestamp: new Date().toISOString(),
      eventType,
      details: sanitizedDetails,
      ip,
      userId: userId || 'anonymous',
    };

    this.logger.warn(
      `[SECURITY] ${eventType} - IP: ${ip} - User: ${userId || 'anonymous'}`,
    );

    // File logging for security events
    if (this.logToFile) {
      try {
        const securityLogPath = path.join(
          this.logDirectory,
          `security-log-${new Date().toISOString().split('T')[0]}.log`,
        );

        fs.appendFileSync(securityLogPath, `${JSON.stringify(securityLog)}\n`);
      } catch (error) {
        this.logger.error(
          `Failed to write security log to file: ${error.message}`,
        );
      }
    }
  }

  /**
   * Sanitize log entry by removing sensitive information
   */
  private sanitizeLogEntry(logEntry: RequestLogEntry): RequestLogEntry {
    const sanitized = { ...logEntry };

    // Sanitize request body if present
    if (sanitized.requestBody) {
      sanitized.requestBody = this.sanitizeObject(sanitized.requestBody);
    }

    // Sanitize response body if present
    if (sanitized.responseBody) {
      sanitized.responseBody = this.sanitizeObject(sanitized.responseBody);
    }

    return sanitized;
  }

  /**
   * Recursively sanitize an object to mask sensitive fields
   */
  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    // Handle objects
    const sanitized = { ...obj };
    for (const key in sanitized) {
      if (
        this.sensitiveFields.some((field) => key.toLowerCase().includes(field))
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null
      ) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  }
}
