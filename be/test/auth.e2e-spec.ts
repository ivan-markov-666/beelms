import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { registerAndLogin, uniqueEmail } from './utils/auth-helpers';

describe('Auth endpoints (e2e)', () => {
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

  it('POST /api/auth/register creates a new user', async () => {
    const email = uniqueEmail('register-success');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password1234',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', email);
    expect(typeof res.body.createdAt).toBe('string');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
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
    const { accessToken, tokenType } = await registerAndLogin(app, 'login-success');

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
});
