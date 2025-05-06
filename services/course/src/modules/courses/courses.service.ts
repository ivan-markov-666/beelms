import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '@shared/modules/cache/cache.service';
import { Repository } from 'typeorm';
import { Course } from '../../entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    private cacheService: CacheService,
  ) {}

  async findAll(): Promise<Course[]> {
    const cacheKey = this.cacheService.generateKey('courses', 'all');

    return this.cacheService.getOrSet(
      cacheKey,
      () =>
        this.coursesRepository.find({
          where: { isActive: true },
          order: { title: 'ASC' },
        }),
      3600, // TTL: 1 час
    );
  }

  async findOne(id: number): Promise<Course> {
    const cacheKey = this.cacheService.generateKey('courses', id.toString());

    return this.cacheService.getOrSet(
      cacheKey,
      () =>
        this.coursesRepository.findOneOrFail({
          where: { id, isActive: true },
          relations: ['chapters'],
        }),
      3600, // TTL: 1 час
    );
  }

  async create(courseData: Partial<Course>): Promise<Course> {
    const course = this.coursesRepository.create(courseData);
    await this.coursesRepository.save(course);

    // Инвалидиране на кеша
    await this.cacheService.delete(this.cacheService.generateKey('courses', 'all'));

    return course;
  }

  async update(id: number, courseData: Partial<Course>): Promise<Course> {
    await this.coursesRepository.update(id, courseData);

    // Инвалидиране на съответните кеш записи
    await this.cacheService.delete(this.cacheService.generateKey('courses', id.toString()));
    await this.cacheService.delete(this.cacheService.generateKey('courses', 'all'));

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.coursesRepository.delete(id);

    // Инвалидиране на съответните кеш записи
    await this.cacheService.delete(this.cacheService.generateKey('courses', id.toString()));
    await this.cacheService.delete(this.cacheService.generateKey('courses', 'all'));
  }
}
