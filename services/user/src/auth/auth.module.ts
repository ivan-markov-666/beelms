import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { SecurityLoggerService } from './services/security-logger.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthThrottlerGuard } from '../common/guards/auth-throttler.guard';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    CommonModule,
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    JwtStrategy,
    SecurityLoggerService,
    AccountLockoutService,
    AuthService,
    // Добавяме защита срещу брутфорс атаки чрез custom throttler guard
    {
      provide: APP_GUARD,
      useClass: AuthThrottlerGuard,
    },
  ],
  exports: [
    JwtStrategy,
    PassportModule,
    JwtModule,
    SecurityLoggerService,
    AccountLockoutService,
    AuthService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
