import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { registerAndLogin, uniqueEmail } from './utils/auth-helpers';

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.RATE_LIMIT_TEST_MODE = 'true';

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
    delete process.env.RATE_LIMIT_TEST_MODE;
    await app.close();
  });

  it('POST /api/auth/login returns 429 after exceeding ip+email limit', async () => {
    const email = uniqueEmail('rate-limit-login');
    const password = 'Password1234';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, captchaToken: 'test-captcha-token' })
      .expect(201);

    for (let i = 0; i < 10; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword1234' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'WrongPassword1234' })
      .expect(429);
  });

  it('POST /api/users/me/export returns 429 after exceeding userId limit', async () => {
    const { accessToken } = await registerAndLogin(app, 'rate-limit-export');

    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer())
        .post('/api/users/me/export')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(429);
  });

  it('POST /api/training/echo returns 429 after exceeding ip limit', async () => {
    for (let i = 0; i < 60; i += 1) {
      await request(app.getHttpServer())
        .post('/api/training/echo')
        .send({ message: 'hello', count: i })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/training/echo')
      .send({ message: 'hello', count: 999 })
      .expect(429);
  });

  it('POST /api/tasks/:id/submit returns 429 after exceeding ip limit', async () => {
    for (let i = 0; i < 120; i += 1) {
      await request(app.getHttpServer())
        .post('/api/tasks/string-hello-world/submit')
        .send({ solution: 'hello world' })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/tasks/string-hello-world/submit')
      .send({ solution: 'hello world' })
      .expect(429);
  });
});
