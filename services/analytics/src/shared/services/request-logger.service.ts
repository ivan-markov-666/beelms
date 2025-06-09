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
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to create log directory: ${errorMessage}`);
      }
    }
  }

  /**
   * Log request details for security audit purposes
   */
  logRequest(logEntry: RequestLogEntry): void {
    let sanitizedEntry: RequestLogEntry;

    try {
      // Sanitize sensitive information before logging
      sanitizedEntry = this.sanitizeLogEntry(logEntry);

      // Console logging with safe property access
      const logMessage = [
        sanitizedEntry.method || 'UNKNOWN_METHOD',
        sanitizedEntry.url || 'unknown_url',
        '-',
        sanitizedEntry.statusCode || '000',
        `[${sanitizedEntry.responseTime || 0}ms]`,
      ].join(' ');

      this.logger.log(logMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in logRequest: ${errorMessage}`);
      return; // Exit early if we couldn't sanitize the entry
    }

    // File logging if enabled
    if (this.logToFile) {
      try {
        const logFile = path.join(this.logDirectory, 'requests.log');
        const logLine = JSON.stringify(sanitizedEntry) + '\n';
        fs.appendFileSync(logFile, logLine);
      } catch (fileError) {
        const errorMessage =
          fileError instanceof Error ? fileError.message : String(fileError);
        this.logger.error(
          'Failed to write to request log file: ' + errorMessage,
        );
      }
    }

    // File logging if enabled
    if (this.logToFile) {
      try {
        const logFilePath = path.join(
          this.logDirectory,
          `request-log-${new Date().toISOString().split('T')[0]}.log`,
        );

        // Append to daily log file
        fs.appendFileSync(logFilePath, `${JSON.stringify(sanitizedEntry)}\n`);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to write to log file: ${errorMessage}`);
      }
    }
  }

  /**
   * Log security events separately (login attempts, permission violations, etc.)
   */
  logSecurityEvent(
    eventType: string,
    details: Record<string, unknown>,
    ip: string,
    userId?: string,
  ): void {
    try {
      // Sanitize sensitive information from details
      const sanitizedDetails = this.sanitizeObject(details);

      // Create security log entry
      const securityLog = {
        timestamp: new Date().toISOString(),
        eventType,
        details: sanitizedDetails,
        ip,
        userId,
      };

      // Log to console
      this.logger.warn(
        `Security Event: ${eventType} - IP: ${ip}${userId ? `, User: ${userId}` : ''}`,
      );

      // Log to file if enabled
      if (this.logToFile) {
        const logFile = path.join(this.logDirectory, 'security.log');
        const logLine = JSON.stringify(securityLog) + '\n';
        fs.appendFile(logFile, logLine, (err: NodeJS.ErrnoException | null) => {
          if (err) {
            this.logger.error(
              `Failed to write to security log: ${err.message}`,
            );
          }
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error logging security event: ${errorMessage}`);
    }
  }

  /**
   * Sanitize log entry by removing sensitive information
   */
  private sanitizeLogEntry(logEntry: RequestLogEntry): RequestLogEntry {
    // Create a shallow copy to avoid modifying the original
    const sanitized: RequestLogEntry = {
      ...logEntry,
      // Ensure required fields have defaults if not provided
      timestamp: logEntry.timestamp || new Date().toISOString(),
      method: logEntry.method || 'UNKNOWN',
      url: logEntry.url || 'unknown',
      ip: logEntry.ip || 'unknown',
      requestId: logEntry.requestId || 'none',
    };

    // Sanitize request and response bodies if they exist
    if ('requestBody' in logEntry && logEntry.requestBody) {
      sanitized.requestBody = this.sanitizeObject(
        logEntry.requestBody,
      ) as Record<string, unknown>;
    }
    if ('responseBody' in logEntry && logEntry.responseBody) {
      sanitized.responseBody = this.sanitizeObject(
        logEntry.responseBody,
      ) as Record<string, unknown>;
    }

    return sanitized;
  }

  /**
   * Recursively sanitize an object to mask sensitive fields
   */
  private sanitizeObject<T>(obj: T): T | Record<string, unknown> | unknown[] {
    // Handle primitive types and null/undefined
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return (obj as unknown[]).map((item) => this.sanitizeObject(item));
    }

    // Handle plain objects
    const sanitized: Record<string, unknown> = {};

    try {
      for (const [key, value] of Object.entries(
        obj as Record<string, unknown>,
      )) {
        // Skip non-string keys
        if (typeof key !== 'string') continue;

        // Check if the key is in our sensitive fields list (case insensitive)
        const isSensitive = this.sensitiveFields.some(
          (field) => field.toLowerCase() === key.toLowerCase(),
        );

        if (isSensitive) {
          sanitized[key] = '***REDACTED***';
        } else if (value !== null && typeof value === 'object') {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in sanitizeObject: ${errorMessage}`);
      // Continue with partial sanitization if possible
    }

    return sanitized as unknown as T;
  }
}
