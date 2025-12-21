import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  AdminCreateQuizDto,
  AdminCreateQuizQuestionDto,
  AdminQuizDto,
  AdminUpdateQuizDto,
  AdminUpdateQuizQuestionDto,
} from './dto/admin-quiz.dto';
import { AdminQuizzesService } from './admin-quizzes.service';

@Controller('admin/quizzes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminQuizzesController {
  constructor(private readonly adminQuizzesService: AdminQuizzesService) {}

  @Get()
  list(): Promise<AdminQuizDto[]> {
    return this.adminQuizzesService.list();
  }

  @Post()
  create(@Body() dto: AdminCreateQuizDto): Promise<AdminQuizDto> {
    return this.adminQuizzesService.create(dto);
  }

  @Get(':quizId')
  get(@Param('quizId') quizId: string): Promise<AdminQuizDto> {
    return this.adminQuizzesService.get(quizId);
  }

  @Patch(':quizId')
  update(
    @Param('quizId') quizId: string,
    @Body() dto: AdminUpdateQuizDto,
  ): Promise<AdminQuizDto> {
    return this.adminQuizzesService.update(quizId, dto);
  }

  @Delete(':quizId')
  @HttpCode(204)
  async delete(@Param('quizId') quizId: string): Promise<void> {
    await this.adminQuizzesService.delete(quizId);
  }

  @Post(':quizId/questions')
  addQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: AdminCreateQuizQuestionDto,
  ): Promise<AdminQuizDto> {
    return this.adminQuizzesService.addQuestion(quizId, dto);
  }

  @Patch(':quizId/questions/:questionId')
  updateQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() dto: AdminUpdateQuizQuestionDto,
  ): Promise<AdminQuizDto> {
    return this.adminQuizzesService.updateQuestion(quizId, questionId, dto);
  }

  @Delete(':quizId/questions/:questionId')
  @HttpCode(204)
  async deleteQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ): Promise<void> {
    await this.adminQuizzesService.deleteQuestion(quizId, questionId);
  }
}
