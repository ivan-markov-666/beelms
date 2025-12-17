import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
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

  it('User can enroll and see course in /api/users/me/courses', async () => {
    const { accessToken } = await registerAndLogin(app, 'course-enroll');

    const listRes = await request(app.getHttpServer())
      .get('/api/courses')
      .expect(200);

    const courses = listRes.body as CourseSummary[];
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBeGreaterThanOrEqual(1);

    const courseId = courses[0].id;

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
});
