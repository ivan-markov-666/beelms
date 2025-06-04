import {
  Module,
  NestModule,
  MiddlewareConsumer,
  ValidationPipe,
} from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './users/users.module';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { HelmetMiddleware } from './common/middleware/helmet.middleware';
import { XssMiddleware } from './common/middleware/xss.middleware';
import { SanitizationMiddleware } from './common/middleware/sanitization.middleware';
import { SessionMiddleware } from './common/middleware/session.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { SqlInjectionMiddleware } from './common/middleware/sql-injection.middleware';
import { ValidationExceptionFilter } from './common/filters/validation.filter';
import { SecureFileUploadService } from './common/services/secure-file-upload.service';
import * as cookieParser from 'cookie-parser';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Добавяме защита срещу брутфорс атаки чрез rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 минута в милисекунди
        limit: 10, // Максимален брой заявки за ttl периода
      },
      {
        name: 'medium',
        ttl: 300000, // 5 минути в милисекунди
        limit: 20, // Максимален брой заявки за ttl периода
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Деактивирано, за да избегнем проблеми с вече съществуващи данни
      }),
    }),
    UsersModule,
    AuthModule,
    SharedModule,
    AppConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SecureFileUploadService,
    // Глобален ValidationPipe за автоматична валидация на всички входящи данни
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // Премахва полета, които не са декорирани с валидационни правила
        forbidNonWhitelisted: true, // Отхвърля заявки с непозволени полета
        transform: true, // Автоматично трансформира примитивни типове
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: process.env.NODE_ENV === 'production',
      }),
    },
    // Глобален ValidationExceptionFilter за по-добра обработка на валидационни грешки
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Прилагаме security middlewares в правилния ред

    // 1. Прилагаме cookie-parser middleware глобално
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
    consumer.apply(cookieParser()).forRoutes('*');

    // 2. Прилагаме Helmet middleware за HTTP хедъри и CSP политика
    consumer.apply(HelmetMiddleware).forRoutes('*');

    // 3. Прилагаме Rate Limiting middleware за защита от brute force и DoS атаки
    consumer.apply(RateLimitMiddleware).forRoutes('*');

    // 4. Прилагаме SQL Injection защита
    consumer.apply(SqlInjectionMiddleware).forRoutes('*');

    // 5. Прилагаме XSS защита - санитизира request данни
    consumer.apply(XssMiddleware).forRoutes('*');

    // 6. Прилагаме защита от parameter pollution
    consumer.apply(SanitizationMiddleware).forRoutes('*');

    // 7. Прилагаме Session управление с автоматично изтичане
    consumer.apply(SessionMiddleware).forRoutes('*');

    // 8. Прилагаме CSRF защита за всички пътища с изключение на тези, които
    // изрично се изключват в самия middleware
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
