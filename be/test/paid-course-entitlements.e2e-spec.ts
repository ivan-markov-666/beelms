import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';

describe('Paid course entitlements (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  const makeAdmin = async (email: string) => {
    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);
  };

  it('requires purchase before enroll; requires enrollment for course wiki access', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'paid-entitlements-admin');
    await makeAdmin(adminEmail);

    const slug = `paid-entitlements-${Date.now()}`;

    await request(app.getHttpServer())
      .post('/api/admin/wiki/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug,
        status: 'active',
        visibility: 'course_only',
        tags: ['course', 'paid'],
        contents: [
          {
            language: 'bg',
            title: 'Paid content article',
            content: 'Paid article content',
          },
        ],
      })
      .expect(201);

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Paid Entitlements Course ${Date.now()}`,
        description: 'Course for paid entitlements tests',
        language: 'bg',
        status: 'active',
        isPaid: true,
        currency: 'eur',
        priceCents: 999,
      })
      .expect(201);

    const courseId = (createCourseRes.body as { id: string }).id;
    expect(courseId).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemType: 'wiki',
        title: 'Paid module',
        order: 1,
        wikiSlug: slug,
      })
      .expect(201);

    const { accessToken: userToken } = await registerAndLogin(
      app,
      'paid-entitlements-user',
    );

    // 1) Wiki access requires enrollment (403)
    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/wiki/${slug}`)
      .query({ lang: 'bg' })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    // 2) Enroll in paid course requires purchase (403)
    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    // 3) Record purchase (MVP endpoint)
    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);

    // 4) Enroll now succeeds
    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);

    // 5) Wiki access now succeeds
    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/wiki/${slug}`)
      .query({ lang: 'bg' })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });
});
