import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CoursesService } from './courses.service';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WikiArticleDetailDto } from '../wiki/dto/wiki-article-detail.dto';
import { CourseCertificateDto } from './dto/course-certificate.dto';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('courses')
@UseGuards(FeatureEnabledGuard('courses'))
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @UseGuards(FeatureEnabledGuard('coursesPublic'))
  async listPublicCatalog(
    @Query('category') category?: string,
  ): Promise<CourseSummaryDto[]> {
    return this.coursesService.getPublicCatalog(category);
  }

  @Get(':courseId')
  @UseGuards(FeatureEnabledGuard('coursesPublic'))
  async getPublicDetail(
    @Param('courseId') courseId: string,
  ): Promise<CourseDetailDto> {
    return this.coursesService.getPublicCourseDetail(courseId);
  }

  @Post(':courseId/enroll')
  @UseGuards(FeatureEnabledGuard('myCourses'), JwtAuthGuard)
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

  @Get(':courseId/certificate')
  @UseGuards(FeatureEnabledGuard('myCourses'), JwtAuthGuard)
  async getCertificate(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<CourseCertificateDto> {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.getCourseCertificate(
      userId,
      userEmail,
      courseId,
    );
  }

  @Get(':courseId/wiki/:slug')
  @UseGuards(FeatureEnabledGuard('myCourses'), JwtAuthGuard)
  async getCourseWikiArticle(
    @Param('courseId') courseId: string,
    @Param('slug') slug: string,
    @Query('lang') lang: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<WikiArticleDetailDto> {
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.getCourseWikiArticle(
      userId,
      courseId,
      slug,
      lang,
    );
  }

  @Get(':courseId/tasks/:taskId')
  @UseGuards(FeatureEnabledGuard('myCourses'), JwtAuthGuard)
  async getCourseTask(
    @Param('courseId') courseId: string,
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    id: string;
    title: string;
    description: string;
    language: string;
    status: string;
    updatedAt: string;
  }> {
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.getCourseTask(userId, courseId, taskId);
  }
}
