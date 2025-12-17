import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CoursesService } from './courses.service';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async listPublicCatalog(): Promise<CourseSummaryDto[]> {
    return this.coursesService.getPublicCatalog();
  }

  @Get(':courseId')
  async getPublicDetail(
    @Param('courseId') courseId: string,
  ): Promise<CourseDetailDto> {
    return this.coursesService.getPublicCourseDetail(courseId);
  }

  @Post(':courseId/enroll')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async enroll(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.coursesService.enrollInCourse(userId, courseId);
  }
}
