import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import chalk from 'chalk';

// Define custom log levels
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  security: 5,
  audit: 6,
} as const;

type LogLevel = keyof typeof customLevels;

// Extend Winston types
declare module 'winston' {
  interface Logger {
    security: winston.LeveledLogMethod;
    audit: winston.LeveledLogMethod;
  }

  interface LoggerOptions {
    levels?: Record<string, number>;
    level?: string;
    format?: winston.Logform.Format;
    transports?: winston.transport | winston.transport[];
  }
}

// Type for log info
type LogInfo = winston.Logform.TransformableInfo & {
  level: LogLevel;
  message: string;
  timestamp?: string;
  context?: string;
  [key: string]: unknown;
};

// Add colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  security: 'cyan',
  audit: 'gray',
} as const;

// Add colors for winston
winston.addColors(colors);

// Destructure winston methods
const { format, transports } = winston;

const {
  combine,
  timestamp: winstonTimestamp,
  printf,
  colorize,
  errors: errorsFormat,
  splat,
  json,
} = format;

// Type guard for LogInfo (unused but kept for potential future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isLogInfo(info: unknown): info is LogInfo {
  const logInfo = info as Record<string, unknown>;
  return (
    typeof logInfo === 'object' &&
    logInfo !== null &&
    'level' in logInfo &&
    'message' in logInfo
  );
}

/**
 * Конфигурация за логирането с Winston
 */
export function createLoggerConfig(
  configService: ConfigService,
): winston.LoggerOptions {
  // Създаваме директорията за логове ако не съществува
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // Custom console format with colors
  const customConsoleFormat = printf((info) => {
    const logInfo = info as LogInfo;
    const { level, message, timestamp = '', context, ...meta } = logInfo;

    // Ensure level is a valid log level
    const logLevel: LogLevel = level in customLevels ? level : 'info';

    // Format the message with proper indentation
    const formattedMessage = String(message)
      .split('\n')
      .map((line, index) => (index === 0 ? line : `  ${line}`))
      .join('\n');

    // Format the meta data if present
    const metaString =
      Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';

    const contextStr = context ? `[${context}] ` : '';
    const timestampStr = timestamp ? `${timestamp} ` : '';

    // Color the level based on severity
    const levelColor = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.green,
      http: chalk.magenta,
      debug: chalk.blue,
      security: chalk.cyan,
      audit: chalk.gray,
    }[logLevel];

    // Apply color to the log level
    const coloredLevel = levelColor
      ? levelColor(`[${logLevel.toUpperCase()}]`)
      : `[${logLevel.toUpperCase()}]`;

    return `${timestampStr}${coloredLevel} ${contextStr}${formattedMessage}${metaString}`;
  });

  // File format (for production) - used in file transports
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileFormat = printf((info) => {
    const logInfo = info as LogInfo;
    const { level, message, timestamp = '', context, ...meta } = logInfo;

    // Ensure level is a valid log level
    const logLevel: LogLevel = level in customLevels ? level : 'info';

    const contextStr = context ? `[${context}] ` : '';
    const metaString =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

    return `${timestamp} [${logLevel.toUpperCase()}] ${contextStr}${message}${metaString}`;
  });

  // Determine log level based on environment
  const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';
  const logLevel: keyof typeof customLevels = isDevelopment ? 'debug' : 'info';

  // Configure transports based on environment
  const transportsList: winston.transport[] = [
    // Console transport for all environments
    new transports.Console({
      stderrLevels: ['error'],
      level: logLevel,
      format: combine(
        errorsFormat({ stack: true }),
        splat(),
        colorize(),
        customConsoleFormat,
      ),
    }),
  ];

  // Add file transports in production
  if (!isDevelopment) {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Combined logs
    const combinedTransport = new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: 'info',
      format: combine(
        winstonTimestamp(),
        errorsFormat({ stack: true }),
        splat(),
        json(),
      ),
    });

    // Error logs
    const errorTransport = new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: combine(
        winstonTimestamp(),
        errorsFormat({ stack: true }),
        splat(),
        json(),
      ),
    });

    // Security logs filter
    const securityTransport = new transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'security',
      format: combine(
        winstonTimestamp(),
        errorsFormat({ stack: true }),
        splat(),
        json(),
      ),
    });

    // Add the file transports to the list
    transportsList.push(combinedTransport, errorTransport, securityTransport);
  }

  // Create and configure the logger configuration
  const loggerOptions: winston.LoggerOptions = {
    levels: customLevels,
    level: logLevel,
    format: combine(
      winstonTimestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errorsFormat({ stack: true }),
      splat(),
      json(),
    ),
    transports: transportsList,
    exitOnError: false, // Do not exit on handled exceptions
  };

  return loggerOptions;

  return loggerOptions;
}
