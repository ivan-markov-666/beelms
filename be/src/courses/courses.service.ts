import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  private toSummary(course: Course): CourseSummaryDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      language: course.language,
      status: course.status,
    };
  }

  async getPublicCatalog(): Promise<CourseSummaryDto[]> {
    const courses = await this.courseRepo.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });

    return courses.map((c) => this.toSummary(c));
  }

  async getPublicCourseDetail(courseId: string): Promise<CourseDetailDto> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    return {
      ...this.toSummary(course),
      curriculum: [],
    };
  }
}
