import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CoursesService } from './courses.service';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { AdminCreateCourseDto } from './dto/admin-create-course.dto';
import { AdminUpdateCourseDto } from './dto/admin-update-course.dto';

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
}
