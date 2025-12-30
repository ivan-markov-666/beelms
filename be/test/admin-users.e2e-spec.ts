import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin, uniqueEmail } from './utils/auth-helpers';

type AdminUserSummary = {
  id: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
};

describe('Admin Users endpoints (e2e)', () => {
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

  it('GET /api/admin/users returns list for admin user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-users-list-admin',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    const body = res.body as AdminUserSummary[];
    expect(body.length).toBeGreaterThanOrEqual(1);
    const emails = body.map((u) => u.email);
    expect(emails).toContain(email);
  });

  it('GET /api/admin/users returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/admin/users').expect(401);
  });

  it('GET /api/admin/users returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-users-list-non-admin',
    );

    await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('GET /api/admin/users returns 403 for monitoring user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-users-list-monitoring',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'monitoring';
    await userRepo.save(user);

    await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('PATCH /api/admin/users/:id toggles active flag for target user', async () => {
    const { email: adminEmail, accessToken } = await registerAndLogin(
      app,
      'admin-users-toggle-admin',
    );

    const adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    expect(adminUser).toBeDefined();

    if (!adminUser) {
      throw new Error('Admin user not found after registerAndLogin');
    }

    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    const targetEmail = uniqueEmail('admin-users-toggle-target');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: targetEmail, password: 'Password1234', acceptTerms: true })
      .expect(201);

    const targetUser = await userRepo.findOne({
      where: { email: targetEmail },
    });
    expect(targetUser).toBeDefined();

    if (!targetUser) {
      throw new Error('Target user not found after register');
    }

    expect(targetUser.active).toBe(true);

    const res = await request(app.getHttpServer())
      .patch(`/api/admin/users/${targetUser.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ active: false })
      .expect(200);

    const body = res.body as AdminUserSummary;
    expect(body.id).toBe(targetUser.id);
    expect(body.active).toBe(false);

    const reloaded = await userRepo.findOne({ where: { id: targetUser.id } });
    expect(reloaded).toBeDefined();
    expect(reloaded!.active).toBe(false);
  });

  it('PATCH /api/admin/users/:id returns 401 without token', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/users/some-id')
      .send({ active: false })
      .expect(401);
  });

  it('PATCH /api/admin/users/:id returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-users-toggle-non-admin',
    );

    const targetEmail = uniqueEmail('admin-users-toggle-non-admin-target');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: targetEmail, password: 'Password1234', acceptTerms: true })
      .expect(201);

    const targetUser = await userRepo.findOne({
      where: { email: targetEmail },
    });
    expect(targetUser).toBeDefined();

    if (!targetUser) {
      throw new Error('Target user not found after register');
    }

    await request(app.getHttpServer())
      .patch(`/api/admin/users/${targetUser.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ active: false })
      .expect(403);
  });

  it('PATCH /api/admin/users/:id returns 403 when admin tries to change own role', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-users-self-demotion',
    );

    const adminUser = await userRepo.findOne({ where: { email } });
    expect(adminUser).toBeDefined();

    if (!adminUser) {
      throw new Error('Admin user not found after registerAndLogin');
    }

    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    await request(app.getHttpServer())
      .patch(`/api/admin/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'user' })
      .expect(403);
  });
});
