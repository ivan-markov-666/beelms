import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { XssProtectionMiddleware } from './shared/middleware/xss-protection.middleware';
import { CsrfProtectionMiddleware } from './shared/middleware/csrf-protection.middleware';
import { IpBlockingMiddleware } from './shared/middleware/ip-blocking.middleware';
import { RequestLoggingMiddleware } from './shared/middleware/request-logging.middleware';
import { AppThrottlerGuard } from './shared/guards/throttler.guard';
import { IpBlockingModule } from './shared/modules/ip-blocking.module';
import { RequestLoggingModule } from './shared/modules/request-logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432'), 10),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'analytics'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNC', 'false') === 'true',
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL', 60), // seconds
          limit: configService.get('THROTTLE_LIMIT', 10),
        },
      ],
    }),
    AnalyticsModule,
    AuthModule,
    IpBlockingModule,
    RequestLoggingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Add global rate limiting protection
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Request Logging middleware first to log all requests for security audit
    // This should be the first middleware in the chain to capture accurate timings and all requests
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    // Apply IP Blocking middleware to all routes except specific paths
    consumer
      .apply(IpBlockingMiddleware)
      .exclude(
        // Exclude health check endpoints
        { path: '/health', method: RequestMethod.ALL },
        { path: '/health/check', method: RequestMethod.ALL },
        // Exclude Swagger UI for documentation
        { path: '/api/docs', method: RequestMethod.ALL },
        { path: '/api/docs/*path', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '/*path', method: RequestMethod.ALL });

    // Apply XSS protection middleware to all routes
    consumer
      .apply(XssProtectionMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Apply CSRF protection middleware to all routes except GET requests and specific paths
    // GET requests don't need CSRF protection as they don't modify state
    consumer
      .apply(CsrfProtectionMiddleware)
      .exclude(
        // Exclude all GET requests
        { path: '/*path', method: RequestMethod.GET },
        // Swagger UI endpoints and resources
        { path: '/api/docs', method: RequestMethod.ALL },
        { path: '/api/docs/*path', method: RequestMethod.ALL },
        { path: '/api-docs', method: RequestMethod.ALL },
        { path: '/api-docs/*path', method: RequestMethod.ALL },
        { path: '/swagger/*path', method: RequestMethod.ALL },
        { path: '/swagger-ui/*path', method: RequestMethod.ALL },
        // Health check endpoints
        { path: '/health', method: RequestMethod.ALL },
        { path: '/health/check', method: RequestMethod.ALL },
        // CSP violation reports should be excluded
        { path: '/csp-violation-report', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '/*', method: RequestMethod.ALL });
  }
}
