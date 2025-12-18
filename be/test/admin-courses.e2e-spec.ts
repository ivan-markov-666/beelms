import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { Course } from '../src/courses/course.entity';
import { registerAndLogin } from './utils/auth-helpers';

type CourseSummary = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
};

type CourseDetail = CourseSummary & {
  curriculum: unknown[];
};

describe('Admin Courses endpoints (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/admin/courses returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/admin/courses').expect(401);
  });

  it('GET /api/admin/courses returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-courses-list-non-admin',
    );

    await request(app.getHttpServer())
      .get('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('POST/GET/PATCH /api/admin/courses works for admin user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-courses-crud-admin',
    );

    const adminUser = await userRepo.findOne({ where: { email } });
    expect(adminUser).toBeDefined();

    if (!adminUser) {
      throw new Error('Admin user not found after registerAndLogin');
    }

    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    const createRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Admin Created Course',
        description: 'Created via e2e test',
        language: 'bg',
        status: 'draft',
        isPaid: true,
      })
      .expect(201);

    const created = createRes.body as CourseDetail;
    expect(created.id).toBeDefined();
    expect(created.title).toBe('Admin Created Course');
    expect(created.isPaid).toBe(true);
    expect(Array.isArray(created.curriculum)).toBe(true);

    const dbCreated = await courseRepo.findOne({ where: { id: created.id } });
    expect(dbCreated).toBeDefined();
    expect(dbCreated!.isPaid).toBe(true);

    const listRes = await request(app.getHttpServer())
      .get('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const list = listRes.body as CourseSummary[];
    expect(Array.isArray(list)).toBe(true);
    const ids = list.map((c) => c.id);
    expect(ids).toContain(created.id);

    const detailRes = await request(app.getHttpServer())
      .get(`/api/admin/courses/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const detail = detailRes.body as CourseDetail;
    expect(detail.id).toBe(created.id);
    expect(detail.isPaid).toBe(true);

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/admin/courses/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        status: 'active',
        isPaid: false,
      })
      .expect(200);

    const updated = patchRes.body as CourseDetail;
    expect(updated.status).toBe('active');
    expect(updated.isPaid).toBe(false);

    const dbUpdated = await courseRepo.findOne({ where: { id: created.id } });
    expect(dbUpdated).toBeDefined();
    expect(dbUpdated!.status).toBe('active');
    expect(dbUpdated!.isPaid).toBe(false);
  });
});
