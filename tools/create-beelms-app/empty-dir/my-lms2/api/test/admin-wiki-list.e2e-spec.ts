import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';

describe('Admin Wiki list endpoint (e2e)', () => {
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

  it('GET /api/admin/wiki/articles returns list for admin user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-list-admin',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const res = await request(app.getHttpServer())
      .get('/api/admin/wiki/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/admin/wiki/articles returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/wiki/articles')
      .expect(401);
  });

  it('GET /api/admin/wiki/articles returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-wiki-list-non-admin',
    );

    await request(app.getHttpServer())
      .get('/api/admin/wiki/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
