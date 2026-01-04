import { Controller, Get, UseGuards } from '@nestjs/common';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';
import { CoursesService } from './courses.service';
import { CourseCategoryDto } from './dto/course-category.dto';

@Controller('course-categories')
@UseGuards(FeatureEnabledGuard('courses'), FeatureEnabledGuard('coursesPublic'))
export class CourseCategoriesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async listPublic(): Promise<CourseCategoryDto[]> {
    return this.coursesService.getPublicCourseCategories();
  }
}
