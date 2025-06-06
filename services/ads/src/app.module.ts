import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdsModule } from './ads/ads.module';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './auth/guards/throttler.guard';
import { Advertisement } from './ads/entities/advertisement.entity';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import * as cookieParser from 'cookie-parser';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // Конфигуриране на Rate Limiting за цялото приложение
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL') || 60, // време в секунди
            limit: configService.get<number>('THROTTLE_LIMIT') || 10, // максимален брой заявки за периода
          }
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
        entities: [Advertisement],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
    }),
    AdsModule,
    AuthModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Добавяне на CustomThrottlerGuard като глобален guard
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Регистриране на cookieParser middleware за работа с бисквитки
    consumer
      .apply(cookieParser())
      .forRoutes('*');
    
    // Регистриране на CSRF защита за всички маршрути
    consumer
      .apply(CsrfMiddleware)
      .forRoutes('*');
  }
}
