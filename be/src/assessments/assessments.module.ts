import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '../courses/courses.module';
import { AuthModule } from '../auth/auth.module';
import { Quiz } from './quiz.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizOption } from './quiz-option.entity';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, QuizQuestion, QuizOption]),
    CoursesModule,
    AuthModule,
  ],
  providers: [AssessmentsService],
  controllers: [AssessmentsController],
})
export class AssessmentsModule {}
