import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '../courses/courses.module';
import { AuthModule } from '../auth/auth.module';
import { Quiz } from './quiz.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizOption } from './quiz-option.entity';
import { QuizAttempt } from './quiz-attempt.entity';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { AdminQuizzesService } from './admin-quizzes.service';
import { AdminQuizzesController } from './admin-quizzes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, QuizQuestion, QuizOption, QuizAttempt]),
    CoursesModule,
    AuthModule,
  ],
  providers: [AssessmentsService, AdminQuizzesService],
  controllers: [AssessmentsController, AdminQuizzesController],
})
export class AssessmentsModule {}
