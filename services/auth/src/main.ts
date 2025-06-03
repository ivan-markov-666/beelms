import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { InputValidationPipe } from './common/security/pipes/input-validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Създаване на приложението с логване на грешки
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Настройка на CORS с подобрена сигурност
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '*'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    maxAge: 3600,
  });

  // Добавяне на Helmet за HTTP заглавия свързани със сигурността
  app.use(helmet());

  // Премахване на X-Powered-By заглавието
  app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
  });

  // Глобална валидация на входните данни с допълнителна защита
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Премахва всички полета, които не са част от DTO
      forbidNonWhitelisted: true, // Хвърля грешка, ако има неизвестни полета
      transform: true, // Трансформира входните данни към DTO класове
      transformOptions: {
        enableImplicitConversion: false, // Изисква експлицитна трансформация
      },
      disableErrorMessages: configService.get('NODE_ENV') === 'production', // Скрива детайлни съобщения за грешки в продукция
    }),
  );

  logger.log('Security middleware and global pipes configured');

  // Swagger configuration с документация за сигурност
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription(
      'Authentication and Authorization API for QA-4-Free\n\n' +
        '## Сигурност\n' +
        '- **JWT автентикация**: Всички защитени endpoint-и изискват валиден JWT токен\n' +
        '- **Блокиране на IP**: Автоматично блокиране след определен брой неуспешни опити\n' +
        '- **Rate Limiting**: Ограничаване на броя заявки от един IP адрес\n' +
        '- **Sanitization**: Автоматично почистване на входните данни от XSS атаки\n' +
        '- **Защитни HTTP Headers**: Настроени са всички необходими заглавия за защита (HSTS, CSP, X-Frame-Options и др.)\n',
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
      'JWT-auth', // This name should match the one in @ApiBearerAuth() in your controller
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '127.0.0.1');

  await app.listen(port, host);

  logger.log(`Application is running on: http://${host}:${port}`);
  logger.log(`Swagger documentation available at: http://${host}:${port}/api`);
  logger.log('Security layer successfully applied to Auth Service');
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error(`Error starting server: ${err.message}`, err.stack);
  process.exit(1);
});
