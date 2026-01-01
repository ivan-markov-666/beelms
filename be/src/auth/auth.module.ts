import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './user.entity';
import { GoogleOAuthService } from './google-oauth.service';
import { SocialOAuthStateService } from './social-oauth-state.service';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleVersion } from '../wiki/wiki-article-version.entity';
import { WikiArticleFeedback } from '../wiki/wiki-article-feedback.entity';
import { WikiArticleView } from '../wiki/wiki-article-view.entity';
import { WikiArticleIpViewDaily } from '../wiki/wiki-article-ip-view-daily.entity';
import { AnalyticsSession } from '../analytics/analytics-session.entity';
import { AnalyticsPageViewDaily } from '../analytics/analytics-page-view-daily.entity';
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
import { CaptchaService } from '../security/captcha/captcha.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      WikiArticle,
      WikiArticleVersion,
      WikiArticleFeedback,
      WikiArticleView,
      WikiArticleIpViewDaily,
      AnalyticsSession,
      AnalyticsPageViewDaily,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN ?? '900s',
      },
    }),
    forwardRef(() => SettingsModule),
  ],
  providers: [
    AuthService,
    AccountService,
    CaptchaService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    AdminGuard,
    AdminUsersService,
    AdminMetricsService,
    AdminActivityService,
    InMemoryLoginAttemptStore,
    LoginProtectionInterceptor,
    GoogleOAuthService,
    SocialOAuthStateService,
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
