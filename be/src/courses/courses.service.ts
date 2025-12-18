import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { CourseEnrollment } from './course-enrollment.entity';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { MyCourseListItemDto } from './dto/my-course-list-item.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseEnrollment)
    private readonly enrollmentRepo: Repository<CourseEnrollment>,
  ) {}

  private toSummary(course: Course): CourseSummaryDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      language: course.language,
      status: course.status,
      isPaid: !!course.isPaid,
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

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    if (course.isPaid) {
      throw new ForbiddenException('Payment required');
    }

    const existing = await this.enrollmentRepo.findOne({
      where: { courseId, userId },
    });

    if (existing) {
      return;
    }

    const enrollment = this.enrollmentRepo.create({
      courseId,
      userId,
      status: 'not_started',
    });

    await this.enrollmentRepo.save(enrollment);
  }

  async getMyCourses(userId: string): Promise<MyCourseListItemDto[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId },
      relations: ['course'],
      order: { enrolledAt: 'DESC' },
    });

    return enrollments
      .filter((e) => e.course && e.course.status === 'active')
      .map((e) => ({
        ...this.toSummary(e.course),
        enrollmentStatus: (e.status ?? 'not_started') as
          | 'not_started'
          | 'in_progress'
          | 'completed',
        progressPercent: null,
        enrolledAt: e.enrolledAt ? e.enrolledAt.toISOString() : null,
      }));
  }
}
