import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  QueryRunner,
  Repository,
  FindOptionsWhere,
  In,
  IsNull,
  DeepPartial,
  Not,
} from 'typeorm';
import { Cache } from 'cache-manager';
import { sanitizeContent } from '../shared/utils/xss-protection.util';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { Content, ContentType } from './entities/content.entity';
import { ContentVersion } from './entities/content-version.entity';
import { UserProgress } from './entities/user-progress.entity';
import { UserProgressStats } from './entities/user-progress-stats.entity';
import { MediaFile, MediaType } from './entities/media-file.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { CreateContentVersionDto } from './dto/create-content-version.dto';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);
  /**
   * Executes operations within a database transaction
   * @param work Function containing the operations to execute within the transaction
   * @returns The result of the work function
   */
  private async executeInTransaction<T>(
    work: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.entityManager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      if (error instanceof Error) {
        this.logger.error('Transaction failed', error.stack);
      } else {
        this.logger.error('Transaction failed with unknown error');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(ContentVersion)
    private readonly contentVersionRepository: Repository<ContentVersion>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    @InjectRepository(UserProgressStats)
    private readonly userProgressStatsRepository: Repository<UserProgressStats>,
    @InjectRepository(MediaFile)
    private readonly mediaFileRepository: Repository<MediaFile>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  // ============== Курсове ==============

  async getCourses(
    isActive?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Опитваме се да извлечем от кеша
      const cacheKey = `courses:${isActive !== undefined ? isActive : 'all'}:page${page}:limit${limit}`;
      const cachedData = await this.cacheManager.get<{
        courses: Course[];
        total: number;
        page: number;
        limit: number;
      }>(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      // Ако няма данни в кеша, извличаме от базата
      const where: FindOptionsWhere<Course> = {};
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [courses, total] = await this.courseRepository.findAndCount({
        where,
        order: {
          title: 'ASC',
        },
        relations: ['chapters'],
        skip: (page - 1) * limit,
        take: limit,
      });

      const result = {
        courses,
        total,
        page,
        limit,
      };

      // Запазваме в кеша за бъдещи заявки
      await this.cacheManager.set(cacheKey, result, 60 * 15); // 15 минути

      return result;
    } catch {
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на курсовете',
      );
    }
  }

  async getCourseById(id: number): Promise<Course> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['chapters', 'chapters.contents'],
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
    return this.executeInTransaction<Course>(async (queryRunner) => {
      try {
        // Check if a course with the same title already exists (case-insensitive)
        const existingCourse = await queryRunner.manager
          .createQueryBuilder(Course, 'course')
          .where('LOWER(course.title) = LOWER(:title)', {
            title: createCourseDto.title.trim(),
          })
          .getOne();

        if (existingCourse) {
          throw new ConflictException(
            'A course with this title already exists',
          );
        }

        // Create and save the new course
        const course = this.courseRepository.create({
          ...createCourseDto,
          isActive: createCourseDto.isActive ?? true, // Default to active if not specified
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const savedCourse = await queryRunner.manager.save(course);

        // Invalidate the courses cache
        await Promise.all([
          this.cacheManager.del('courses:active'),
          this.cacheManager.del('courses:inactive'),
        ]);

        return savedCourse;
      } catch (error: unknown) {
        if (error instanceof ConflictException) {
          throw error;
        }
        this.logger.error(
          'Failed to create course',
          error instanceof Error ? error.stack : undefined,
        );
        throw new InternalServerErrorException(
          'An error occurred while creating the course',
        );
      }
    });
  }

  async updateCourse(
    id: number,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    return this.executeInTransaction<Course>(async (queryRunner) => {
      try {
        // Check if course exists and lock it for update
        const course = await queryRunner.manager.findOne(Course, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!course) {
          throw new NotFoundException(`Course with ID ${id} not found`);
        }

        // If title is being updated, check for conflicts
        if (updateCourseDto.title && updateCourseDto.title !== course.title) {
          const existingCourse = await queryRunner.manager
            .createQueryBuilder(Course, 'course')
            .where('LOWER(course.title) = LOWER(:title) AND course.id != :id', {
              title: updateCourseDto.title.trim(),
              id,
            })
            .getOne();

          if (existingCourse) {
            throw new ConflictException(
              'A course with this title already exists',
            );
          }
        }

        // Update course properties
        const updatedCourse = this.courseRepository.merge(course, {
          ...updateCourseDto,
          updatedAt: new Date(),
        });

        const savedCourse = await queryRunner.manager.save(updatedCourse);

        // Invalidate caches
        await Promise.all([
          this.cacheManager.del(`course:${id}`),
          this.cacheManager.del('courses:active'),
          this.cacheManager.del('courses:inactive'),
        ]);

        return savedCourse;
      } catch (error: unknown) {
        if (
          error instanceof NotFoundException ||
          error instanceof ConflictException
        ) {
          throw error;
        }
        this.logger.error(
          'Failed to update course',
          error instanceof Error ? error.stack : undefined,
        );
        throw new InternalServerErrorException(
          'An error occurred while updating the course',
        );
      }
    });
  }

  async deleteCourse(id: number): Promise<void> {
    return this.executeInTransaction<void>(async (queryRunner) => {
      try {
        // Check if course exists and lock it for update
        const course = await queryRunner.manager.findOne(Course, {
          where: { id },
          relations: ['chapters', 'chapters.contents'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!course) {
          throw new NotFoundException(`Course with ID ${id} not found`);
        }

        // Check if course has any chapters with content
        const hasContent = course.chapters?.some(
          (chapter) => chapter.contents?.length > 0,
        );

        if (hasContent) {
          throw new BadRequestException(
            'Cannot delete a course that contains chapters with content. Please delete the content first.',
          );
        }

        // Delete all chapters (which should be empty at this point)
        if (course.chapters?.length > 0) {
          await queryRunner.manager.delete(Chapter, {
            courseId: id,
          });
        }

        // Delete the course
        await queryRunner.manager.remove(course);

        // Invalidate caches
        await Promise.all([
          this.cacheManager.del(`course:${id}`),
          this.cacheManager.del('courses:active'),
          this.cacheManager.del('courses:inactive'),
        ]);
      } catch (error: unknown) {
        if (
          error instanceof NotFoundException ||
          error instanceof BadRequestException
        ) {
          throw error;
        }
        this.logger.error(
          'Failed to delete course',
          error instanceof Error ? error.stack : undefined,
        );
        throw new InternalServerErrorException(
          'An error occurred while deleting the course',
        );
      }
    });
  }

  // ============== Глави ==============

  async getChapters(
    courseId: number,
    page = 1,
    limit = 20,
  ): Promise<{
    chapters: Chapter[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Проверяваме дали курсът съществува
      await this.getCourseById(courseId);
      const whereClause: FindOptionsWhere<Chapter> = { courseId };
      const [chapters, total] = await this.chapterRepository.findAndCount({
        where: whereClause,
        order: {
          order: 'ASC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        chapters: chapters.map((chapter) => ({
          ...chapter,
          content: [],
        })),
        total,
        page,
        limit,
      };
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
        relations: ['contents'],
      });

      if (!chapter) {
        throw new NotFoundException(`Глава с ID ${id} не е намерена`);
      }

      const contents = await this.contentRepository.find({
        where: { chapterId: id },
      });

      if (contents.length > 0) {
        throw new BadRequestException('Глава съществува със съдържание');
      }

      return chapter;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Възникна грешка при извличането на главата: ${error.message}`,
        );
      } else {
        throw new InternalServerErrorException(
          'Възникна грешка при извличането на главата: Unknown error',
        );
      }
    }
  }

  async createChapter(createChapterDto: CreateChapterDto): Promise<Chapter> {
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
          `Глава с такъв пореден номер вече съществува в този курс`,
        );
      }

      // Създаваме главата
      const chapter = this.chapterRepository.create(createChapterDto);
      return await this.chapterRepository.save(chapter);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
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
      // Проверяваме дали главата съществува
      const chapter = await this.getChapterById(id);

      Object.assign(chapter, updateChapterDto);

      // Ако се променя поредният номер, проверяваме дали вече съществува глава със същия номер
      if (updateChapterDto.order && updateChapterDto.order !== chapter.order) {
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

      return await this.chapterRepository.save(chapter);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to update chapter: ${errorMessage}`,
      );
    }
  }

  async deleteChapter(id: number): Promise<void> {
    try {
      // Verify chapter exists before attempting to delete
      await this.getChapterById(id);

      const contents = await this.contentRepository.find({
        where: { chapterId: id },
      });

      if (contents.length > 0) {
        throw new BadRequestException(
          'Не може да изтриете глава, която съдържа съдържание. Първо изтрийте съдържанието.',
        );
      }

      await this.chapterRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to delete chapter: ${errorMessage}`,
      );
    }
  }

  // ============== Съдържание ==============

  async getContentsByChapterId(
    chapterId: number,
    page = 1,
    limit = 20,
  ): Promise<{
    contents: Content[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Проверяваме дали главата съществува
      await this.getChapterById(chapterId);

      const [contents, total] = await this.contentRepository.findAndCount({
        where: { chapterId },
        order: { order: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        contents,
        total,
        page,
        limit,
      };
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
      // Опитваме се да извлечем от кеша
      const cacheKey = `content:${id}`;
      const cachedContent = await this.cacheManager.get<Content>(cacheKey);

      if (cachedContent) {
        return cachedContent;
      }

      const content = await this.contentRepository.findOne({
        where: { id },
        relations: ['chapter'],
      });

      if (content) {
        // Съхраняваме в кеша за 10 минути
        await this.cacheManager.set(cacheKey, content, 600);
      }
      // Върне нулл ако не е намерено
      if (!content) {
        throw new NotFoundException(`Content with ID ${id} not found`);
      }

      return content;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to get content: ${errorMessage}`,
      );
    }
  }

  async publishContentVersion(contentVersionId: number): Promise<Content> {
    try {
      // Find the content version
      const contentVersion = await this.contentVersionRepository.findOne({
        where: { id: contentVersionId },
        relations: ['content'],
      });

      if (!contentVersion) {
        throw new NotFoundException(
          `Content version with ID ${contentVersionId} not found`,
        );
      }

      // Get the content associated with this version
      const content = await this.contentRepository.findOne({
        where: { id: contentVersion.contentId },
      });

      if (!content) {
        throw new NotFoundException(
          `Content with ID ${contentVersion.contentId} not found`,
        );
      }

      // Update the content with the version's content
      content.content = contentVersion.contentBody;
      content.version = contentVersion.versionNumber;
      content.isPublished = true;

      // Save the updated content
      return await this.contentRepository.save(content);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Възникна грешка при публикуването на версията на съдържанието',
      );
    }
  }

  async createContentVersion(
    createContentVersionDto: CreateContentVersionDto,
  ): Promise<ContentVersion> {
    try {
      // Validate contentId exists in this chapter
      const content = await this.contentRepository.findOne({
        where: { id: createContentVersionDto.contentId },
      });

      if (!content) {
        throw new NotFoundException(
          `Съдържание с ID ${createContentVersionDto.contentId} не е намерено`,
        );
      }

      // Create the version
      const contentVersion = this.contentVersionRepository.create({
        contentId: createContentVersionDto.contentId,
        contentBody: createContentVersionDto.contentBody,
        versionNumber: createContentVersionDto.versionNumber,
        changeDescription: createContentVersionDto.changeDescription,
        createdBy: createContentVersionDto.createdBy,
      });

      // Update the version of the main content
      await this.contentRepository.update(createContentVersionDto.contentId, {
        version: createContentVersionDto.versionNumber,
      });

      return await this.contentVersionRepository.save(contentVersion);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to create content version: ${errorMessage}`,
      );
    }
  }

  async createContent(createContentDto: CreateContentDto): Promise<Content> {
    const { chapterId, title, content, contentType, order } = createContentDto;

    // Защита срещу XSS
    const sanitizedContent = sanitizeContent(content);

    try {
      // Проверяваме дали главата съществува
      await this.getChapterById(chapterId);

      // Проверяваме дали има друго съдържание със същия пореден номер
      const existingContent = await this.contentRepository.findOne({
        where: {
          chapterId,
          order,
        },
      });

      if (existingContent) {
        throw new BadRequestException(
          `Вече съществува съдържание с пореден номер ${order} в тази глава`,
        );
      }

      // First validate the content type
      const validContentTypes = Object.values(ContentType);
      if (!validContentTypes.includes(contentType as ContentType)) {
        throw new BadRequestException(
          `Invalid content type. Must be one of: ${validContentTypes.join(', ')}`,
        );
      }

      // Create content with proper typing
      const newContent = this.contentRepository.create({
        title,
        content: sanitizedContent,
        contentType: contentType as ContentType,
        chapter: { id: chapterId },
        order,
        version: 1,
      });

      return await this.contentRepository.save(newContent);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
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
      // Find the existing content to update
      const existingContent = await this.contentRepository.findOne({
        where: { id },
        relations: ['chapter'],
      });

      if (!existingContent) {
        throw new NotFoundException(`Content with ID ${id} not found`);
      }

      // Apply XSS protection to content if provided
      if (updateContentDto.content) {
        updateContentDto.content = sanitizeContent(updateContentDto.content);
      }

      // Handle ordering conflicts
      if (
        updateContentDto.order !== undefined &&
        updateContentDto.order !== existingContent.order
      ) {
        const existingOrderContent = await this.contentRepository.findOne({
          where: {
            chapterId: existingContent.chapterId,
            order: updateContentDto.order,
          },
        });

        // If there's a conflict with the new order, reorder other content
        if (existingOrderContent) {
          await this.contentRepository.update(
            {
              chapterId: existingContent.chapterId,
              order: updateContentDto.order,
              id: Not(id), // Exclude the current content
            },
            { order: () => 'order + 1' }, // Increase the order of all items after the new position
          );
        }
      }

      // Create a new version if content, title, or published status has changed
      if (
        updateContentDto.content ||
        updateContentDto.title ||
        (updateContentDto.isPublished !== undefined &&
          updateContentDto.isPublished !== existingContent.isPublished)
      ) {
        const contentVersion = new ContentVersion();
        contentVersion.contentId = id;
        contentVersion.versionNumber = (existingContent.version || 0) + 1;
        contentVersion.contentBody =
          updateContentDto.content || existingContent.content;
        contentVersion.changeDescription =
          updateContentDto.changeDescription || 'Updated content';

        await this.contentVersionRepository.save(contentVersion);

        // Update the version in the content
        updateContentDto.version = contentVersion.versionNumber;
      }

      // Update the content with the new data
      const updatedContent = Object.assign(existingContent, updateContentDto);
      const savedContent = await this.contentRepository.save(updatedContent);

      // Invalidate cache keys for content and related entities
      await this.cacheManager.del(`content:${id}`);
      await this.cacheManager.del(
        `contents:chapter:${existingContent.chapterId}`,
      );

      return savedContent;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';

      this.logger.error(
        `Failed to update content: ${errorMessage}`,
        errorStack,
      );
      throw new InternalServerErrorException('Content update failed');
    }
  }

  async deleteContent(id: number): Promise<void> {
    try {
      // Find the content to delete
      const existingContent = await this.contentRepository.findOne({
        where: { id },
        relations: ['chapter'],
      });

      if (!existingContent) {
        throw new NotFoundException(`Content with ID ${id} not found`);
      }

      const chapterId = existingContent.chapterId;
      const orderToDelete = existingContent.order;

      // Delete the content
      await this.contentRepository.remove(existingContent);

      // Reorder remaining content to maintain sequence
      await this.contentRepository.query(
        `UPDATE content SET "order" = "order" - 1 
         WHERE "chapterId" = $1 AND "order" > $2 
         ORDER BY "order" ASC`,
        [chapterId, orderToDelete],
      );

      // Invalidate cache
      await this.cacheManager.del(`content:${id}`);
      await this.cacheManager.del(`contents:chapter:${chapterId}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';

      this.logger.error(
        `Failed to delete content: ${errorMessage}`,
        errorStack,
      );
      throw new InternalServerErrorException('Content deletion failed');
    }
  }

  async getUserProgress(
    userId: number,
    courseId?: number,
  ): Promise<UserProgress[]> {
    try {
      // Опитваме се да извлечем от кеша
      const cacheKey = `user-progress:${userId}`;
      const cachedProgress =
        await this.cacheManager.get<UserProgress[]>(cacheKey);

      if (cachedProgress) {
        return cachedProgress;
      }

      const query: FindOptionsWhere<UserProgress> = { userId };

      if (courseId) {
        // Ако е предоставен courseId, намираме всички глави за този курс
        const chaptersResult = await this.getChapters(courseId);
        const chapterIds = chaptersResult.chapters.map((chapter) => chapter.id);

        if (chapterIds.length > 0) {
          query.chapterId = In(chapterIds);
        } else {
          return []; // Ако няма глави в курса, връщаме празен масив
        }
      }

      const progress = await this.userProgressRepository.find({
        where: query,
        order: { lastAccessed: 'DESC' },
      });

      // Съхраняваме в кеша за 5 минути (по-малко от другите кешове, защото прогресът се променя по-често)
      await this.cacheManager.set(cacheKey, progress, 300);

      return progress;
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
    completed?: boolean,
    progressPercentage?: number,
    timeSpentSeconds?: number,
    deviceInfo?: string,
  ): Promise<UserProgress> {
    try {
      // Инвалидиране на кеша за потребителския прогрес
      await this.cacheManager.del(`user-progress:${userId}`);

      let userProgress = await this.userProgressRepository.findOne({
        where: {
          userId,
          chapterId,
          contentId: contentId || IsNull(),
        },
      });

      const now = new Date();

      if (!userProgress) {
        userProgress = this.userProgressRepository.create({
          userId,
          chapterId,
          contentId,
          completed: completed || false,
          progressPercentage: progressPercentage || 0,
          lastAccessed: now,
        });
      } else {
        userProgress.completed =
          completed !== undefined ? completed : userProgress.completed;

        userProgress.progressPercentage =
          progressPercentage !== undefined
            ? progressPercentage
            : userProgress.progressPercentage;

        userProgress.lastAccessed = now;
      }

      const savedProgress =
        await this.userProgressRepository.save(userProgress);

      // Записваме детайлна статистика за времето и прогреса
      if (timeSpentSeconds && timeSpentSeconds > 0) {
        const progressStatsData: DeepPartial<UserProgressStats> = {
          userId,
          contentId,
          chapterId,
          timeSpentSeconds,
          visitCount: 1,
          sessionStartTime: new Date(now.getTime() - timeSpentSeconds * 1000),
          sessionEndTime: now,
          deviceInfo: deviceInfo || undefined,
        };

        const progressStats =
          this.userProgressStatsRepository.create(progressStatsData);
        await this.userProgressStatsRepository.save(progressStats);
      }

      return savedProgress;
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Грешка при обновяване на прогреса: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Грешка при обновяване на прогреса',
      );
    }
  }

  // ============== Media Files ==============

  /**
   * Add a media file to content
   * @param contentId The ID of the content to add the media file to
   * @param mediaFileData The media file data
   * @returns The created media file
   */
  async addMediaFileToContent(
    contentId: number,
    mediaFileData: {
      originalName: string;
      filename: string;
      path: string;
      size: number;
      mimeType: string;
      type: string;
    },
  ): Promise<MediaFile> {
    try {
      // Check if content exists
      const content = await this.getContentById(contentId);
      if (!content) {
        throw new NotFoundException(
          `Съдържанието с ID ${contentId} не е намерено`,
        );
      }

      // Create media file
      const mediaFile = this.mediaFileRepository.create({
        contentId,
        originalName: mediaFileData.originalName,
        filename: mediaFileData.filename,
        path: mediaFileData.path,
        size: mediaFileData.size,
        mimeType: mediaFileData.mimeType,
        type: mediaFileData.type as MediaType,
      });

      // Save media file
      const savedMediaFile = await this.mediaFileRepository.save(mediaFile);

      // Invalidate content cache
      await this.cacheManager.del(`content:${contentId}`);

      return savedMediaFile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to add media file to content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Възникна грешка при добавянето на медиен файл',
      );
    }
  }

  /**
   * Get a media file by ID
   * @param id The ID of the media file
   * @returns The media file
   */
  async getMediaFileById(id: number): Promise<MediaFile> {
    try {
      const mediaFile = await this.mediaFileRepository.findOne({
        where: { id },
      });
      if (!mediaFile) {
        throw new NotFoundException(`Медийният файл с ID ${id} не е намерен`);
      }
      return mediaFile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get media file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на медиен файл',
      );
    }
  }

  /**
   * Get all media files for content
   * @param contentId The ID of the content
   * @param page Page number (starting from 1)
   * @param limit Number of items per page
   * @returns The media files and pagination info
   */
  async getMediaFilesByContentId(
    contentId: number,
    page = 1,
    limit = 20,
  ): Promise<{
    mediaFiles: MediaFile[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Check if content exists
      await this.getContentById(contentId);

      const [mediaFiles, total] = await this.mediaFileRepository.findAndCount({
        where: { contentId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        mediaFiles,
        total,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get media files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Възникна грешка при извличането на медийни файлове',
      );
    }
  }

  /**
   * Delete a media file
   * @param id The ID of the media file to delete
   */
  async deleteMediaFile(id: number): Promise<void> {
    try {
      // Check if media file exists
      const mediaFile = await this.getMediaFileById(id);

      // Delete media file
      await this.mediaFileRepository.remove(mediaFile);

      // Invalidate content cache
      if (mediaFile.contentId) {
        await this.cacheManager.del(`content:${mediaFile.contentId}`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete media file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Възникна грешка при изтриването на медиен файл',
      );
    }
  }
}
