import { Controller, Get, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';

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
}
