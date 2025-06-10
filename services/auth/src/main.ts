import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as hpp from 'hpp';
import * as rateLimit from 'express-rate-limit';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create the application with proper error logging
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get<ConfigService>(ConfigService);
    const port = parseInt(configService.get<string>('PORT', '3000'), 10);
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const isLocal = nodeEnv === 'development' || nodeEnv === 'local';
    const host = isLocal ? '127.0.0.1' : '0.0.0.0';

    // Configure Swagger only in local environment
    if (isLocal) {
      const config = new DocumentBuilder()
        .setTitle('Auth Service API')
        .setDescription('Authentication and authorization service')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api-docs', app, document);
      logger.log(`Swagger documentation is available at: http://localhost:${port}/api-docs`);
    } else {
      logger.log('Swagger UI is disabled in non-local environment');
    }

    // Configure security middleware
    configureSecurity(app, configService, logger);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('QA4Free Auth API')
      .setDescription('Authentication and Authorization API for QA4Free')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth', // This name should be same as used in the @ApiBearerAuth() decorator in the controller
      )
      .addServer(`http://localhost:${port}`, 'Local Development')
      .addServer('https://api.qa4free.com', 'Production')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        filter: true,
        docExpansion: 'none',
        tagsSorter: 'alpha',
        operationsSorter: 'method',
      },
      customSiteTitle: 'QA4Free Auth API Documentation',
    });

    logger.log(
      `Swagger documentation is available at: http://${host}:${port}/api-docs`,
    );

    await app.listen(port, host);
    logger.log(`Application is running on: http://${host}:${port}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(
        `Error during application startup: ${error.message}`,
        error.stack,
      );
    } else {
      logger.error('Unknown error during application startup', String(error));
    }
    process.exit(1);
  }
}

/**
 * Configures security-related middleware for the application
 */
function configureSecurity(
  app: INestApplication,
  configService: ConfigService,
  logger: Logger,
): INestApplication {
  // Helmet security headers with CSP configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'self'"],
          formAction: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'no-referrer' },
      xssFilter: true,
    }),
  );

  // CORS configuration
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', '*')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-XSRF-TOKEN',
    ],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    credentials: true,
    maxAge: 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Remove X-Powered-By header
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Powered-By');
    next();
  });

  // Prevent parameter pollution
  app.use(hpp());

  // Security middleware for request sanitization
  app.use((req: Request, _res: Response, next: NextFunction) => {
    try {
      // Helper function to check if a value is a plain object
      const isPlainObject = (val: unknown): val is Record<string, unknown> =>
        val !== null &&
        typeof val === 'object' &&
        Object.prototype.toString.call(val) === '[object Object]';

      // Sanitize a single value
      const sanitizeValue = (value: unknown): unknown => {
        if (value === null || value === undefined) {
          return value;
        }

        // Handle primitive types directly
        if (typeof value !== 'object') {
          // Convert to string and escape HTML
          const stringValue = String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

          // Try to convert back to original type if possible
          if (typeof value === 'number') {
            const num = Number(stringValue);
            return Number.isNaN(num) ? stringValue : num;
          }
          if (typeof value === 'boolean') {
            return stringValue === 'true';
          }
          return stringValue;
        }
        return value;
      };

      // Sanitize an object recursively
      const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
        const sanitized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
          // Skip prototype pollution attempts
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            logger.warn(`Attempted prototype pollution detected: ${key}`);
            continue;
          }

          if (Array.isArray(value)) {
            sanitized[key] = value.map((item) =>
              isPlainObject(item) ? sanitizeObject(item) : sanitizeValue(item),
            );
          } else if (isPlainObject(value)) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = sanitizeValue(value);
          }
        }
        return sanitized;
      };

      // Helper to sanitize a single value
      const sanitizeSingleValue = (value: unknown): string | string[] | undefined => {
        if (value === null || value === undefined) {
          return undefined;
        }
        if (Array.isArray(value)) {
          return value.map(v => String(sanitizeValue(v)));
        }
        return String(sanitizeValue(value));
      };

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        const queryParams = req.query as Record<string, unknown>;
        Object.keys(queryParams).forEach(key => {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            logger.warn(`Attempted prototype pollution detected in query: ${key}`);
            delete queryParams[key];
          } else if (queryParams[key] !== undefined) {
            const sanitized = sanitizeSingleValue(queryParams[key]);
            if (Array.isArray(sanitized)) {
              queryParams[key] = sanitized;
            } else if (typeof sanitized === 'string') {
              queryParams[key] = sanitized;
            } else {
              queryParams[key] = undefined;
            }
          }
        });
      }

      // Sanitize request body
      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        const bodyParams = req.body as Record<string, unknown>;
        Object.keys(bodyParams).forEach(key => {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            logger.warn(`Attempted prototype pollution detected in body: ${key}`);
            delete bodyParams[key];
          } else if (bodyParams[key] !== undefined) {
            const sanitized = sanitizeSingleValue(bodyParams[key]);
            if (Array.isArray(sanitized)) {
              bodyParams[key] = sanitized;
            } else if (typeof sanitized === 'string') {
              bodyParams[key] = sanitized;
            } else {
              bodyParams[key] = undefined;
            }
          }
        });
      }

      // Sanitize route parameters
      if (req.params && typeof req.params === 'object') {
        const params = req.params as Record<string, unknown>;
        Object.keys(params).forEach(key => {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            logger.warn(`Attempted prototype pollution detected in params: ${key}`);
            delete params[key];
          } else if (params[key] !== undefined) {
            const sanitized = sanitizeValue(params[key]);
            params[key] = typeof sanitized === 'string' ? sanitized : String(sanitized);
          }
        });
      }

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error during request sanitization:', errorMessage);
      next(error);
    }
  });

  // Enable compression
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit.rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
  });
  app.use(limiter);

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const errorLogger = new Logger('GlobalErrorHandler');
    
    if (err instanceof Error) {
      errorLogger.error(`Error: ${err.message}`, err.stack);
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: err.message,
        });
      }
      
      if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or missing authentication token',
        });
      }
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication token has expired',
        });
      }
    }
    
    // Default error response
    const errorMessage = err && typeof err === 'object' && 'message' in err
      ? String(err.message)
      : 'An unexpected error occurred';
      
    return res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : errorMessage,
    });
  });

  return app;
}

// Bootstrap the application
bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');

  if (error instanceof Error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
  } else {
    logger.error('Failed to start application with unknown error', String(error));
  }

  process.exit(1);
});
