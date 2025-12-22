import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WikiArticle } from './wiki/wiki-article.entity';
import { WikiArticleVersion } from './wiki/wiki-article-version.entity';
import { WikiArticleFeedback } from './wiki/wiki-article-feedback.entity';
import { WikiModule } from './wiki/wiki.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { RateLimitInterceptor } from './security/rate-limit/rate-limit.interceptor';
import { InMemoryRateLimitStore } from './security/rate-limit/rate-limit.store';
import { CoursesModule } from './courses/courses.module';
import { PaymentsModule } from './payments/payments.module';
import { Course } from './courses/course.entity';
import { CourseEnrollment } from './courses/course-enrollment.entity';
import { CourseCurriculumItem } from './courses/course-curriculum-item.entity';
import { UserCurriculumProgress } from './courses/user-curriculum-progress.entity';
import { CoursePurchase } from './courses/course-purchase.entity';
import { PaymentSettings } from './payments/payment-settings.entity';
import { StripeWebhookEvent } from './payments/stripe-webhook-event.entity';
import { AssessmentsModule } from './assessments/assessments.module';
import { Quiz } from './assessments/quiz.entity';
import { QuizQuestion } from './assessments/quiz-question.entity';
import { QuizOption } from './assessments/quiz-option.entity';
import { QuizAttempt } from './assessments/quiz-attempt.entity';
import { TasksModule } from './tasks/tasks.module';
import { Task } from './tasks/task.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'beelms',
      password: process.env.DB_PASSWORD ?? 'beelms',
      database: process.env.DB_NAME ?? 'beelms',
      entities: [
        WikiArticle,
        WikiArticleVersion,
        WikiArticleFeedback,
        User,
        Course,
        CourseEnrollment,
        CoursePurchase,
        PaymentSettings,
        StripeWebhookEvent,
        CourseCurriculumItem,
        UserCurriculumProgress,
        Quiz,
        QuizQuestion,
        QuizOption,
        QuizAttempt,
        Task,
      ],
      synchronize: false,
    }),
    WikiModule,
    AuthModule,
    CoursesModule,
    PaymentsModule,
    AssessmentsModule,
    TasksModule,
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
