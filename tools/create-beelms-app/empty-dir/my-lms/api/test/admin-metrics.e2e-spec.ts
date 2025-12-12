import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';

type MetricsOverview = {
  totalUsers: number;
  totalArticles: number;
  topArticles: Array<{ slug: string }>;
  usersChangePercentSinceLastMonth: number | null;
};

describe('Admin Metrics endpoint (e2e)', () => {
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

  it('GET /api/admin/metrics/overview returns metrics for admin user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-metrics-admin',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const res = await request(app.getHttpServer())
      .get('/api/admin/metrics/overview')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as MetricsOverview;
    expect(typeof body.totalUsers).toBe('number');
    expect(body.totalUsers).toBeGreaterThanOrEqual(1);
    expect(typeof body.totalArticles).toBe('number');
    expect(Array.isArray(body.topArticles)).toBe(true);
    expect(
      body.usersChangePercentSinceLastMonth === null ||
        typeof body.usersChangePercentSinceLastMonth === 'number',
    ).toBe(true);
  });

  it('GET /api/admin/metrics/overview returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/metrics/overview')
      .expect(401);
  });

  it('GET /api/admin/metrics/overview returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-metrics-non-admin',
    );

    await request(app.getHttpServer())
      .get('/api/admin/metrics/overview')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
