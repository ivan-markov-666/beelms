import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { Course } from '../src/courses/course.entity';
import { CourseCurriculumItem } from '../src/courses/course-curriculum-item.entity';
import { CourseEnrollment } from '../src/courses/course-enrollment.entity';
import { WikiArticle } from '../src/wiki/wiki-article.entity';
import { WikiArticleVersion } from '../src/wiki/wiki-article-version.entity';
import { registerAndLogin } from './utils/auth-helpers';

type CurriculumProgressResponse = {
  totalItems: number;
  completedItems: number;
  progressPercent: number;
  items: Array<{
    id: string;
    title: string;
    itemType: string;
    wikiSlug: string | null;
    completed: boolean;
    completedAt: string | null;
  }>;
};

describe('Curriculum Progress endpoints (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let enrollmentRepo: Repository<CourseEnrollment>;
  let curriculumRepo: Repository<CourseCurriculumItem>;
  let wikiArticleRepo: Repository<WikiArticle>;
  let wikiVersionRepo: Repository<WikiArticleVersion>;

  async function createCourseWithCurriculum(): Promise<{
    course: Course;
    items: CourseCurriculumItem[];
  }> {
    const course = courseRepo.create({
      title: `E2E Progress Course ${Date.now()}`,
      description: 'Course for progress tracking tests',
      language: 'en',
      status: 'active',
      isPaid: false,
    });
    const savedCourse = await courseRepo.save(course);

    const slug1 = `progress-test-article-1-${Date.now()}`;
    const slug2 = `progress-test-article-2-${Date.now()}`;

    const article1 = wikiArticleRepo.create({
      slug: slug1,
      status: 'active',
      visibility: 'course_only',
      tags: [],
    });
    const savedArticle1 = await wikiArticleRepo.save(article1);

    const article2 = wikiArticleRepo.create({
      slug: slug2,
      status: 'active',
      visibility: 'course_only',
      tags: [],
    });
    const savedArticle2 = await wikiArticleRepo.save(article2);

    await wikiVersionRepo.save(
      wikiVersionRepo.create({
        article: savedArticle1,
        language: 'en',
        title: 'Progress Test Article 1',
        content: 'Test content 1',
        versionNumber: 1,
        isPublished: true,
      }),
    );

    await wikiVersionRepo.save(
      wikiVersionRepo.create({
        article: savedArticle2,
        language: 'en',
        title: 'Progress Test Article 2',
        content: 'Test content 2',
        versionNumber: 1,
        isPublished: true,
      }),
    );

    const item1 = curriculumRepo.create({
      courseId: savedCourse.id,
      itemType: 'wiki',
      title: 'Lesson 1',
      order: 1,
      wikiSlug: slug1,
    });

    const item2 = curriculumRepo.create({
      courseId: savedCourse.id,
      itemType: 'wiki',
      title: 'Lesson 2',
      order: 2,
      wikiSlug: slug2,
    });

    const savedItems = await curriculumRepo.save([item1, item2]);

    return { course: savedCourse, items: savedItems };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    courseRepo = app.get<Repository<Course>>(getRepositoryToken(Course));
    enrollmentRepo = app.get<Repository<CourseEnrollment>>(
      getRepositoryToken(CourseEnrollment),
    );
    curriculumRepo = app.get<Repository<CourseCurriculumItem>>(
      getRepositoryToken(CourseCurriculumItem),
    );
    wikiArticleRepo = app.get<Repository<WikiArticle>>(
      getRepositoryToken(WikiArticle),
    );
    wikiVersionRepo = app.get<Repository<WikiArticleVersion>>(
      getRepositoryToken(WikiArticleVersion),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/courses/:courseId/curriculum/progress returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get(
        '/api/courses/00000000-0000-0000-0000-000000000000/curriculum/progress',
      )
      .expect(401);
  });

  it('POST /api/courses/:courseId/curriculum/:itemId/complete returns 401 without token', async () => {
    await request(app.getHttpServer())
      .post(
        '/api/courses/00000000-0000-0000-0000-000000000000/curriculum/00000000-0000-0000-0000-000000000001/complete',
      )
      .expect(401);
  });

  it('GET /api/courses/:courseId/curriculum/progress returns 403 without enrollment', async () => {
    const { accessToken } = await registerAndLogin(app, 'progress-no-enroll');
    const { course } = await createCourseWithCurriculum();

    await request(app.getHttpServer())
      .get(`/api/courses/${course.id}/curriculum/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('GET /api/courses/:courseId/curriculum/progress returns progress for enrolled user', async () => {
    const { accessToken } = await registerAndLogin(app, 'progress-enrolled');
    const { course, items } = await createCourseWithCurriculum();

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const res = await request(app.getHttpServer())
      .get(`/api/courses/${course.id}/curriculum/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as CurriculumProgressResponse;
    expect(body.totalItems).toBe(2);
    expect(body.completedItems).toBe(0);
    expect(body.progressPercent).toBe(0);
    expect(body.items.length).toBe(2);
    expect(body.items.every((i) => i.completed === false)).toBe(true);

    const itemIds = body.items.map((i) => i.id);
    expect(itemIds).toContain(items[0].id);
    expect(itemIds).toContain(items[1].id);
  });

  it('POST complete marks item as completed and updates progress', async () => {
    const { accessToken } = await registerAndLogin(app, 'progress-complete');
    const { course, items } = await createCourseWithCurriculum();

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/curriculum/${items[0].id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const res = await request(app.getHttpServer())
      .get(`/api/courses/${course.id}/curriculum/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as CurriculumProgressResponse;
    expect(body.completedItems).toBe(1);
    expect(body.progressPercent).toBe(50);

    const completedItem = body.items.find((i) => i.id === items[0].id);
    expect(completedItem?.completed).toBe(true);
    expect(completedItem?.completedAt).not.toBeNull();
  });

  it('Completing all items sets enrollment status to completed', async () => {
    const { accessToken } = await registerAndLogin(app, 'progress-all-done');
    const { course, items } = await createCourseWithCurriculum();

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/curriculum/${items[0].id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/curriculum/${items[1].id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const progressRes = await request(app.getHttpServer())
      .get(`/api/courses/${course.id}/curriculum/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const progress = progressRes.body as CurriculumProgressResponse;
    expect(progress.completedItems).toBe(2);
    expect(progress.progressPercent).toBe(100);

    const myCoursesRes = await request(app.getHttpServer())
      .get('/api/users/me/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const myCourses = myCoursesRes.body as Array<{
      id: string;
      enrollmentStatus: string;
      progressPercent: number;
    }>;

    const enrolledCourse = myCourses.find((c) => c.id === course.id);
    expect(enrolledCourse?.enrollmentStatus).toBe('completed');
    expect(enrolledCourse?.progressPercent).toBe(100);
  });

  it('Paid courses: progress is forbidden when enrolled but not purchased (hardening)', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'progress-paid-not-purchased',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    const { course } = await createCourseWithCurriculum();
    course.isPaid = true;
    course.currency = 'eur';
    course.priceCents = 999;
    await courseRepo.save(course);

    await enrollmentRepo.save(
      enrollmentRepo.create({
        userId: user.id,
        courseId: course.id,
        status: 'not_started',
      }),
    );

    const res = await request(app.getHttpServer())
      .get(`/api/courses/${course.id}/curriculum/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    const body = res.body as { message?: string };
    expect(body.message).toBe('Payment required');
  });

  it('Marking same item complete twice is idempotent', async () => {
    const { accessToken } = await registerAndLogin(app, 'progress-idempotent');
    const { course, items } = await createCourseWithCurriculum();

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/curriculum/${items[0].id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/curriculum/${items[0].id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const res = await request(app.getHttpServer())
      .get(`/api/courses/${course.id}/curriculum/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as CurriculumProgressResponse;
    expect(body.completedItems).toBe(1);
  });
});
