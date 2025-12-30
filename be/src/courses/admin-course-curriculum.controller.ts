import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeacherGuard } from '../auth/teacher.guard';
import { CoursesService } from './courses.service';
import { CourseModuleItemDto } from './dto/course-module-item.dto';
import { AdminCreateCourseCurriculumItemDto } from './dto/admin-create-course-curriculum-item.dto';
import { AdminUpdateCourseCurriculumItemDto } from './dto/admin-update-course-curriculum-item.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('admin/courses/:courseId/curriculum')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class AdminCourseCurriculumController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  list(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<CourseModuleItemDto[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.getAdminCourseCurriculum(courseId, userId);
  }

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() dto: AdminCreateCourseCurriculumItemDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CourseModuleItemDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.adminAddCurriculumItem(courseId, dto, userId);
  }

  @Patch(':itemId')
  update(
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AdminUpdateCourseCurriculumItemDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CourseModuleItemDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.adminUpdateCurriculumItem(
      courseId,
      itemId,
      dto,
      userId,
    );
  }

  @Delete(':itemId')
  @HttpCode(204)
  async delete(
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.coursesService.adminDeleteCurriculumItem(
      courseId,
      itemId,
      userId,
    );
  }
}
