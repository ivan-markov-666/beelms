import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssessmentsService } from './assessments.service';
import { QuizDto } from './dto/quiz.dto';
import { QuizSubmitInputDto, QuizSubmitResultDto } from './dto/quiz-submit.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('courses/:courseId/quizzes')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get(':quizId')
  @UseGuards(JwtAuthGuard)
  async getQuiz(
    @Param('courseId') courseId: string,
    @Param('quizId') quizId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<QuizDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.assessmentsService.getQuizForCourseUser(
      userId,
      courseId,
      quizId,
    );
  }

  @Post(':quizId/submit')
  @UseGuards(JwtAuthGuard)
  async submitQuiz(
    @Param('courseId') courseId: string,
    @Param('quizId') quizId: string,
    @Body() dto: QuizSubmitInputDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<QuizSubmitResultDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.assessmentsService.submitQuizForCourseUser(
      userId,
      courseId,
      quizId,
      dto,
    );
  }
}
