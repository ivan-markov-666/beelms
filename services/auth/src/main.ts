import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create the application with proper error logging
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get<ConfigService>(ConfigService);

  // Configure CORS with enhanced security
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', '*'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  });

  // Add Helmet for security-related HTTP headers
  app.use(helmet());

  // Remove X-Powered-By header using a type-safe approach
  app.use((_req: Request, res: Response, next: () => void) => {
    // Define a type-safe way to access removeHeader
    type ResponseWithRemoveHeader = Response & {
      removeHeader?: (name: string) => Response;
    };

    const response = res as ResponseWithRemoveHeader;
    const removeHeader = response.removeHeader;

    // Only proceed if removeHeader exists and is a function
    if (typeof removeHeader === 'function') {
      try {
        // Call removeHeader with the correct context and argument
        removeHeader.call(response, 'X-Powered-By');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`Failed to remove X-Powered-By header: ${errorMessage}`);
      }
    }

    next();
  });

  // Configure global validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove fields that are not part of DTO
      forbidNonWhitelisted: true, // Throw error if unknown fields are present
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Require explicit type conversion
      },
      disableErrorMessages:
        configService.get<string>('NODE_ENV') === 'production',
    }),
  );

  // Configure global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    // Настройка на подстановъчните знаци (wildcards) според новия синтаксис
    exclude: [{ path: '/', method: RequestMethod.ALL }],
  });

  // Get port and host from config with proper typing
  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('HOST', '127.0.0.1');

  // Configure Swagger with security documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription(
      'Authentication and Authorization API for QA-4-Free\n\n' +
        '## Security\n' +
        '- **JWT Authentication**: All protected endpoints require a valid JWT token\n' +
        '- **IP Blocking**: Automatic IP blocking after multiple failed attempts\n' +
        '- **Rate Limiting**: Request rate limiting per IP address\n' +
        '- **Input Sanitization**: Automatic XSS protection for all inputs\n' +
        '- **Security Headers**: Properly configured security headers\n',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1, // Hide schemas section by default
      docExpansion: 'none', // Collapse all operations by default
      filter: true, // Enable filtering by tag
      showRequestDuration: true,
    },
  });

  // Start the application
  await app.listen(port, host);

  logger.log(`Application is running on: http://${host}:${port}`);
  logger.log(
    `Swagger documentation available at: http://${host}:${port}/api-docs`,
  );
  logger.log('Security layer successfully applied to Auth Service');
}

// Bootstrap the application
bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');

  // Safely handle the error
  if (error instanceof Error) {
    // Log the error message safely
    const message = error.message || 'Unknown error';
    logger.error(`Failed to start application: ${message}`);

    // Safely log the stack trace if available
    if (error.stack) {
      logger.debug(error.stack);
    }
  } else if (typeof error === 'string') {
    logger.error(`Failed to start application: ${error}`);
  } else {
    // Handle any other type of error
    const errorString = String(error);
    logger.error(
      `Failed to start application: ${errorString || 'Unknown error'}`,
    );
  }

  // Exit with error code
  process.exit(1);
});
