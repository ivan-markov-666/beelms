import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { TeacherGuard } from '../auth/teacher.guard';
import { CoursesService } from './courses.service';
import { CourseCategoryDto } from './dto/course-category.dto';
import {
  AdminCreateCourseCategoryDto,
  AdminUpdateCourseCategoryDto,
} from './dto/admin-course-category.dto';

@Controller('admin/course-categories')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class AdminCourseCategoriesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async list(): Promise<CourseCategoryDto[]> {
    return this.coursesService.getAdminCourseCategories();
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @Body() dto: AdminCreateCourseCategoryDto,
  ): Promise<CourseCategoryDto> {
    return this.coursesService.adminCreateCourseCategory(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateCourseCategoryDto,
  ): Promise<CourseCategoryDto> {
    return this.coursesService.adminUpdateCourseCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(204)
  async deleteCategory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.coursesService.adminDeleteCourseCategory(id);
  }
}
