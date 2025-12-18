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
import { CoursesService } from './courses.service';
import { CourseModuleItemDto } from './dto/course-module-item.dto';
import { AdminCreateCourseCurriculumItemDto } from './dto/admin-create-course-curriculum-item.dto';
import { AdminUpdateCourseCurriculumItemDto } from './dto/admin-update-course-curriculum-item.dto';

@Controller('admin/courses/:courseId/curriculum')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCourseCurriculumController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  list(@Param('courseId') courseId: string): Promise<CourseModuleItemDto[]> {
    return this.coursesService.getAdminCourseCurriculum(courseId);
  }

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() dto: AdminCreateCourseCurriculumItemDto,
  ): Promise<CourseModuleItemDto> {
    return this.coursesService.adminAddCurriculumItem(courseId, dto);
  }

  @Patch(':itemId')
  update(
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AdminUpdateCourseCurriculumItemDto,
  ): Promise<CourseModuleItemDto> {
    return this.coursesService.adminUpdateCurriculumItem(courseId, itemId, dto);
  }

  @Delete(':itemId')
  @HttpCode(204)
  async delete(
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    await this.coursesService.adminDeleteCurriculumItem(courseId, itemId);
  }
}
