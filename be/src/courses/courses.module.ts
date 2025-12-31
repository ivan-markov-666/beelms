import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { CourseCategory } from './course-category.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseEnrollment } from './course-enrollment.entity';
import { MyCoursesController } from './my-courses.controller';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/user.entity';
import { AdminCoursesController } from './admin-courses.controller';
import { CourseCurriculumItem } from './course-curriculum-item.entity';
import { AdminCourseCurriculumController } from './admin-course-curriculum.controller';
import { CourseCategoriesController } from './course-categories.controller';
import { AdminCourseCategoriesController } from './admin-course-categories.controller';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleVersion } from '../wiki/wiki-article-version.entity';
import { UserCurriculumProgress } from './user-curriculum-progress.entity';
import { CurriculumProgressController } from './curriculum-progress.controller';
import { CoursePurchase } from './course-purchase.entity';
import { Quiz } from '../assessments/quiz.entity';
import { Task } from '../tasks/task.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Course,
      CourseCategory,
      CourseEnrollment,
      CoursePurchase,
      CourseCurriculumItem,
      UserCurriculumProgress,
      WikiArticle,
      WikiArticleVersion,
      Quiz,
      Task,
    ]),
    AuthModule,
    SettingsModule,
  ],
  controllers: [
    CoursesController,
    CourseCategoriesController,
    MyCoursesController,
    AdminCoursesController,
    AdminCourseCategoriesController,
    AdminCourseCurriculumController,
    CurriculumProgressController,
  ],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
