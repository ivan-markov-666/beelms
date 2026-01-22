import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WikiArticle } from './wiki/wiki-article.entity';
import { WikiArticleVersion } from './wiki/wiki-article-version.entity';
import { WikiArticleFeedback } from './wiki/wiki-article-feedback.entity';
import { WikiArticleView } from './wiki/wiki-article-view.entity';
import { WikiArticleIpViewDaily } from './wiki/wiki-article-ip-view-daily.entity';
import { WikiModule } from './wiki/wiki.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { RateLimitInterceptor } from './security/rate-limit/rate-limit.interceptor';
import { InMemoryRateLimitStore } from './security/rate-limit/rate-limit.store';
import { CoursesModule } from './courses/courses.module';
import { PaymentsModule } from './payments/payments.module';
import { Course } from './courses/course.entity';
import { CourseCategory } from './courses/course-category.entity';
import { CourseEnrollment } from './courses/course-enrollment.entity';
import { CourseCurriculumItem } from './courses/course-curriculum-item.entity';
import { UserCurriculumProgress } from './courses/user-curriculum-progress.entity';
import { CoursePurchase } from './courses/course-purchase.entity';
import { PaymentSettings } from './payments/payment-settings.entity';
import { StripeWebhookEvent } from './payments/stripe-webhook-event.entity';
import { PaymentCheckout } from './payments/payment-checkout.entity';
import { AssessmentsModule } from './assessments/assessments.module';
import { Quiz } from './assessments/quiz.entity';
import { QuizQuestion } from './assessments/quiz-question.entity';
import { QuizOption } from './assessments/quiz-option.entity';
import { QuizAttempt } from './assessments/quiz-attempt.entity';
import { TasksModule } from './tasks/tasks.module';
import { Task } from './tasks/task.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnalyticsSession } from './analytics/analytics-session.entity';
import { AnalyticsPageViewDaily } from './analytics/analytics-page-view-daily.entity';
import { SettingsModule } from './settings/settings.module';
import { InstanceConfig } from './settings/instance-config.entity';
import { LegalModule } from './legal/legal.module';
import { LegalPage } from './legal/legal-page.entity';
import { CustomPagesModule } from './custom-pages/custom-pages.module';
import { CustomPage } from './custom-pages/custom-page.entity';
import { BackupsModule } from './backups/backups.module';
import { Backup } from './backups/backup.entity';
import { BackupLog } from './backups/backup-log.entity';

const resolvedDbHost = process.env.DB_HOST ?? 'localhost';
const resolvedDbPort = Number(process.env.DB_PORT ?? 5432);
const resolvedDbUser = process.env.DB_USER ?? 'beelms';
const resolvedDbName = process.env.DB_NAME ?? 'beelms';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: resolvedDbHost,
      port: resolvedDbPort,
      username: resolvedDbUser,
      password: process.env.DB_PASSWORD ?? 'beelms',
      database: resolvedDbName,
      entities: [
        WikiArticle,
        WikiArticleVersion,
        WikiArticleFeedback,
        WikiArticleView,
        WikiArticleIpViewDaily,
        AnalyticsSession,
        AnalyticsPageViewDaily,
        User,
        Course,
        CourseCategory,
        CourseEnrollment,
        CoursePurchase,
        PaymentSettings,
        StripeWebhookEvent,
        PaymentCheckout,
        CourseCurriculumItem,
        UserCurriculumProgress,
        Quiz,
        QuizQuestion,
        QuizOption,
        QuizAttempt,
        Task,
        InstanceConfig,
        LegalPage,
        CustomPage,
        Backup,
        BackupLog,
      ],
      synchronize: false,
    }),
    WikiModule,
    AuthModule,
    AnalyticsModule,
    CoursesModule,
    PaymentsModule,
    AssessmentsModule,
    TasksModule,
    SettingsModule,
    LegalModule,
    CustomPagesModule,
    BackupsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    InMemoryRateLimitStore,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
})
export class AppModule {}
