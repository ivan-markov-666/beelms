import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './user.entity';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminMetricsService } from './admin-metrics.service';
import { AdminMetricsController } from './admin-metrics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN ?? '900s',
      },
    }),
  ],
  providers: [
    AuthService,
    AccountService,
    JwtAuthGuard,
    AdminGuard,
    AdminUsersService,
    AdminMetricsService,
  ],
  controllers: [
    AuthController,
    AccountController,
    AdminUsersController,
    AdminMetricsController,
  ],
  exports: [
    AuthService,
    AccountService,
    JwtAuthGuard,
    AdminGuard,
    JwtModule,
    TypeOrmModule,
  ],
})
export class AuthModule {}
