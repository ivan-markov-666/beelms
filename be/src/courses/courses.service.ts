import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import type { UserRole } from '../auth/user-role';
import { Course } from './course.entity';
import { CourseEnrollment } from './course-enrollment.entity';
import { CourseCurriculumItem } from './course-curriculum-item.entity';
import { UserCurriculumProgress } from './user-curriculum-progress.entity';
import { CoursePurchase } from './course-purchase.entity';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleVersion } from '../wiki/wiki-article-version.entity';
import { WikiArticleDetailDto } from '../wiki/dto/wiki-article-detail.dto';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { CourseModuleItemDto } from './dto/course-module-item.dto';
import { MyCourseListItemDto } from './dto/my-course-list-item.dto';
import { AdminCreateCourseDto } from './dto/admin-create-course.dto';
import { AdminUpdateCourseDto } from './dto/admin-update-course.dto';
import { AdminCreateCourseCurriculumItemDto } from './dto/admin-create-course-curriculum-item.dto';
import { AdminUpdateCourseCurriculumItemDto } from './dto/admin-update-course-curriculum-item.dto';
import { CourseCertificateDto } from './dto/course-certificate.dto';
import { AdminGrantCourseAccessDto } from './dto/admin-grant-course-access.dto';
import { Quiz } from '../assessments/quiz.entity';
import { Task } from '../tasks/task.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseEnrollment)
    private readonly enrollmentRepo: Repository<CourseEnrollment>,
    @InjectRepository(CoursePurchase)
    private readonly purchaseRepo: Repository<CoursePurchase>,
    @InjectRepository(CourseCurriculumItem)
    private readonly curriculumRepo: Repository<CourseCurriculumItem>,
    @InjectRepository(UserCurriculumProgress)
    private readonly progressRepo: Repository<UserCurriculumProgress>,
    @InjectRepository(WikiArticle)
    private readonly wikiArticleRepo: Repository<WikiArticle>,
    @InjectRepository(WikiArticleVersion)
    private readonly wikiVersionRepo: Repository<WikiArticleVersion>,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  private toSummary(course: Course): CourseSummaryDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      language: course.language,
      status: course.status,
      isPaid: !!course.isPaid,
      currency: course.currency ?? null,
      priceCents:
        typeof course.priceCents === 'number' ? course.priceCents : null,
    };
  }

  private async getActiveUserRole(userId: string): Promise<UserRole> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    return user.role;
  }

  private async requireCourseOwnershipForTeacher(
    userId: string,
    courseId: string,
  ): Promise<void> {
    const role = await this.getActiveUserRole(userId);

    if (role !== 'teacher') {
      return;
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.createdByUserId !== userId) {
      throw new NotFoundException('Course not found');
    }
  }

  private toCurriculumItemDto(item: CourseCurriculumItem): CourseModuleItemDto {
    return {
      id: item.id,
      itemType: item.itemType as 'wiki' | 'task' | 'quiz',
      title: item.title,
      order: item.order,
      wikiSlug: item.wikiSlug ?? null,
      taskId: item.taskId ?? null,
      quizId: item.quizId ?? null,
    };
  }

  private async loadCurriculum(
    courseId: string,
  ): Promise<CourseModuleItemDto[]> {
    const items = await this.curriculumRepo.find({
      where: { courseId },
      order: { order: 'ASC' },
    });

    return items.map((i) => this.toCurriculumItemDto(i));
  }

  async requireEnrollment(
    userId: string,
    courseId: string,
  ): Promise<{
    course: Course;
    enrollment: CourseEnrollment;
  }> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.enrollmentRepo.findOne({
      where: { courseId, userId },
    });

    if (!enrollment) {
      throw new ForbiddenException('Enrollment required');
    }

    if (course.isPaid) {
      const purchased = await this.purchaseRepo.findOne({
        where: { userId, courseId, revokedAt: IsNull() },
      });

      if (!purchased) {
        throw new ForbiddenException('Payment required');
      }
    }

    return { course, enrollment };
  }

  async requireQuizInCurriculum(
    courseId: string,
    quizId: string,
  ): Promise<void> {
    const curriculumItem = await this.curriculumRepo.findOne({
      where: { courseId, itemType: 'quiz', quizId },
    });

    if (!curriculumItem) {
      throw new NotFoundException('Quiz not found');
    }
  }

  private async validateCurriculumRefs(
    itemType: 'wiki' | 'task' | 'quiz',
    fields: {
      wikiSlug?: string;
      taskId?: string;
      quizId?: string;
    },
  ): Promise<void> {
    const wikiSlug = fields.wikiSlug?.trim();
    const taskId = fields.taskId;
    const quizId = fields.quizId;

    if (itemType === 'wiki' && !wikiSlug) {
      throw new BadRequestException('wikiSlug is required for wiki items');
    }

    if (itemType === 'task') {
      if (!taskId) {
        throw new BadRequestException('taskId is required for task items');
      }
      if (wikiSlug || quizId) {
        throw new BadRequestException(
          'wikiSlug/quizId are not allowed for task items',
        );
      }

      const task = await this.taskRepo.findOne({ where: { id: taskId } });
      if (!task || task.status !== 'active') {
        throw new BadRequestException('taskId must reference an active task');
      }
    }

    if (itemType === 'quiz') {
      if (!quizId) {
        throw new BadRequestException('quizId is required for quiz items');
      }
      if (wikiSlug || taskId) {
        throw new BadRequestException(
          'wikiSlug/taskId are not allowed for quiz items',
        );
      }
      const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
      if (!quiz || quiz.status !== 'active') {
        throw new BadRequestException('quizId must reference an active quiz');
      }
    }
  }

  private async validateWikiSlugExistsForCurriculum(
    wikiSlug: string,
    courseLanguage: string,
  ): Promise<void> {
    const trimmed = wikiSlug.trim();
    if (!trimmed) {
      throw new BadRequestException('wikiSlug is required for wiki items');
    }

    const trimmedLang = courseLanguage.trim();
    if (!trimmedLang) {
      throw new BadRequestException('course language is required');
    }

    const article = await this.wikiArticleRepo.findOne({
      where: [
        { slug: trimmed, status: 'active', visibility: 'public' },
        { slug: trimmed, status: 'active', visibility: 'course_only' },
      ],
    });

    if (!article) {
      throw new BadRequestException('Invalid wikiSlug');
    }

    const publishedCount = await this.wikiVersionRepo.count({
      where: {
        article: { id: article.id },
        language: trimmedLang,
        isPublished: true,
      },
    });

    if (publishedCount < 1) {
      throw new BadRequestException(
        'Wiki article has no published version for course language',
      );
    }
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

    const curriculum = await this.loadCurriculum(courseId);

    return {
      ...this.toSummary(course),
      curriculum,
    };
  }

  async getCourseWikiArticle(
    userId: string,
    courseId: string,
    slug: string,
    lang?: string,
  ): Promise<WikiArticleDetailDto> {
    const { course } = await this.requireEnrollment(userId, courseId);

    const trimmedSlug = slug.trim();
    if (!trimmedSlug) {
      throw new BadRequestException('slug is required');
    }

    const curriculumItem = await this.curriculumRepo.findOne({
      where: { courseId, itemType: 'wiki', wikiSlug: trimmedSlug },
    });

    if (!curriculumItem) {
      throw new NotFoundException('Article not found');
    }

    const effectiveLang = (lang?.trim() || course.language).trim();
    if (!effectiveLang) {
      throw new BadRequestException('course language is required');
    }

    const article = await this.wikiArticleRepo.findOne({
      where: [
        { slug: trimmedSlug, status: 'active', visibility: 'public' },
        { slug: trimmedSlug, status: 'active', visibility: 'course_only' },
      ],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const published = await this.wikiVersionRepo.find({
      where: {
        article: { id: article.id },
        language: effectiveLang,
        isPublished: true,
      },
      order: { createdAt: 'ASC' },
    });

    if (!published.length) {
      throw new NotFoundException('Article not found');
    }

    const latest = published[published.length - 1];
    const updatedAt =
      latest.createdAt ?? article.updatedAt ?? article.createdAt ?? new Date();

    return {
      id: article.id,
      slug: article.slug,
      visibility: article.visibility,
      tags: article.tags,
      language: latest.language,
      title: latest.title,
      subtitle: latest.subtitle ?? undefined,
      content: latest.content,
      status: article.status,
      articleStatus: article.status,
      languageStatus: 'active',
      updatedAt: updatedAt.toISOString(),
    };
  }

  async getCourseTask(
    userId: string,
    courseId: string,
    taskId: string,
  ): Promise<{
    id: string;
    title: string;
    description: string;
    language: string;
    status: string;
    updatedAt: string;
  }> {
    await this.requireEnrollment(userId, courseId);

    const curriculumItem = await this.curriculumRepo.findOne({
      where: { courseId, itemType: 'task', taskId },
    });

    if (!curriculumItem) {
      throw new NotFoundException('Task not found');
    }

    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task || task.status !== 'active') {
      throw new NotFoundException('Task not found');
    }

    const updatedAt = task.updatedAt ?? task.createdAt ?? new Date();

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      language: task.language,
      status: task.status,
      updatedAt: updatedAt.toISOString(),
    };
  }

  async getAdminCoursesList(actorUserId: string): Promise<CourseSummaryDto[]> {
    const role = await this.getActiveUserRole(actorUserId);

    const courses = await this.courseRepo.find({
      where: role === 'teacher' ? { createdByUserId: actorUserId } : undefined,
      order: { createdAt: 'DESC' },
    });

    return courses.map((c) => this.toSummary(c));
  }

  async getAdminCourseDetail(
    courseId: string,
    actorUserId: string,
  ): Promise<CourseDetailDto> {
    await this.requireCourseOwnershipForTeacher(actorUserId, courseId);

    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const curriculum = await this.loadCurriculum(courseId);

    return {
      ...this.toSummary(course),
      curriculum,
    };
  }

  async adminCreateCourse(
    dto: AdminCreateCourseDto,
    actorUserId: string,
  ): Promise<CourseDetailDto> {
    const role = await this.getActiveUserRole(actorUserId);
    if (role !== 'admin' && role !== 'teacher') {
      throw new ForbiddenException('Access denied');
    }

    const isPaid = dto.isPaid ?? false;
    const currency =
      typeof dto.currency === 'string'
        ? dto.currency.trim().toLowerCase()
        : null;
    const priceCents =
      typeof dto.priceCents === 'number' && Number.isInteger(dto.priceCents)
        ? dto.priceCents
        : null;

    if (isPaid) {
      if (!currency || !/^[a-z]{3}$/.test(currency)) {
        throw new BadRequestException('Paid courses require valid currency');
      }
      if (!priceCents || priceCents <= 0) {
        throw new BadRequestException('Paid courses require valid priceCents');
      }
    }

    const course = this.courseRepo.create({
      title: dto.title,
      description: dto.description,
      language: dto.language,
      status: dto.status,
      isPaid,
      currency: isPaid && currency ? currency : null,
      priceCents: isPaid && priceCents && priceCents > 0 ? priceCents : null,
      createdByUserId: actorUserId,
    });

    const saved = await this.courseRepo.save(course);

    const curriculum = await this.loadCurriculum(saved.id);

    return {
      ...this.toSummary(saved),
      curriculum,
    };
  }

  async adminUpdateCourse(
    courseId: string,
    dto: AdminUpdateCourseDto,
    actorUserId: string,
  ): Promise<CourseDetailDto> {
    await this.requireCourseOwnershipForTeacher(actorUserId, courseId);

    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (typeof dto.title === 'string') {
      course.title = dto.title;
    }

    if (typeof dto.description === 'string') {
      course.description = dto.description;
    }

    if (typeof dto.language === 'string') {
      course.language = dto.language;
    }

    if (typeof dto.status === 'string') {
      course.status = dto.status;
    }

    if (typeof dto.isPaid === 'boolean') {
      course.isPaid = dto.isPaid;
    }

    if (dto.currency !== undefined) {
      if (dto.currency === null) {
        course.currency = null;
      } else {
        const next = (dto.currency ?? '').trim().toLowerCase();
        course.currency = next ? next : null;
      }
    }

    if (dto.priceCents !== undefined) {
      if (dto.priceCents === null) {
        course.priceCents = null;
      } else {
        const next = Number(dto.priceCents);
        if (!Number.isInteger(next)) {
          throw new BadRequestException('priceCents must be an integer');
        }
        course.priceCents = next;
      }
    }

    if (!course.isPaid) {
      course.currency = null;
      course.priceCents = null;
    }

    if (course.isPaid) {
      const nextCurrency = (course.currency ?? '').trim().toLowerCase();
      if (!nextCurrency || !/^[a-z]{3}$/.test(nextCurrency)) {
        throw new BadRequestException('Paid courses require valid currency');
      }
      if (typeof course.priceCents !== 'number' || course.priceCents <= 0) {
        throw new BadRequestException('Paid courses require valid priceCents');
      }
      course.currency = nextCurrency;
    }

    const saved = await this.courseRepo.save(course);

    const curriculum = await this.loadCurriculum(saved.id);

    return {
      ...this.toSummary(saved),
      curriculum,
    };
  }

  async getAdminCourseCurriculum(
    courseId: string,
    actorUserId: string,
  ): Promise<CourseModuleItemDto[]> {
    await this.requireCourseOwnershipForTeacher(actorUserId, courseId);

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.loadCurriculum(courseId);
  }

  async adminAddCurriculumItem(
    courseId: string,
    dto: AdminCreateCourseCurriculumItemDto,
    actorUserId: string,
  ): Promise<CourseModuleItemDto> {
    await this.requireCourseOwnershipForTeacher(actorUserId, courseId);

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.validateCurriculumRefs(dto.itemType, {
      wikiSlug: dto.wikiSlug,
      taskId: dto.taskId,
      quizId: dto.quizId,
    });

    if (dto.itemType === 'wiki') {
      await this.validateWikiSlugExistsForCurriculum(
        dto.wikiSlug ?? '',
        course.language,
      );
    }

    const savedItem = await this.curriculumRepo.manager.transaction(
      async (manager) => {
        const existingCount = await manager.count(CourseCurriculumItem, {
          where: { courseId },
        });

        const maxOrder = existingCount + 1;
        const requestedOrder = dto.order;
        const insertOrder =
          typeof requestedOrder === 'number'
            ? Math.min(Math.max(requestedOrder, 1), maxOrder)
            : maxOrder;

        await manager.query(
          `UPDATE "course_curriculum_items" SET "order_index" = "order_index" + 1 WHERE "course_id" = $1 AND "order_index" >= $2`,
          [courseId, insertOrder],
        );

        const created = manager.create(CourseCurriculumItem, {
          courseId,
          itemType: dto.itemType,
          title: dto.title,
          order: insertOrder,
          wikiSlug: dto.wikiSlug?.trim() ?? null,
          taskId: dto.taskId ?? null,
          quizId: dto.quizId ?? null,
        });

        return manager.save(CourseCurriculumItem, created);
      },
    );

    return this.toCurriculumItemDto(savedItem);
  }

  async adminUpdateCurriculumItem(
    courseId: string,
    itemId: string,
    dto: AdminUpdateCourseCurriculumItemDto,
    actorUserId: string,
  ): Promise<CourseModuleItemDto> {
    await this.requireCourseOwnershipForTeacher(actorUserId, courseId);

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const savedItem = await this.curriculumRepo.manager.transaction(
      async (manager) => {
        const item = await manager.findOne(CourseCurriculumItem, {
          where: { id: itemId, courseId },
        });

        if (!item) {
          throw new NotFoundException('Curriculum item not found');
        }

        if (typeof dto.title === 'string') {
          item.title = dto.title;
        }

        const nextWikiSlug =
          typeof dto.wikiSlug === 'string' ? dto.wikiSlug : undefined;
        const nextTaskId =
          typeof dto.taskId === 'string' ? dto.taskId : undefined;
        const nextQuizId =
          typeof dto.quizId === 'string' ? dto.quizId : undefined;

        const refsChanged =
          nextWikiSlug !== undefined ||
          nextTaskId !== undefined ||
          nextQuizId !== undefined;

        if (refsChanged) {
          await this.validateCurriculumRefs(
            item.itemType as 'wiki' | 'task' | 'quiz',
            {
              wikiSlug: nextWikiSlug ?? item.wikiSlug ?? undefined,
              taskId: nextTaskId ?? item.taskId ?? undefined,
              quizId: nextQuizId ?? item.quizId ?? undefined,
            },
          );

          if (item.itemType === 'wiki') {
            const slugToValidate = (nextWikiSlug ?? item.wikiSlug ?? '').trim();
            await this.validateWikiSlugExistsForCurriculum(
              slugToValidate,
              course.language,
            );
          }
        }

        if (nextWikiSlug !== undefined) {
          item.wikiSlug = nextWikiSlug.trim() || null;
        }

        if (nextTaskId !== undefined) {
          item.taskId = nextTaskId;
        }

        if (nextQuizId !== undefined) {
          item.quizId = nextQuizId;
        }

        if (typeof dto.order === 'number') {
          const total = await manager.count(CourseCurriculumItem, {
            where: { courseId },
          });

          const newOrder = Math.min(Math.max(dto.order, 1), total);
          const oldOrder = item.order;

          if (newOrder !== oldOrder) {
            await manager.query(
              `UPDATE "course_curriculum_items" SET "order_index" = 0 WHERE "id" = $1 AND "course_id" = $2`,
              [item.id, courseId],
            );
            item.order = 0;

            if (newOrder < oldOrder) {
              await manager.query(
                `UPDATE "course_curriculum_items" SET "order_index" = "order_index" + 1 WHERE "course_id" = $1 AND "order_index" >= $2 AND "order_index" < $3`,
                [courseId, newOrder, oldOrder],
              );
            } else {
              await manager.query(
                `UPDATE "course_curriculum_items" SET "order_index" = "order_index" - 1 WHERE "course_id" = $1 AND "order_index" <= $2 AND "order_index" > $3`,
                [courseId, newOrder, oldOrder],
              );
            }

            item.order = newOrder;
          }
        }

        return manager.save(CourseCurriculumItem, item);
      },
    );

    return this.toCurriculumItemDto(savedItem);
  }

  async adminDeleteCurriculumItem(
    courseId: string,
    itemId: string,
    actorUserId: string,
  ): Promise<void> {
    await this.requireCourseOwnershipForTeacher(actorUserId, courseId);

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.curriculumRepo.manager.transaction(async (manager) => {
      const item = await manager.findOne(CourseCurriculumItem, {
        where: { id: itemId, courseId },
      });

      if (!item) {
        throw new NotFoundException('Curriculum item not found');
      }

      const deletedOrder = item.order;
      await manager.delete(CourseCurriculumItem, { id: itemId, courseId });

      await manager.query(
        `UPDATE "course_curriculum_items" SET "order_index" = "order_index" - 1 WHERE "course_id" = $1 AND "order_index" > $2`,
        [courseId, deletedOrder],
      );
    });
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    if (course.isPaid) {
      const purchased = await this.purchaseRepo.findOne({
        where: { userId, courseId, revokedAt: IsNull() },
      });

      if (!purchased) {
        throw new ForbiddenException('Payment required');
      }
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

  async adminGrantCourseAccess(
    courseId: string,
    dto: AdminGrantCourseAccessDto,
    adminUserId: string,
  ): Promise<void> {
    const userId = dto.userId;

    const user = await this.usersRepo.findOne({
      where: { id: userId, active: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    if (course.isPaid) {
      const existingPurchase = await this.purchaseRepo.findOne({
        where: { userId, courseId },
      });

      if (!existingPurchase) {
        const purchase = this.purchaseRepo.create({
          userId,
          courseId,
          source: 'admin',
          grantedByUserId: adminUserId,
          grantReason: dto.grantReason ?? null,
          stripeSessionId: null,
          stripePaymentIntentId: null,
          amountCents:
            typeof course.priceCents === 'number' ? course.priceCents : null,
          currency: course.currency ?? null,
        });

        await this.purchaseRepo.save(purchase);
      } else if (existingPurchase.revokedAt) {
        existingPurchase.revokedAt = null;
        existingPurchase.revokedReason = null;
        existingPurchase.revokedEventId = null;
        await this.purchaseRepo.save(existingPurchase);
      }
    }

    if (dto.enroll !== false) {
      await this.enrollInCourse(userId, courseId);
    }
  }

  async getCourseCertificate(
    userId: string,
    userEmail: string,
    courseId: string,
  ): Promise<CourseCertificateDto> {
    const { course, enrollment } = await this.requireEnrollment(
      userId,
      courseId,
    );

    if ((enrollment.status ?? '').toLowerCase() !== 'completed') {
      throw new ForbiddenException('Course not completed');
    }

    const completedAt = (
      enrollment.updatedAt ?? enrollment.enrolledAt
    ).toISOString();
    const issuedAt = new Date().toISOString();

    return {
      courseId: course.id,
      courseTitle: course.title,
      userId,
      userEmail,
      completedAt,
      issuedAt,
    };
  }

  async getMyCourses(userId: string): Promise<MyCourseListItemDto[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId },
      relations: ['course'],
      order: { enrolledAt: 'DESC' },
    });

    const results: MyCourseListItemDto[] = [];

    for (const e of enrollments) {
      if (!e.course || e.course.status !== 'active') {
        continue;
      }

      const progressPercent = await this.calculateProgressPercent(
        userId,
        e.courseId,
      );

      results.push({
        ...this.toSummary(e.course),
        enrollmentStatus: (e.status ?? 'not_started') as
          | 'not_started'
          | 'in_progress'
          | 'completed',
        progressPercent,
        enrolledAt: e.enrolledAt ? e.enrolledAt.toISOString() : null,
      });
    }

    return results;
  }

  private async calculateProgressPercent(
    userId: string,
    courseId: string,
  ): Promise<number> {
    const totalItems = await this.curriculumRepo.count({
      where: { courseId },
    });

    if (totalItems === 0) {
      return 0;
    }

    const completedItems = await this.progressRepo.count({
      where: { userId, courseId },
    });

    return Math.round((completedItems / totalItems) * 100);
  }

  private async updateEnrollmentStatus(
    userId: string,
    courseId: string,
  ): Promise<void> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { userId, courseId },
    });

    if (!enrollment) {
      return;
    }

    const totalItems = await this.curriculumRepo.count({
      where: { courseId },
    });

    const completedItems = await this.progressRepo.count({
      where: { userId, courseId },
    });

    let newStatus: string;

    if (completedItems === 0) {
      newStatus = 'not_started';
    } else if (completedItems >= totalItems && totalItems > 0) {
      newStatus = 'completed';
    } else {
      newStatus = 'in_progress';
    }

    if (enrollment.status !== newStatus) {
      enrollment.status = newStatus;
      await this.enrollmentRepo.save(enrollment);
    }
  }

  async markCurriculumItemCompleted(
    userId: string,
    courseId: string,
    itemId: string,
  ): Promise<void> {
    await this.requireEnrollment(userId, courseId);

    const curriculumItem = await this.curriculumRepo.findOne({
      where: { id: itemId, courseId },
    });

    if (!curriculumItem) {
      throw new NotFoundException('Curriculum item not found');
    }

    const existing = await this.progressRepo.findOne({
      where: { userId, curriculumItemId: itemId },
    });

    if (existing) {
      return;
    }

    const progress = this.progressRepo.create({
      userId,
      courseId,
      curriculumItemId: itemId,
      completedAt: new Date(),
    });

    await this.progressRepo.save(progress);

    await this.updateEnrollmentStatus(userId, courseId);
  }

  async getCurriculumProgress(
    userId: string,
    courseId: string,
  ): Promise<{
    totalItems: number;
    completedItems: number;
    progressPercent: number;
    items: Array<{
      id: string;
      title: string;
      itemType: string;
      wikiSlug: string | null;
      taskId: string | null;
      quizId: string | null;
      completed: boolean;
      completedAt: string | null;
    }>;
  }> {
    await this.requireEnrollment(userId, courseId);

    const curriculumItems = await this.curriculumRepo.find({
      where: { courseId },
      order: { order: 'ASC' },
    });

    const progressRecords = await this.progressRepo.find({
      where: { userId, courseId },
    });

    const progressMap = new Map<string, Date | null>();
    for (const p of progressRecords) {
      progressMap.set(p.curriculumItemId, p.completedAt);
    }

    const totalItems = curriculumItems.length;
    const completedItems = progressRecords.length;
    const progressPercent =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const items = curriculumItems.map((item) => {
      const completedAt = progressMap.get(item.id) ?? null;
      return {
        id: item.id,
        title: item.title,
        itemType: item.itemType,
        wikiSlug: item.wikiSlug ?? null,
        taskId: item.taskId ?? null,
        quizId: item.quizId ?? null,
        completed: completedAt !== null,
        completedAt: completedAt ? completedAt.toISOString() : null,
      };
    });

    return {
      totalItems,
      completedItems,
      progressPercent,
      items,
    };
  }
}
