import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { TeacherGuard } from '../auth/teacher.guard';
import { CoursesService } from './courses.service';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { AdminCreateCourseDto } from './dto/admin-create-course.dto';
import { AdminUpdateCourseDto } from './dto/admin-update-course.dto';
import { AdminGrantCourseAccessDto } from './dto/admin-grant-course-access.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest): Promise<CourseSummaryDto[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.getAdminCoursesList(userId);
  }

  @Get(':courseId')
  async getOne(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<CourseDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.getAdminCourseDetail(courseId, userId);
  }

  @Post()
  async create(
    @Body() dto: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<CourseDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.adminCreateCourse(
      dto as AdminCreateCourseDto,
      userId,
    );
  }

  @Patch(':courseId')
  update(
    @Param('courseId') courseId: string,
    @Body() dto: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<CourseDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.adminUpdateCourse(
      courseId,
      dto as AdminUpdateCourseDto,
      userId,
    );
  }

  @Post(':courseId/grants')
  @UseGuards(AdminGuard)
  @HttpCode(204)
  async grantCourseAccess(
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
    @Body() dto: AdminGrantCourseAccessDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.coursesService.adminGrantCourseAccess(
      courseId,
      dto,
      adminUserId,
    );
  }
}
