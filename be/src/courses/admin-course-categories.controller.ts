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
import { CourseCategoryDto } from './dto/course-category.dto';
import {
  AdminCreateCourseCategoryDto,
  AdminUpdateCourseCategoryDto,
} from './dto/admin-course-category.dto';

@Controller('admin/course-categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCourseCategoriesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async list(): Promise<CourseCategoryDto[]> {
    return this.coursesService.getAdminCourseCategories();
  }

  @Post()
  async create(
    @Body() dto: AdminCreateCourseCategoryDto,
  ): Promise<CourseCategoryDto> {
    return this.coursesService.adminCreateCourseCategory(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateCourseCategoryDto,
  ): Promise<CourseCategoryDto> {
    return this.coursesService.adminUpdateCourseCategory(id, dto);
  }
}
