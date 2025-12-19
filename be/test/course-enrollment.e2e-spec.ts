import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Course } from '../src/courses/course.entity';
import { registerAndLogin } from './utils/auth-helpers';

type CourseSummary = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
};

type MyCourseListItem = CourseSummary & {
  enrollmentStatus: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number | null;
  enrolledAt: string | null;
};

describe('Course enrollment + my-courses endpoints (e2e)', () => {
  let app: INestApplication;
  let courseRepo: Repository<Course>;

  async function createCourse(
    overrides?: Partial<
      Pick<Course, 'title' | 'description' | 'language' | 'status' | 'isPaid'>
    >,
  ): Promise<Course> {
    const course = courseRepo.create({
      title: overrides?.title ?? `E2E Course ${Date.now()}`,
      description: overrides?.description ?? 'E2E course description',
      language: overrides?.language ?? 'en',
      status: overrides?.status ?? 'active',
      isPaid: overrides?.isPaid ?? false,
    });

    return courseRepo.save(course);
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

    courseRepo = app.get<Repository<Course>>(getRepositoryToken(Course));
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/courses/:courseId/enroll returns 401 without token', async () => {
    await request(app.getHttpServer())
      .post('/api/courses/00000000-0000-0000-0000-000000000000/enroll')
      .expect(401);
  });

  it('GET /api/users/me/courses returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/users/me/courses').expect(401);
  });

  it('GET /api/users/me/courses returns empty list for a new user with no enrollments', async () => {
    const { accessToken } = await registerAndLogin(app, 'my-courses-empty');

    const res = await request(app.getHttpServer())
      .get('/api/users/me/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as unknown;
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(0);
  });

  it('User can enroll and see course in /api/users/me/courses', async () => {
    const { accessToken } = await registerAndLogin(app, 'course-enroll');

    const course = await createCourse();
    const courseId = course.id;

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const myRes = await request(app.getHttpServer())
      .get('/api/users/me/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const myCourses = myRes.body as MyCourseListItem[];
    expect(Array.isArray(myCourses)).toBe(true);

    const ids = myCourses.map((c) => c.id);
    expect(ids).toContain(courseId);

    const item = myCourses.find((c) => c.id === courseId);
    expect(item).toBeDefined();
    expect(item!.enrollmentStatus).toBe('not_started');
  });

  it('POST /api/courses/:courseId/enroll returns 403 for paid courses (Payment required)', async () => {
    const { accessToken } = await registerAndLogin(app, 'course-enroll-paid');

    const course = await createCourse({ isPaid: true });
    const courseId = course.id;

    const res = await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    const body = res.body as { message?: string };
    expect(body.message).toBe('Payment required');
  });

  it('User can purchase a paid course and then enroll', async () => {
    const { accessToken } = await registerAndLogin(app, 'course-purchase-paid');

    const course = await createCourse({ isPaid: true });
    const courseId = course.id;

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/purchase`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });

  it('GET /api/users/me/courses does not include inactive courses', async () => {
    const { accessToken } = await registerAndLogin(app, 'my-courses-inactive');

    const course = await createCourse();
    const courseId = course.id;

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    course.status = 'inactive';
    await courseRepo.save(course);

    const myRes = await request(app.getHttpServer())
      .get('/api/users/me/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const myCourses = myRes.body as MyCourseListItem[];
    const ids = myCourses.map((c) => c.id);
    expect(ids).not.toContain(courseId);
  });
});
