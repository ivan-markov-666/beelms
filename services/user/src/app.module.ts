import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './users/users.module';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
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
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Прилагаме cookie-parser middleware глобално
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
    consumer.apply(cookieParser()).forRoutes('*');

    // Прилагаме CSRF защита за всички пътища с изключение на тези, които
    // изрично се изключват в самия middleware
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
