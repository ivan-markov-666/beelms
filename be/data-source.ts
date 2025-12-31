import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { WikiArticle } from './src/wiki/wiki-article.entity';
import { WikiArticleVersion } from './src/wiki/wiki-article-version.entity';
import { WikiArticleFeedback } from './src/wiki/wiki-article-feedback.entity';
import { WikiArticleView } from './src/wiki/wiki-article-view.entity';
import { WikiArticleIpViewDaily } from './src/wiki/wiki-article-ip-view-daily.entity';
import { User } from './src/auth/user.entity';
import { Course } from './src/courses/course.entity';
import { CourseCategory } from './src/courses/course-category.entity';
import { CourseEnrollment } from './src/courses/course-enrollment.entity';
import { CourseCurriculumItem } from './src/courses/course-curriculum-item.entity';
import { UserCurriculumProgress } from './src/courses/user-curriculum-progress.entity';
import { CoursePurchase } from './src/courses/course-purchase.entity';
import { PaymentSettings } from './src/payments/payment-settings.entity';
import { StripeWebhookEvent } from './src/payments/stripe-webhook-event.entity';
import { Quiz } from './src/assessments/quiz.entity';
import { QuizQuestion } from './src/assessments/quiz-question.entity';
import { QuizOption } from './src/assessments/quiz-option.entity';
import { QuizAttempt } from './src/assessments/quiz-attempt.entity';
import { Task } from './src/tasks/task.entity';
import { AnalyticsSession } from './src/analytics/analytics-session.entity';
import { AnalyticsPageViewDaily } from './src/analytics/analytics-page-view-daily.entity';
import { InstanceConfig } from './src/settings/instance-config.entity';
import { LegalPage } from './src/legal/legal-page.entity';

export const AppDataSource = new DataSource({
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
    CourseCurriculumItem,
    UserCurriculumProgress,
    Quiz,
    QuizQuestion,
    QuizOption,
    QuizAttempt,
    Task,
    InstanceConfig,
    LegalPage,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
