import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import {
  ThrottlerModule,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerOptions,
} from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SecurityInterceptor } from './interceptors/security.interceptor';
import { InputSanitizationInterceptor } from './interceptors/input-sanitization.interceptor';
import { IpBlockingService } from './services/ip-blocking.service';
import { SecurityMonitoringService } from './services/security-monitoring.service';
import { SecurityService } from './services/security.service';
import { InputValidationPipe } from './pipes/input-validation.pipe';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        } as ThrottlerOptions,
      ],
    } as ThrottlerModuleOptions),
    RedisModule,
  ],
  providers: [
    IpBlockingService,
    SecurityMonitoringService,
    SecurityService,
    InputValidationPipe,
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityInterceptor,
    } as const,
    {
      provide: APP_INTERCEPTOR,
      useClass: InputSanitizationInterceptor,
    } as const,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    } as const,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    } as const,
  ],
  exports: [
    SecurityService,
    IpBlockingService,
    SecurityMonitoringService,
    InputValidationPipe,
  ],
})
export class SecurityModule {}
