import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin, uniqueEmail } from './utils/auth-helpers';

describe('Auth endpoints (e2e)', () => {
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

  it('POST /api/auth/register creates a new user', async () => {
    const email = uniqueEmail('register-success');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password1234',
      })
      .expect(201);

    const body = res.body as {
      id: string;
      email: string;
      createdAt: string;
      password?: unknown;
      passwordHash?: unknown;
    };

    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', email);
    expect(typeof body.createdAt).toBe('string');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 409 for duplicate email', async () => {
    const email = uniqueEmail('register-duplicate');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password1234' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password1234' })
      .expect(409);

    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for invalid data', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for extra fields (ValidationPipe forbidNonWhitelisted)', async () => {
    const email = uniqueEmail('register-extra-fields');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password1234',
        extraField: 'should-be-rejected',
      })
      .expect(400);
  });

  it('POST /api/auth/register requires captchaToken when AUTH_REQUIRE_CAPTCHA is true', async () => {
    process.env.AUTH_REQUIRE_CAPTCHA = 'true';

    const email = uniqueEmail('register-captcha-required');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password1234' })
      .expect(400);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password1234',
        captchaToken: 'test-captcha-token',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', email);

    delete process.env.AUTH_REQUIRE_CAPTCHA;
  });

  it('POST /api/auth/login returns token for valid credentials', async () => {
    const { accessToken, tokenType } = await registerAndLogin(
      app,
      'login-success',
    );

    expect(accessToken).toBeDefined();
    expect(tokenType).toBe('Bearer');
  });

  it('POST /api/auth/login returns 401 for invalid credentials', async () => {
    const email = uniqueEmail('login-invalid');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password1234' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'WrongPassword1234' })
      .expect(401);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/forgot-password always returns 200, even for unknown email', async () => {
    const email = uniqueEmail('forgot-unknown');

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(200);
  });

  it('POST /api/auth/verify-email verifies registration email and clears token', async () => {
    const email = uniqueEmail('verify-email-register');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password1234' })
      .expect(201);

    const userBefore = await userRepo.findOne({ where: { email } });
    expect(userBefore).toBeDefined();
    expect(userBefore!.emailVerified).toBe(false);
    expect(userBefore!.emailVerificationToken).toBeDefined();

    const token = userBefore!.emailVerificationToken as string;

    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(200);

    const userAfter = await userRepo.findOne({ where: { email } });
    expect(userAfter).toBeDefined();
    expect(userAfter!.emailVerified).toBe(true);
    expect(userAfter!.emailVerificationToken).toBeNull();
    expect(userAfter!.emailVerificationTokenExpiresAt).toBeNull();

    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(400);
  });

  it('allows resetting password via forgot-password and reset-password flow', async () => {
    const email = uniqueEmail('forgot-reset-flow');
    const originalPassword = 'Password1234';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: originalPassword })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(200);

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    expect(user!.resetPasswordToken).toBeDefined();

    const resetToken = user!.resetPasswordToken as string;
    const newPassword = 'NewPassword1234';

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: originalPassword })
      .expect(401);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: newPassword })
      .expect(200);

    expect(loginRes.body).toHaveProperty('accessToken');

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'AnotherPassword1234' })
      .expect(400);
  });
});
