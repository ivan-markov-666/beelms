import {
  Module,
  NestModule,
  MiddlewareConsumer,
  OnModuleInit,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdsModule } from './ads/ads.module';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CustomThrottlerGuard } from './auth/guards/throttler.guard';
import { Advertisement } from './ads/entities/advertisement.entity';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import * as cookieParser from 'cookie-parser';
import { EncryptionModule } from './common/encryption.module';
import { EncryptionService } from './common/services/encryption.service';
import { EncryptionInterceptor } from './common/interceptors/encryption.interceptor';
import { EncryptionTransformer } from './common/transformers/encryption.transformer';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Модул за криптиране на чувствителни данни
    EncryptionModule,
    // Конфигуриране на Rate Limiting за цялото приложение
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL') || 60, // време в секунди
            limit: configService.get<number>('THROTTLE_LIMIT') || 10, // максимален брой заявки за периода
          },
        ],
      }),
    }),
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
        entities: [Advertisement, User],
        synchronize: false, // Временно деактивирана поради проблем с промяна на схемата
      }),
    }),
    AdsModule,
    AuthModule,
    SharedModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Добавяне на CustomThrottlerGuard като глобален guard
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    // Глобален интерцептор за автоматично криптиране на чувствителни данни
    {
      provide: APP_INTERCEPTOR,
      useClass: EncryptionInterceptor,
    },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  // Инжектиране на сервиза за криптиране
  constructor(private readonly encryptionService: EncryptionService) {}

  // Инициализиране на трансформера след стартиране на модула
  onModuleInit() {
    // Настройка на статичния трансформер с инстанция на сервиза за криптиране
    EncryptionTransformer.setEncryptionService(this.encryptionService);

    // Проверка на ключа за криптиране
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.warn(
        '===== ПРЕДУПРЕЖДЕНИЕ ЗА СИГУРНОСТ: Не е намерен ENCRYPTION_KEY в средата! =====\n' +
          'Ще бъде използван временен ключ, което НЕ Е безопасно за продукционна среда.\n' +
          'Моля, задайте ENCRYPTION_KEY в .env файла или в средата на изпълнение.\n' +
          '====================================================================',
      );
    }
  }
  configure(consumer: MiddlewareConsumer) {
    // Регистриране на cookieParser middleware за работа с бисквитки
    consumer.apply(cookieParser()).forRoutes('*');

    // Регистриране на CSRF защита за всички маршрути
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
