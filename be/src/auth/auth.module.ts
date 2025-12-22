import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './user.entity';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleVersion } from '../wiki/wiki-article-version.entity';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminMetricsService } from './admin-metrics.service';
import { AdminMetricsController } from './admin-metrics.controller';
import { AdminActivityService } from './admin-activity.service';
import { AdminActivityController } from './admin-activity.controller';
import { InMemoryLoginAttemptStore } from '../security/account-protection/login-attempts.store';
import { LoginProtectionInterceptor } from '../security/account-protection/login-protection.interceptor';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WikiArticle, WikiArticleVersion]),
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
    OptionalJwtAuthGuard,
    AdminGuard,
    AdminUsersService,
    AdminMetricsService,
    AdminActivityService,
    InMemoryLoginAttemptStore,
    LoginProtectionInterceptor,
  ],
  controllers: [
    AuthController,
    AccountController,
    AdminUsersController,
    AdminMetricsController,
    AdminActivityController,
  ],
  exports: [
    AuthService,
    AccountService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    AdminGuard,
    JwtModule,
    TypeOrmModule,
  ],
})
export class AuthModule {}
