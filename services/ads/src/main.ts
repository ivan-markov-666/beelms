import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { XssSanitizerPipe } from './common/pipes/xss-sanitizer.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const port = Number(configService.get('PORT')) || 3000;

  // Enable global validation pipe and XSS protection
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // Отхвърляне на неочаквани полета
    }),
    new XssSanitizerPipe(), // Добавяме глобален XSS санитайзър
  );

  // Enable Helmet (добавяне на сигурносни HTTP хедъри)
  // Използваме Helmet за добавяне на сигурностни HTTP хедъри
  app.use(
    helmet({
      // Подробна CSP конфигурация за максимална защита
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // за продукция премахнете 'unsafe-inline' и 'unsafe-eval'
          styleSrc: ["'self'", "'unsafe-inline'"], // за продукция премахнете 'unsafe-inline'
          imgSrc: ["'self'", 'data:', 'https://cdn.qa-4-free.com'],
          connectSrc: ["'self'", 'https://*.qa-4-free.com'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'https://cdn.qa-4-free.com'],
          frameSrc: ["'none'"],
          formAction: ["'self'"],
          baseUri: ["'self'"],
          workerSrc: ["'self'"],
          manifestSrc: ["'self'"],
          styleSrcElem: ["'self'", "'unsafe-inline'"],
          // Докладване на нарушения - трябва да се настрои за продукция
          reportUri: '/api/csp-report',
          reportTo: 'csp-endpoint',
        },
        reportOnly: false, // В разработка може да бъде true за тестване
      },
      // XSS Protection включено
      xssFilter: true,
      // Предотвратява clickjacking атаки
      frameguard: {
        action: 'deny',
      },
      // Предотвратява MIME сниффинг
      noSniff: true,
    }),
  );

  // Enable CORS с допълнителни настройки за сигурност
  app.enableCors({
    origin: configService.get<string>('ALLOWED_ORIGINS') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Ads Service API')
    .setDescription('The Ads Service API documentation')
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
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, () => {
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger UI available at: http://localhost:${port}/api`);
  });
}

void bootstrap();
