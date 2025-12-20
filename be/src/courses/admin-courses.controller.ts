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
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  list(): Promise<CourseSummaryDto[]> {
    return this.coursesService.getAdminCoursesList();
  }

  @Get(':courseId')
  getOne(@Param('courseId') courseId: string): Promise<CourseDetailDto> {
    return this.coursesService.getAdminCourseDetail(courseId);
  }

  @Post()
  create(@Body() dto: unknown): Promise<CourseDetailDto> {
    return this.coursesService.adminCreateCourse(dto as AdminCreateCourseDto);
  }

  @Patch(':courseId')
  update(
    @Param('courseId') courseId: string,
    @Body() dto: unknown,
  ): Promise<CourseDetailDto> {
    return this.coursesService.adminUpdateCourse(
      courseId,
      dto as AdminUpdateCourseDto,
    );
  }

  @Post(':courseId/grants')
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
