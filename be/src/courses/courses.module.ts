import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseEnrollment } from './course-enrollment.entity';
import { MyCoursesController } from './my-courses.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseEnrollment]), AuthModule],
  controllers: [CoursesController, MyCoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
