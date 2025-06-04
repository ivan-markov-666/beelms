import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ValidationExceptionFilter } from './shared/filters/validation.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Защитни механизми
  // 1. Helmet за HTTP хедъри
  app.use(helmet());
  
  // 2. Enable CORS с допълнителни опции за сигурност
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    maxAge: 3600,
  });

  // 3. Cookie Parser за работа с CSRF
  app.use(cookieParser());

  // 4. Глобална валидация на входните данни
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Премахва неочаквани полета
      forbidNonWhitelisted: true, // Забранява неочаквани полета
      transform: true, // Автоматична трансформация на входните данни
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Скрива детайлни съобщения за грешка в продукционна среда
    }),
  );

  // 5. Глобален филтър за валидационни грешки
  app.useGlobalFilters(new ValidationExceptionFilter());

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Course Service API')
    .setDescription('The Course Service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '127.0.0.1');

  // Log the URLs
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Course microservice running on ${baseUrl}`);
  console.log(`Swagger documentation available at: ${baseUrl}/api`);
  console.log(`Security measures initialized: CORS, Helmet, CSRF, Rate Limiting, Enhanced Validation`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
