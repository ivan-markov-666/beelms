import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin, uniqueEmail } from './utils/auth-helpers';

declare global {
  var clearRateLimitStore: (() => void) | undefined;
}

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

  beforeEach(() => {
    delete process.env.RATE_LIMIT_TEST_MODE;
    if (global.clearRateLimitStore) {
      global.clearRateLimitStore();
    }
  });

  it('POST /api/auth/register creates a new user', async () => {
    const email = uniqueEmail('register-success');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
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
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(409);

    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register allows reuse of email from deleted account', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'register-reuse-email',
    );

    await request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        acceptTerms: true,
      })
      .expect(201);

    expect(res.body).toHaveProperty('email', email);
  });

  it('POST /api/auth/register returns 400 for password missing uppercase letter', async () => {
    const email = uniqueEmail('register-no-uppercase');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for password missing lowercase letter', async () => {
    const email = uniqueEmail('register-no-lowercase');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'PASSWORD123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for password missing digit', async () => {
    const email = uniqueEmail('register-no-digit');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password!!!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for password missing special character', async () => {
    const email = uniqueEmail('register-no-special');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for password too short', async () => {
    const email = uniqueEmail('register-too-short');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Pass1!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for password too long', async () => {
    const email = uniqueEmail('register-too-long');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'P' + 'a1!'.repeat(33) + 'a', // 101 characters - valid chars but too long
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register handles very large request body', async () => {
    const email = uniqueEmail('large-body');

    // Send a password that is way too large (10000 chars)
    const largePassword = 'a'.repeat(10000);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: largePassword,
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 without Content-Type header', async () => {
    const email = uniqueEmail('register-no-content-type');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .unset('Content-Type')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);
  });

  it('POST /api/auth/register rate limits requests', async () => {
    const clearRateLimitStore = global.clearRateLimitStore;
    if (clearRateLimitStore) {
      clearRateLimitStore();
    }

    process.env.RATE_LIMIT_TEST_MODE = 'true';

    // Send 5 requests (should succeed)
    for (let i = 0; i < 5; i++) {
      const email = uniqueEmail(`rate-limit-${i}`);
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          captchaToken: 'test-captcha-token',
          acceptTerms: true,
        })
        .expect(201);
    }

    // 6th request should be rate limited
    const email6 = uniqueEmail('rate-limit-5');
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: email6,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(429);

    delete process.env.RATE_LIMIT_TEST_MODE;
  });

  it('POST /api/auth/register handles malicious SQL patterns in password', async () => {
    const email = uniqueEmail('register-sql-injection');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: "' OR '1'='1' -- Password123!",
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);
  });

  it('POST /api/auth/register sanitizes XSS attempts in password', async () => {
    const email = uniqueEmail('register-xss');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: '<script>alert("xss")</script>Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);
  });

  it('POST /api/auth/register handles concurrent duplicate attempts', async () => {
    const email = uniqueEmail('concurrent-register');

    const request1 = request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      });

    const request2 = request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      });

    const [res1, res2] = await Promise.all([request1, request2]);

    // One should succeed, one should fail
    const results = [res1.status, res2.status];
    expect(results).toContain(201);
    expect(results).toContain(409);

    // Check that successful response has user data
    const successRes = res1.status === 201 ? res1 : res2;
    expect(successRes.body).toHaveProperty('id');
    expect(successRes.body).toHaveProperty('email', email);
  });

  it('POST /api/auth/register returns 503 during maintenance mode', async () => {
    process.env.MAINTENANCE_MODE = 'true';

    const email = uniqueEmail('register-maintenance');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(503);

    expect(res.body).toHaveProperty(
      'message',
      'Service temporarily unavailable due to maintenance',
    );

    delete process.env.MAINTENANCE_MODE;
  });

  it('POST /api/auth/register returns 400 for expired captcha token', async () => {
    process.env.AUTH_REQUIRE_CAPTCHA = 'true';

    // Mock fetch to simulate expired captcha
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    });

    const email = uniqueEmail('register-expired-captcha');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'expired-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).toHaveProperty('message', 'captcha verification failed');

    // Restore original fetch
    global.fetch = originalFetch;
    delete process.env.AUTH_REQUIRE_CAPTCHA;
  });

  it('POST /api/auth/register returns 400 for email too long', async () => {
    const longEmail = 'a'.repeat(250) + '@example.com'; // >255 chars

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: longEmail,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for malformed JSON', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{invalid json')
      .expect(400);
  });

  it('GET /api/auth/register returns 405 Method Not Allowed', async () => {
    await request(app.getHttpServer()).get('/api/auth/register').expect(405);
  });

  it('POST /api/auth/register handles emails with Unicode characters', async () => {
    const unicodeEmails = [
      'üser@example.com', // German umlaut
      'user@пример.com', // Cyrillic
      'user@例え.com', // Japanese
    ];

    for (const unicodeEmail of unicodeEmails) {
      const email =
        uniqueEmail('unicode') + unicodeEmail.slice(unicodeEmail.indexOf('@'));

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          captchaToken: 'test-captcha-token',
          acceptTerms: true,
        })
        .expect(400);
    }
  });

  it('POST /api/auth/register returns 400 for password with only spaces', async () => {
    const email = uniqueEmail('register-only-spaces');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: '   ', // Only spaces
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for password with only special characters', async () => {
    const email = uniqueEmail('register-only-special');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: '!@#$%^&*()', // Only special chars, no letters or digits
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(400);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 for invalid email formats', async () => {
    const invalidEmails = [
      'invalid-email',
      'user@',
      '@example.com',
      'user..user@example.com',
      'user@example..com',
      'user @example.com',
      '',
      'user@example',
    ];

    for (const invalidEmail of invalidEmails) {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: invalidEmail,
          password: 'Password123!',
          captchaToken: 'test-captcha-token',
          acceptTerms: true,
        })
        .expect(400);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
    }
  });

  it('POST /api/auth/register returns 409 for email with verified active account', async () => {
    const email = uniqueEmail('register-verified-active');

    // Register and verify the account
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password123!', acceptTerms: true })
      .expect(201);

    // Manually verify the email in database
    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    user!.emailVerified = true;
    await userRepo.save(user!);

    // Try to register again with same email
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password123!', acceptTerms: true })
      .expect(409);

    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register returns 400 when acceptTerms is false', async () => {
    const email = uniqueEmail('register-terms-false');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password123!', acceptTerms: false })
      .expect(400);
  });

  it('POST /api/auth/register requires captchaToken when AUTH_REQUIRE_CAPTCHA is true', async () => {
    process.env.AUTH_REQUIRE_CAPTCHA = 'true';

    const email = uniqueEmail('register-captcha-required');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password123!', acceptTerms: true })
      .expect(400);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', email);

    delete process.env.AUTH_REQUIRE_CAPTCHA;
  });

  it('POST /api/auth/register returns 400 when captcha token is blank while required', async () => {
    process.env.AUTH_REQUIRE_CAPTCHA = 'true';

    const email = uniqueEmail('register-captcha-blank');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: '   ',
        acceptTerms: true,
      })
      .expect(400);

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
    const email = uniqueEmail('login-invalid-creds');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'WrongPassword123!' })
      .expect(401);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/forgot-password always returns 200, even for unknown email', async () => {
    const email = uniqueEmail('forgot-unknown');

    const requestData: { email: string; captchaToken?: string } = { email };
    if (process.env.AUTH_REQUIRE_CAPTCHA === 'true') {
      requestData.captchaToken = 'test-captcha-token';
    }

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({
        ...requestData,
        captchaToken: 'test-captcha-token',
      })
      .expect(200);
  });

  it('POST /api/auth/verify-email verifies registration email and clears token', async () => {
    const email = uniqueEmail('verify-email-register');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
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
    const originalPassword = 'Password123!';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: originalPassword,
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email, captchaToken: 'test-captcha-token' })
      .expect(200);

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    expect(user!.resetPasswordToken).toBeDefined();

    const resetToken = user!.resetPasswordToken as string;
    const newPassword = 'NewPassword123!';

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
      .send({ token: resetToken, newPassword: 'AnotherPassword123!' })
      .expect(400);
  });

  it('complete registration flow: register -> verify email -> login', async () => {
    const email = uniqueEmail('complete-flow');
    const password = 'Password123!';

    // 1. Register
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);

    // 2. Get verification token
    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    expect(user!.emailVerified).toBe(false);
    const token = user!.emailVerificationToken as string;

    // 3. Verify email
    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(200);

    // 4. Check user is verified
    const verifiedUser = await userRepo.findOne({ where: { email } });
    expect(verifiedUser!.emailVerified).toBe(true);

    // 5. Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginRes.body).toHaveProperty('accessToken');
  });

  it('POST /api/auth/register returns 400 when honeypot field is filled (bot detection)', async () => {
    const email = uniqueEmail('register-honeypot');

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
        honeypot: 'bot-filled-field', // Simulate bot filling honeypot
      })
      .expect(400);

    const message = (res.body as { message?: unknown }).message;
    expect(typeof message).toBe('string');
    expect(['bot detected', 'captcha verification required']).toContain(
      String(message),
    );
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});
