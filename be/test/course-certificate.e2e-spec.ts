import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Course } from '../src/courses/course.entity';
import { CourseEnrollment } from '../src/courses/course-enrollment.entity';
import { registerAndLogin } from './utils/auth-helpers';

describe('Course certificate endpoint (e2e)', () => {
  let app: INestApplication;
  let courseRepo: Repository<Course>;
  let enrollmentRepo: Repository<CourseEnrollment>;

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
    enrollmentRepo = app.get<Repository<CourseEnrollment>>(
      getRepositoryToken(CourseEnrollment),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/courses/:courseId/certificate returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/courses/00000000-0000-0000-0000-000000000000/certificate')
      .expect(401);
  });

  it('Certificate is 403 when course is not completed; 200 when completed', async () => {
    const { accessToken, email } = await registerAndLogin(
      app,
      'course-certificate',
    );

    const course = await createCourse();
    const courseId = course.id;

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/certificate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    const meRes = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const meBody = meRes.body as { id: string; email: string };

    const enrollmentByCourseAndUser = await enrollmentRepo.findOne({
      where: { courseId, userId: meBody.id },
    });

    if (!enrollmentByCourseAndUser) {
      throw new Error('Expected enrollment to exist');
    }

    enrollmentByCourseAndUser.status = 'completed';
    await enrollmentRepo.save(enrollmentByCourseAndUser);

    const res = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/certificate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as {
      courseId: string;
      courseTitle: string;
      userId: string;
      userEmail: string;
      completedAt: string;
      issuedAt: string;
    };

    expect(body.courseId).toBe(courseId);
    expect(body.courseTitle).toBe(course.title);
    expect(body.userEmail).toBe(email);
    expect(typeof body.userId).toBe('string');
    expect(typeof body.completedAt).toBe('string');
    expect(typeof body.issuedAt).toBe('string');
  });
});
