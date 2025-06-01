import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { Content } from './entities/content.entity';
import { UserProgress } from './entities/user-progress.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(UserProgress)
    private userProgressRepository: Repository<UserProgress>,
  ) {}

  // ============== Курсове ==============

  async getCourses(isActive?: boolean): Promise<Course[]> {
    try {
      const where: FindOptionsWhere<Course> = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }
      
      return await this.courseRepository.find({
        where,
        order: { id: 'ASC' },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на курсовете',
      );
    }
  }

  async getCourseById(id: number): Promise<Course> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['chapters'],
      });

      if (!course) {
        throw new NotFoundException(`Курс с ID ${id} не е намерен`);
      }

      return course;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на курса',
      );
    }
  }

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    try {
      const course = this.courseRepository.create(createCourseDto);
      return await this.courseRepository.save(course);
    } catch (error) {
      throw new InternalServerErrorException(
        'Възникна грешка при създаването на курса',
      );
    }
  }

  async updateCourse(
    id: number,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    try {
      const course = await this.getCourseById(id);
      
      Object.assign(course, updateCourseDto);
      
      return await this.courseRepository.save(course);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при обновяването на курса',
      );
    }
  }

  async deleteCourse(id: number): Promise<void> {
    try {
      const course = await this.getCourseById(id);
      await this.courseRepository.remove(course);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при изтриването на курса',
      );
    }
  }

  // ============== Глави ==============

  async getChapters(courseId: number): Promise<Chapter[]> {
    try {
      // Проверяваме дали курсът съществува
      await this.getCourseById(courseId);
      
      return await this.chapterRepository.find({
        where: { courseId },
        order: { order: 'ASC' },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на главите',
      );
    }
  }

  async getChapterById(id: number): Promise<Chapter> {
    try {
      const chapter = await this.chapterRepository.findOne({
        where: { id },
        relations: ['contents', 'course'],
      });

      if (!chapter) {
        throw new NotFoundException(`Глава с ID ${id} не е намерена`);
      }

      return chapter;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на главата',
      );
    }
  }

  async createChapter(
    createChapterDto: CreateChapterDto,
  ): Promise<Chapter> {
    try {
      // Проверяваме дали курсът съществува
      await this.getCourseById(createChapterDto.courseId);
      
      // Проверяваме дали вече съществува глава със същия пореден номер
      const existingChapter = await this.chapterRepository.findOne({
        where: {
          courseId: createChapterDto.courseId,
          order: createChapterDto.order,
        },
      });

      if (existingChapter) {
        throw new BadRequestException(
          `Вече съществува глава с пореден номер ${createChapterDto.order} в този курс`,
        );
      }

      const chapter = this.chapterRepository.create(createChapterDto);
      return await this.chapterRepository.save(chapter);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при създаването на главата',
      );
    }
  }

  async updateChapter(
    id: number,
    updateChapterDto: UpdateChapterDto,
  ): Promise<Chapter> {
    try {
      const chapter = await this.getChapterById(id);
      
      // Ако се променя поредният номер, проверяваме дали вече съществува глава със същия номер
      if (
        updateChapterDto.order &&
        updateChapterDto.order !== chapter.order
      ) {
        const existingChapter = await this.chapterRepository.findOne({
          where: {
            courseId: chapter.courseId,
            order: updateChapterDto.order,
          },
        });

        if (existingChapter && existingChapter.id !== id) {
          throw new BadRequestException(
            `Вече съществува глава с пореден номер ${updateChapterDto.order} в този курс`,
          );
        }
      }

      Object.assign(chapter, updateChapterDto);
      
      return await this.chapterRepository.save(chapter);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при обновяването на главата',
      );
    }
  }

  async deleteChapter(id: number): Promise<void> {
    try {
      const chapter = await this.getChapterById(id);
      await this.chapterRepository.remove(chapter);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при изтриването на главата',
      );
    }
  }

  // ============== Съдържание ==============

  async getContentsByChapterId(chapterId: number): Promise<Content[]> {
    try {
      // Проверяваме дали главата съществува
      await this.getChapterById(chapterId);
      
      return await this.contentRepository.find({
        where: { chapterId },
        order: { order: 'ASC' },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на съдържанието',
      );
    }
  }

  async getContentById(id: number): Promise<Content> {
    try {
      const content = await this.contentRepository.findOne({
        where: { id },
        relations: ['chapter'],
      });

      if (!content) {
        throw new NotFoundException(`Съдържание с ID ${id} не е намерено`);
      }

      return content;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на съдържанието',
      );
    }
  }

  async createContent(
    createContentDto: CreateContentDto,
  ): Promise<Content> {
    try {
      // Проверяваме дали главата съществува
      await this.getChapterById(createContentDto.chapterId);

      // Проверяваме дали вече съществува съдържание със същия пореден номер
      const existingContent = await this.contentRepository.findOne({
        where: {
          chapterId: createContentDto.chapterId,
          order: createContentDto.order,
        },
      });

      if (existingContent) {
        throw new BadRequestException(
          `Вече съществува съдържание с пореден номер ${createContentDto.order} в тази глава`,
        );
      }

      const content = this.contentRepository.create(createContentDto);
      return await this.contentRepository.save(content);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при създаването на съдържанието',
      );
    }
  }

  async updateContent(
    id: number,
    updateContentDto: UpdateContentDto,
  ): Promise<Content> {
    try {
      const content = await this.getContentById(id);

      // Ако се променя поредният номер, проверяваме дали вече съществува съдържание със същия номер
      if (
        updateContentDto.order &&
        updateContentDto.order !== content.order
      ) {
        const existingContent = await this.contentRepository.findOne({
          where: {
            chapterId: content.chapterId,
            order: updateContentDto.order,
          },
        });

        if (existingContent && existingContent.id !== id) {
          throw new BadRequestException(
            `Вече съществува съдържание с пореден номер ${updateContentDto.order} в тази глава`,
          );
        }
      }

      Object.assign(content, updateContentDto);
      
      return await this.contentRepository.save(content);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при обновяването на съдържанието',
      );
    }
  }

  async deleteContent(id: number): Promise<void> {
    try {
      const content = await this.getContentById(id);
      await this.contentRepository.remove(content);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при изтриването на съдържанието',
      );
    }
  }

  // ============== Проследяване на прогреса ==============

  async getUserProgress(userId: number, courseId?: number): Promise<UserProgress[]> {
    try {
      const query: FindOptionsWhere<UserProgress> = { userId };
      
      if (courseId) {
        // Ако е предоставен courseId, намираме всички глави за този курс
        const chapters = await this.getChapters(courseId);
        const chapterIds = chapters.map(chapter => chapter.id);
        
        if (chapterIds.length > 0) {
          query.chapterId = In(chapterIds);
        } else {
          return []; // Ако няма глави в курса, връщаме празен масив
        }
      }
      
      return await this.userProgressRepository.find({
        where: query,
        order: { lastAccessed: 'DESC' },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на прогреса',
      );
    }
  }

  async updateUserProgress(
    userId: number,
    chapterId: number,
    contentId?: number,
    completed: boolean = false,
    progressPercentage: number = 0,
  ): Promise<UserProgress> {
    try {
      // Проверяваме дали главата съществува
      const chapter = await this.getChapterById(chapterId);
      
      // Проверяваме дали съдържанието съществува, ако е предоставено
      if (contentId) {
        const content = await this.getContentById(contentId);
        if (content.chapterId !== chapterId) {
          throw new BadRequestException(
            'Посоченото съдържание не принадлежи на посочената глава',
          );
        }
      }

      // Търсим съществуващ запис за прогреса
      let userProgress = await this.userProgressRepository.findOne({
        where: {
          userId,
          chapterId,
          ...(contentId && { contentId }),
        },
      });

      // Ако не съществува, създаваме нов запис
      if (!userProgress) {
        userProgress = this.userProgressRepository.create({
          userId,
          chapterId,
          contentId,
          completed,
          progressPercentage,
          lastAccessed: new Date(),
        });
      } else {
        // В противен случай, обновяваме съществуващия запис
        userProgress.completed = completed;
        userProgress.progressPercentage = progressPercentage;
        userProgress.lastAccessed = new Date();
      }

      return await this.userProgressRepository.save(userProgress);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Възникна грешка при обновяването на прогреса',
      );
    }
  }
}
