import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, IsNull, Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import type { UserRole } from '../auth/user-role';
import { Course } from './course.entity';
import { CourseCategory } from './course-category.entity';
import { CourseEnrollment } from './course-enrollment.entity';
import { CourseCurriculumItem } from './course-curriculum-item.entity';
import { UserCurriculumProgress } from './user-curriculum-progress.entity';
import { CoursePurchase } from './course-purchase.entity';
import { WikiArticle } from '../wiki/wiki-article.entity';
import { WikiArticleVersion } from '../wiki/wiki-article-version.entity';
import { WikiArticleDetailDto } from '../wiki/dto/wiki-article-detail.dto';
import { CourseSummaryDto } from './dto/course-summary.dto';
import { AdminCourseSummaryDto } from './dto/admin-course-summary.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { AdminCourseDetailDto } from './dto/admin-course-detail.dto';
import { CourseModuleItemDto } from './dto/course-module-item.dto';
import { MyCourseListItemDto } from './dto/my-course-list-item.dto';
import { CourseCategoryDto } from './dto/course-category.dto';
import { AdminCreateCourseDto } from './dto/admin-create-course.dto';
import { AdminUpdateCourseDto } from './dto/admin-update-course.dto';
import { AdminCreateCourseCurriculumItemDto } from './dto/admin-create-course-curriculum-item.dto';
import { AdminUpdateCourseCurriculumItemDto } from './dto/admin-update-course-curriculum-item.dto';
import { CourseCertificateDto } from './dto/course-certificate.dto';
import { AdminGrantCourseAccessDto } from './dto/admin-grant-course-access.dto';
import {
  AdminCreateCourseCategoryDto,
  AdminUpdateCourseCategoryDto,
} from './dto/admin-course-category.dto';
import { Quiz } from '../assessments/quiz.entity';
import { Task } from '../tasks/task.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseCategory)
    private readonly courseCategoryRepo: Repository<CourseCategory>,
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
    private readonly settingsService: SettingsService,
  ) {}

  async getAdminCoursesCount(actorUserId: string): Promise<number> {
    const role = await this.getActiveUserRole(actorUserId);
    if (role === 'teacher') {
      return this.courseRepo.count({ where: { createdByUserId: actorUserId } });
    }
    return this.courseRepo.count();
  }

  async adminBulkUpdateCourseStatus(
    actorUserId: string,
    ids: string[],
    status: string,
  ): Promise<number> {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()))).filter(
      (id) => id.length > 0,
    );
    if (uniqueIds.length === 0) {
      return 0;
    }

    const role = await this.getActiveUserRole(actorUserId);
    if (role === 'teacher') {
      const allowed = await this.courseRepo.find({
        where: { id: In(uniqueIds), createdByUserId: actorUserId },
        select: { id: true },
      });
      const allowedIds = allowed.map((c) => c.id);
      if (allowedIds.length !== uniqueIds.length) {
        throw new NotFoundException('Course not found');
      }

      const result = await this.courseRepo.update(
        { id: In(allowedIds), createdByUserId: actorUserId },
        { status },
      );
      return result.affected ?? 0;
    }

    const result = await this.courseRepo.update(
      { id: In(uniqueIds) },
      { status },
    );
    return result.affected ?? 0;
  }

  async adminBulkDeleteCourses(
    actorUserId: string,
    ids: string[],
  ): Promise<number> {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()))).filter(
      (id) => id.length > 0,
    );
    if (uniqueIds.length === 0) {
      return 0;
    }

    const role = await this.getActiveUserRole(actorUserId);
    if (role === 'teacher') {
      const allowed = await this.courseRepo.find({
        where: { id: In(uniqueIds), createdByUserId: actorUserId },
        select: { id: true },
      });
      const allowedIds = allowed.map((c) => c.id);
      if (allowedIds.length !== uniqueIds.length) {
        throw new NotFoundException('Course not found');
      }

      const result = await this.courseRepo.delete({
        id: In(allowedIds),
        createdByUserId: actorUserId,
      });
      return result.affected ?? 0;
    }

    const result = await this.courseRepo.delete({ id: In(uniqueIds) });
    return result.affected ?? 0;
  }

  async adminPurgeAllCourses(actorUserId: string): Promise<number> {
    const role = await this.getActiveUserRole(actorUserId);
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const result = await this.courseRepo
      .createQueryBuilder()
      .delete()
      .from(Course)
      .execute();
    return result.affected ?? 0;
  }

  async isPaidCoursePaymentAvailable(): Promise<boolean> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const features = cfg.features;

    const stripeEnabled = features?.paymentsStripe !== false;
    const paypalEnabled = features?.paymentsPaypal !== false;
    const myposEnabled = features?.paymentsMypos === true;
    const revolutEnabled = features?.paymentsRevolut === true;

    const stripeConfigured =
      (process.env.STRIPE_SECRET_KEY ?? '').trim().length > 0;
    const paypalConfigured =
      (process.env.PAYPAL_CLIENT_ID ?? '').trim().length > 0 &&
      (process.env.PAYPAL_CLIENT_SECRET ?? '').trim().length > 0;
    const myposConfigured =
      (process.env.MYPOS_SID ?? '').trim().length > 0 &&
      (process.env.MYPOS_WALLET_NUMBER ?? '').trim().length > 0 &&
      (process.env.MYPOS_KEY_INDEX ?? '').trim().length > 0 &&
      (process.env.MYPOS_PRIVATE_KEY ?? '').trim().length > 0 &&
      (process.env.MYPOS_API_PUBLIC_CERT ?? '').trim().length > 0;
    const revolutConfigured =
      (process.env.REVOLUT_API_KEY ?? '').trim().length > 0 &&
      ((process.env.REVOLUT_WEBHOOK_SIGNING_SECRET ?? '').trim().length > 0 ||
        (process.env.REVOLUT_WEBHOOK_SECRET ?? '').trim().length > 0);

    return (
      (stripeEnabled && stripeConfigured) ||
      (paypalEnabled && paypalConfigured) ||
      (myposEnabled && myposConfigured) ||
      (revolutEnabled && revolutConfigured)
    );
  }

  private toCategoryDto(category: CourseCategory): CourseCategoryDto {
    return {
      id: category.id,
      slug: category.slug,
      title: category.title,
      order: category.order,
      active: !!category.active,
    };
  }

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
      categoryId: course.categoryId ?? null,
      category:
        course.category && course.category.slug && course.category.title
          ? {
              slug: course.category.slug,
              title: course.category.title,
            }
          : null,
    };
  }

  private toAdminSummary(course: Course): AdminCourseSummaryDto {
    const createdAt = course.createdAt ?? new Date();
    const updatedAt = course.updatedAt ?? createdAt;

    return {
      ...this.toSummary(course),
      createdByUserId: course.createdByUserId ?? null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }

  private async buildAdminCoursesQuery(
    actorUserId: string,
    filters: {
      q?: string;
      status?: string;
      language?: string;
      paid?: 'paid' | 'free';
      categoryId?: string;
    },
  ) {
    const role = await this.getActiveUserRole(actorUserId);

    const qb = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category');

    if (role === 'teacher') {
      qb.where('course.createdByUserId = :userId', { userId: actorUserId });
    }

    const q = (filters.q ?? '').trim().toLowerCase();
    if (q) {
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('LOWER(course.id) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(course.title) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(course.description) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(course.language) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(course.status) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(category.title) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(category.slug) LIKE :q', { q: `%${q}%` });
        }),
      );
    }

    const status = (filters.status ?? '').trim().toLowerCase();
    if (status) {
      qb.andWhere('LOWER(course.status) = :status', { status });
    }

    const language = (filters.language ?? '').trim().toLowerCase();
    if (language) {
      qb.andWhere('LOWER(course.language) = :language', { language });
    }

    if (filters.paid === 'paid') {
      qb.andWhere('course.isPaid = :isPaid', { isPaid: true });
    }
    if (filters.paid === 'free') {
      qb.andWhere('course.isPaid = :isPaid', { isPaid: false });
    }

    const categoryId = (filters.categoryId ?? '').trim();
    if (categoryId) {
      qb.andWhere('course.categoryId = :categoryId', { categoryId });
    }

    return qb;
  }

  async getAdminCoursesListPaged(
    actorUserId: string,
    options: {
      page: number;
      pageSize: number;
      q?: string;
      status?: string;
      language?: string;
      paid?: 'paid' | 'free';
      categoryId?: string;
      sortKey?:
        | 'createdAt'
        | 'updatedAt'
        | 'title'
        | 'category'
        | 'language'
        | 'status'
        | 'paid'
        | 'price';
      sortDir?: 'asc' | 'desc';
    },
  ): Promise<{ items: AdminCourseSummaryDto[]; total: number }> {
    const page =
      Number.isFinite(options.page) && options.page > 0 ? options.page : 1;
    const pageSize =
      Number.isFinite(options.pageSize) && options.pageSize > 0
        ? Math.min(options.pageSize, 100)
        : 20;

    const qb = await this.buildAdminCoursesQuery(actorUserId, {
      q: options.q,
      status: options.status,
      language: options.language,
      paid: options.paid,
      categoryId: options.categoryId,
    });

    const sortKey = (options.sortKey ?? 'createdAt').trim();
    const sortDir = options.sortDir === 'asc' ? 'ASC' : 'DESC';

    switch (sortKey) {
      case 'title':
        qb.orderBy('course.title', sortDir);
        break;
      case 'category':
        qb.orderBy('category.title', sortDir);
        break;
      case 'language':
        qb.orderBy('course.language', sortDir);
        break;
      case 'status':
        qb.orderBy('course.status', sortDir);
        break;
      case 'paid':
        qb.orderBy('course.isPaid', sortDir);
        break;
      case 'price':
        qb.orderBy('course.priceCents', sortDir);
        break;
      case 'updatedAt':
        qb.orderBy('course.updatedAt', sortDir);
        break;
      case 'createdAt':
      default:
        qb.orderBy('course.createdAt', sortDir);
        break;
    }

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [courses, total] = await qb.getManyAndCount();
    return { items: courses.map((c) => this.toAdminSummary(c)), total };
  }

  async exportAdminCoursesCsv(
    actorUserId: string,
    options: {
      q?: string;
      status?: string;
      language?: string;
      paid?: 'paid' | 'free';
      categoryId?: string;
      sortKey?:
        | 'createdAt'
        | 'updatedAt'
        | 'title'
        | 'category'
        | 'language'
        | 'status'
        | 'paid'
        | 'price';
      sortDir?: 'asc' | 'desc';
    },
  ): Promise<{ csv: string; filename: string }> {
    const qb = await this.buildAdminCoursesQuery(actorUserId, {
      q: options.q,
      status: options.status,
      language: options.language,
      paid: options.paid,
      categoryId: options.categoryId,
    });

    const sortKey = (options.sortKey ?? 'createdAt').trim();
    const sortDir = options.sortDir === 'asc' ? 'ASC' : 'DESC';

    switch (sortKey) {
      case 'title':
        qb.orderBy('course.title', sortDir);
        break;
      case 'category':
        qb.orderBy('category.title', sortDir);
        break;
      case 'language':
        qb.orderBy('course.language', sortDir);
        break;
      case 'status':
        qb.orderBy('course.status', sortDir);
        break;
      case 'paid':
        qb.orderBy('course.isPaid', sortDir);
        break;
      case 'price':
        qb.orderBy('course.priceCents', sortDir);
        break;
      case 'updatedAt':
        qb.orderBy('course.updatedAt', sortDir);
        break;
      case 'createdAt':
      default:
        qb.orderBy('course.createdAt', sortDir);
        break;
    }

    const courses = await qb.getMany();
    const summaries = courses.map((c) => this.toAdminSummary(c));

    const escapeCsv = (
      value: string | number | boolean | null | undefined,
    ): string => {
      const raw =
        value === null || typeof value === 'undefined' ? '' : `${value}`;
      const needsQuotes = /[\n\r",]/.test(raw);
      const escaped = raw.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const rows: string[] = [];
    rows.push(
      [
        'id',
        'title',
        'description',
        'language',
        'status',
        'isPaid',
        'currency',
        'priceCents',
        'createdByUserId',
        'createdAt',
        'updatedAt',
        'categoryId',
        'categoryTitle',
        'categorySlug',
      ]
        .map(escapeCsv)
        .join(','),
    );

    for (const c of summaries) {
      rows.push(
        [
          c.id,
          c.title,
          c.description,
          c.language,
          c.status,
          c.isPaid ? 'true' : 'false',
          c.currency ?? '',
          typeof c.priceCents === 'number' ? c.priceCents : '',
          c.createdByUserId ?? '',
          c.createdAt,
          c.updatedAt,
          c.categoryId ?? '',
          c.category?.title ?? '',
          c.category?.slug ?? '',
        ]
          .map(escapeCsv)
          .join(','),
      );
    }

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return {
      csv: `\uFEFF${rows.join('\n')}`,
      filename: `courses-${ts}.csv`,
    };
  }

  async getPublicCourseCategories(): Promise<CourseCategoryDto[]> {
    const categories = await this.courseCategoryRepo.find({
      where: { active: true },
      order: { order: 'ASC', title: 'ASC' },
    });

    return categories.map((c) => this.toCategoryDto(c));
  }

  async getAdminCourseCategories(): Promise<CourseCategoryDto[]> {
    const categories = await this.courseCategoryRepo.find({
      order: { order: 'ASC', title: 'ASC' },
    });

    return categories.map((c) => this.toCategoryDto(c));
  }

  async adminCreateCourseCategory(
    dto: AdminCreateCourseCategoryDto,
  ): Promise<CourseCategoryDto> {
    const slug = dto.slug.trim().toLowerCase();
    const title = dto.title.trim();

    const existing = await this.courseCategoryRepo.findOne({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Category slug already exists');
    }

    const created = this.courseCategoryRepo.create({
      slug,
      title,
      order: typeof dto.order === 'number' ? dto.order : 0,
      active: typeof dto.active === 'boolean' ? dto.active : true,
    });

    const saved = await this.courseCategoryRepo.save(created);
    return this.toCategoryDto(saved);
  }

  async adminUpdateCourseCategory(
    id: string,
    dto: AdminUpdateCourseCategoryDto,
  ): Promise<CourseCategoryDto> {
    const category = await this.courseCategoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (typeof dto.slug === 'string') {
      const nextSlug = dto.slug.trim().toLowerCase();
      if (nextSlug && nextSlug !== category.slug) {
        const existing = await this.courseCategoryRepo.findOne({
          where: { slug: nextSlug },
        });
        if (existing && existing.id !== category.id) {
          throw new BadRequestException('Category slug already exists');
        }
        category.slug = nextSlug;
      }
    }

    if (typeof dto.title === 'string') {
      const nextTitle = dto.title.trim();
      if (nextTitle) {
        category.title = nextTitle;
      }
    }

    if (typeof dto.order === 'number' && Number.isInteger(dto.order)) {
      category.order = dto.order;
    }

    if (typeof dto.active === 'boolean') {
      category.active = dto.active;
    }

    const saved = await this.courseCategoryRepo.save(category);
    return this.toCategoryDto(saved);
  }

  async adminDeleteCourseCategory(id: string): Promise<void> {
    const category = await this.courseCategoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.courseRepo.manager.transaction(async (manager) => {
      await manager.update(Course, { categoryId: id }, { categoryId: null });
      await manager.delete(CourseCategory, { id });
    });
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

  async getQuizCurriculumItemId(
    courseId: string,
    quizId: string,
  ): Promise<string | null> {
    const curriculumItem = await this.curriculumRepo.findOne({
      where: { courseId, itemType: 'quiz', quizId },
      select: ['id'],
    });

    return curriculumItem?.id ?? null;
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

  async getPublicCatalog(categorySlug?: string): Promise<CourseSummaryDto[]> {
    const normalizedSlug = categorySlug?.trim().toLowerCase();

    const qb = this.courseRepo
      .createQueryBuilder('course')
      .where('course.status = :status', { status: 'active' })
      .orderBy('course.createdAt', 'DESC');

    if (normalizedSlug) {
      qb.innerJoinAndSelect(
        'course.category',
        'category',
        'category.slug = :slug AND category.active = true',
        { slug: normalizedSlug },
      );
    } else {
      qb.leftJoinAndSelect('course.category', 'category');
    }

    const courses = await qb.getMany();
    return courses.map((c) => this.toSummary(c));
  }

  async getPublicCatalogPaged(options: {
    page: number;
    pageSize: number;
    q?: string;
    language?: string;
    paid?: 'paid' | 'free';
    categorySlug?: string;
    sortKey?: 'createdAt' | 'title';
    sortDir?: 'asc' | 'desc';
  }): Promise<{ items: CourseSummaryDto[]; total: number }> {
    const page =
      Number.isFinite(options.page) && options.page > 0 ? options.page : 1;
    const pageSize =
      Number.isFinite(options.pageSize) && options.pageSize > 0
        ? Math.min(options.pageSize, 100)
        : 20;

    const qb = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .where('course.status = :status', { status: 'active' });

    const categorySlug = (options.categorySlug ?? '').trim().toLowerCase();
    if (categorySlug) {
      qb.andWhere('LOWER(category.slug) = :slug', { slug: categorySlug });
      qb.andWhere('category.active = true');
    }

    const q = (options.q ?? '').trim().toLowerCase();
    if (q) {
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('LOWER(course.id) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(course.title) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(course.description) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(category.title) LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(category.slug) LIKE :q', { q: `%${q}%` });
        }),
      );
    }

    const language = (options.language ?? '').trim().toLowerCase();
    if (language) {
      qb.andWhere('LOWER(course.language) = :language', { language });
    }

    if (options.paid === 'paid') {
      qb.andWhere('course.isPaid = :isPaid', { isPaid: true });
    }
    if (options.paid === 'free') {
      qb.andWhere('course.isPaid = :isPaid', { isPaid: false });
    }

    const sortKey = (options.sortKey ?? 'createdAt').trim();
    const sortDir = options.sortDir === 'asc' ? 'ASC' : 'DESC';
    if (sortKey === 'title') {
      qb.orderBy('course.title', sortDir);
    } else {
      qb.orderBy('course.createdAt', sortDir);
    }

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [courses, total] = await qb.getManyAndCount();
    return { items: courses.map((c) => this.toSummary(c)), total };
  }

  async getPublicCourseDetail(courseId: string): Promise<CourseDetailDto> {
    const course = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .where('course.id = :id', { id: courseId })
      .getOne();

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

  async getAdminCoursesList(
    actorUserId: string,
  ): Promise<AdminCourseSummaryDto[]> {
    const { items } = await this.getAdminCoursesListPaged(actorUserId, {
      page: 1,
      pageSize: 100,
      sortKey: 'createdAt',
      sortDir: 'desc',
    });
    return items;
  }

  async getAdminCourseDetail(
    courseId: string,
    actorUserId: string,
  ): Promise<AdminCourseDetailDto> {
    await this.requireCourseOwnershipForTeacher(actorUserId, courseId);

    const course = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .where('course.id = :id', { id: courseId })
      .getOne();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const curriculum = await this.loadCurriculum(courseId);

    return {
      ...this.toAdminSummary(course),
      curriculum,
    };
  }

  async adminCreateCourse(
    dto: AdminCreateCourseDto,
    actorUserId: string,
  ): Promise<AdminCourseDetailDto> {
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

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        course.categoryId = null;
      } else if (typeof dto.categoryId === 'string') {
        const categoryId = dto.categoryId;
        const category = await this.courseCategoryRepo.findOne({
          where: { id: categoryId },
        });
        if (!category) {
          throw new BadRequestException('Category not found');
        }
        course.categoryId = category.id;
      }
    }

    const saved = await this.courseRepo.save(course);

    const savedWithCategory = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .where('course.id = :id', { id: saved.id })
      .getOne();

    const effectiveCourse = savedWithCategory ?? saved;

    const curriculum = await this.loadCurriculum(saved.id);

    return {
      ...this.toAdminSummary(effectiveCourse),
      curriculum,
    };
  }

  async adminUpdateCourse(
    courseId: string,
    dto: AdminUpdateCourseDto,
    actorUserId: string,
  ): Promise<AdminCourseDetailDto> {
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

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        course.categoryId = null;
      } else if (typeof dto.categoryId === 'string') {
        const categoryId = dto.categoryId;
        const category = await this.courseCategoryRepo.findOne({
          where: { id: categoryId },
        });
        if (!category) {
          throw new BadRequestException('Category not found');
        }
        course.categoryId = category.id;
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

    const savedWithCategory = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .where('course.id = :id', { id: saved.id })
      .getOne();

    const effectiveCourse = savedWithCategory ?? saved;

    const curriculum = await this.loadCurriculum(saved.id);

    return {
      ...this.toAdminSummary(effectiveCourse),
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

  async unenrollFromCourse(userId: string, courseId: string): Promise<void> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { courseId, userId },
      relations: ['course'],
    });

    if (!enrollment) {
      return;
    }

    const course = enrollment.course;
    if (course?.isPaid) {
      throw new ForbiddenException('Paid course cannot be removed');
    }

    await this.enrollmentRepo.manager.transaction(async (manager) => {
      await manager.delete(UserCurriculumProgress, {
        userId,
        courseId,
      });

      await manager.delete(CourseEnrollment, {
        userId,
        courseId,
      });
    });
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
      relations: ['course', 'course.category'],
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
