import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { uniqueEmail } from './utils/auth-helpers';

describe('Account protection (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.ACCOUNT_PROTECTION_TEST_MODE = 'true';

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
    delete process.env.ACCOUNT_PROTECTION_TEST_MODE;
    await app.close();
  });

  it('POST /api/auth/login returns 429 after repeated invalid credentials', async () => {
    const email = uniqueEmail('account-protection-login');
    const password = 'Password1234';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, captchaToken: 'test-captcha-token' })
      .expect(201);

    for (let i = 0; i < 5; i += 1) {
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

  it('successful login clears lockout for the same ip+email', async () => {
    const email = uniqueEmail('account-protection-clear');
    const password = 'Password1234';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, captchaToken: 'test-captcha-token' })
      .expect(201);

    for (let i = 0; i < 4; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword1234' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    for (let i = 0; i < 5; i += 1) {
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
});
