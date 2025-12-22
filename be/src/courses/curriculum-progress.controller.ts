import {
  Controller,
  Post,
  Param,
  UseGuards,
  Req,
  HttpCode,
  Get,
  UnauthorizedException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoursesService } from './courses.service';

interface AuthRequest {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('courses/:courseId/curriculum')
@UseGuards(JwtAuthGuard)
export class CurriculumProgressController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post(':itemId/complete')
  @HttpCode(204)
  async markItemCompleted(
    @Req() req: AuthRequest,
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ): Promise<void> {
    if (!req.user?.userId) {
      throw new UnauthorizedException(
        'Authenticated user not found in request context',
      );
    }

    const userId = req.user.userId;
    await this.coursesService.markCurriculumItemCompleted(
      userId,
      courseId,
      itemId,
    );
  }

  @Get('progress')
  async getCurriculumProgress(
    @Req() req: AuthRequest,
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
  ): Promise<{
    totalItems: number;
    completedItems: number;
    progressPercent: number;
    items: Array<{
      id: string;
      title: string;
      itemType: string;
      wikiSlug: string | null;
      taskId: string | null;
      quizId: string | null;
      completed: boolean;
      completedAt: string | null;
    }>;
  }> {
    if (!req.user?.userId) {
      throw new UnauthorizedException(
        'Authenticated user not found in request context',
      );
    }

    const userId = req.user.userId;
    return await this.coursesService.getCurriculumProgress(userId, courseId);
  }
}
