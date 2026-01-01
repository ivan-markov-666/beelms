import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin, uniqueEmail } from './utils/auth-helpers';

declare global {
  // Provided by rate-limit bootstrap in tests
  var clearRateLimitStore: (() => void) | undefined;
}

describe('Account endpoints (e2e)', () => {
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
    if (global.clearRateLimitStore) {
      global.clearRateLimitStore();
    }
  });

  it('GET /api/users/me returns current user profile for valid token', async () => {
    const { accessToken, email } = await registerAndLogin(app, 'get-me');

    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as {
      id: string;
      email: string;
      createdAt: string;
      role: string;
    };

    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', email);
    expect(typeof body.createdAt).toBe('string');
    expect(body).toHaveProperty('role');
    expect(typeof body.role).toBe('string');
  });

  it('GET /api/users/me returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('PATCH /api/users/me updates email for current user after verification', async () => {
    const { accessToken, email: oldEmail } = await registerAndLogin(
      app,
      'update-email',
    );

    const newEmail = oldEmail.replace('@', '+updated@');

    const res = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: newEmail })
      .expect(200);

    // Response still contains the old primary email until verification completes
    expect(res.body).toHaveProperty('email', oldEmail);

    const user = await userRepo.findOne({
      where: { email: oldEmail, active: true },
    });
    expect(user).toBeDefined();
    expect(user!.pendingEmail).toBe(newEmail);
    expect(user!.pendingEmailVerificationToken).toBeDefined();

    const verifyToken = user!.pendingEmailVerificationToken as string;

    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: verifyToken })
      .expect(200);

    const meRes = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body).toHaveProperty('email', newEmail);
  });

  it('PATCH /api/users/me returns 400 for invalid email format', async () => {
    const { accessToken } = await registerAndLogin(app, 'update-email-invalid');

    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('PATCH /api/users/me returns 409 when email is already taken by another user', async () => {
    const userA = await registerAndLogin(app, 'update-email-existing-a');
    const userB = await registerAndLogin(app, 'update-email-existing-b');

    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .send({ email: userA.email })
      .expect(409);
  });

  it('PATCH /api/users/me returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .send({ email: 'test@example.com' })
      .expect(401);
  });

  it('POST /api/users/me/change-password changes password for current user', async () => {
    const {
      email,
      password: oldPassword,
      accessToken,
    } = await registerAndLogin(app, 'change-password-success');

    const newPassword = 'NewPassword5678';

    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: oldPassword, newPassword })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: oldPassword })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: newPassword })
      .expect(200);
  });

  it('POST /api/users/me/change-password returns 400 for wrong current password', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'change-password-wrong-current',
    );

    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword5678',
      })
      .expect(400);
  });

  it('POST /api/users/me/change-password returns 400 for invalid new password', async () => {
    const { password: oldPassword, accessToken } = await registerAndLogin(
      app,
      'change-password-invalid-new',
    );

    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: oldPassword, newPassword: 'short' })
      .expect(400);
  });

  it('POST /api/users/me/change-password returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword5678' })
      .expect(401);
  });

  it('DELETE /api/users/me deactivates account and prevents further access', async () => {
    const { email, password, accessToken } = await registerAndLogin(
      app,
      'delete-me',
    );

    await request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(401);
  });

  it('DELETE /api/users/me returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer()).delete('/api/users/me').expect(401);
  });

  it('POST /api/users/me revokes tokens after change-password', async () => {
    const {
      email,
      password: oldPassword,
      accessToken,
    } = await registerAndLogin(app, 'token-revocation-change-password');

    // Old token works before password change
    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const newPassword = 'RevocationPassword123';

    // Change password with the current token
    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: oldPassword, newPassword })
      .expect(204);

    // The same old token is now rejected by protected endpoints
    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    // New login issues a fresh token that works
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: newPassword })
      .expect(200);

    const loginBody = loginRes.body as unknown as { accessToken: string };
    const newAccessToken = loginBody.accessToken;

    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);
  });

  it('POST /api/users/me/export returns export data for current user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'export-success',
    );

    const res = await request(app.getHttpServer())
      .post('/api/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(200);

    const body = res.body as {
      id: string;
      email: string;
      createdAt: string;
      active: boolean;
    };

    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', email);
    expect(typeof body.createdAt).toBe('string');
    expect(body).toHaveProperty('active', true);
  });

  it('POST /api/users/me/export returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/users/me/export')
      .send({})
      .expect(401);
  });

  it('POST /api/users/me/export requires captcha when ACCOUNT_EXPORT_REQUIRE_CAPTCHA is true', async () => {
    process.env.ACCOUNT_EXPORT_REQUIRE_CAPTCHA = 'true';

    const { email, accessToken } = await registerAndLogin(
      app,
      'export-captcha',
    );

    await request(app.getHttpServer())
      .post('/api/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    const res = await request(app.getHttpServer())
      .post('/api/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ captchaToken: 'test-captcha-token' })
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', email);

    delete process.env.ACCOUNT_EXPORT_REQUIRE_CAPTCHA;
  });

  it('enforces a 3-per-24h limit for email change verifications', async () => {
    const { accessToken, email: originalEmail } = await registerAndLogin(
      app,
      'update-email-limit',
    );

    let currentEmail = originalEmail;

    for (let i = 0; i < 3; i += 1) {
      const newEmail = originalEmail.replace('@', `+limit${i}@`);

      await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: newEmail })
        .expect(200);

      const user = await userRepo.findOne({
        where: { email: currentEmail, active: true },
      });
      expect(user).toBeDefined();
      expect(user!.pendingEmail).toBe(newEmail);
      expect(user!.pendingEmailVerificationToken).toBeDefined();

      const verifyToken = user!.pendingEmailVerificationToken as string;

      await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({ token: verifyToken })
        .expect(200);

      currentEmail = newEmail;
    }

    const meAfter = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const meAfterBody = meAfter.body as {
      emailChangeLimitReached: boolean;
      emailChangeLimitResetAt: string | null;
    };

    expect(meAfterBody).toHaveProperty('emailChangeLimitReached', true);
    expect(typeof meAfterBody.emailChangeLimitResetAt).toBe('string');

    const newEmail4 = originalEmail.replace('@', '+limit3@');

    const res = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: newEmail4 })
      .expect(429);

    expect(res.body).toHaveProperty(
      'message',
      'email change verification limit reached',
    );
  });

  it('INT-PA full happy path: profile view, update, change password, export, delete', async () => {
    const { email, password, accessToken } = await registerAndLogin(
      app,
      'int-pa-flow',
    );

    // 1) View profile
    const me1 = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me1.body).toHaveProperty('email', email);

    // 2) Update email
    const updatedEmail = email.replace('@', '+flow@');

    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: updatedEmail })
      .expect(200);

    const user = await userRepo.findOne({ where: { email, active: true } });
    expect(user).toBeDefined();
    expect(user!.pendingEmail).toBe(updatedEmail);
    expect(user!.pendingEmailVerificationToken).toBeDefined();

    const verifyToken = user!.pendingEmailVerificationToken as string;

    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: verifyToken })
      .expect(200);

    const me2 = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me2.body).toHaveProperty('email', updatedEmail);

    // 3) Change password
    const newPassword = 'IntFlowPassword890';

    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: password, newPassword })
      .expect(204);

    // Old password no longer works
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: updatedEmail, password })
      .expect(401);

    // New password works
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: updatedEmail, password: newPassword })
      .expect(200);

    const loginResBody = loginRes.body as unknown as { accessToken: string };
    const newAccessToken = loginResBody.accessToken;

    // 4) Export data
    const exportRes = await request(app.getHttpServer())
      .post('/api/users/me/export')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .send({})
      .expect(200);

    expect(exportRes.body).toHaveProperty('email', updatedEmail);
    expect(exportRes.body).toHaveProperty('active', true);

    // 5) Delete account
    await request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: updatedEmail, password: newPassword })
      .expect(401);
  });

  it('allows deleting an account and re-registering with the same email', async () => {
    const email = uniqueEmail('delete-reregister');
    const password = 'Password123!';

    // 1) Initial registration
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);

    // 2) Login with the initial credentials
    const login1 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const login1Body = login1.body as unknown as { accessToken: string };
    const accessToken1 = login1Body.accessToken;

    // 3) Delete the account
    await request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken1}`)
      .expect(204);

    // 4) Old credentials can no longer be used to login
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(401);

    // 5) Re-register with the same email and password
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        captchaToken: 'test-captcha-token',
        acceptTerms: true,
      })
      .expect(201);

    // 6) Login with the same email/password now works again
    const login2 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const login2Body = login2.body as unknown as { accessToken: string };
    const accessToken2 = login2Body.accessToken;

    // 7) Delete the account again to keep the DB clean
    await request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken2}`)
      .expect(204);
  });

  it('allows changing password, logging in with the new password, and deleting the user', async () => {
    const {
      email,
      password: oldPassword,
      accessToken,
    } = await registerAndLogin(app, 'change-password-login-delete');

    const newPassword = 'ChangeAndDeletePass123';

    // 1) Change password
    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: oldPassword, newPassword })
      .expect(204);

    // 2) Old password should no longer work
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: oldPassword })
      .expect(401);

    // 3) Login with the new password works
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: newPassword })
      .expect(200);

    const loginBody = loginRes.body as unknown as { accessToken: string };
    const newAccessToken = loginBody.accessToken;

    // 4) Delete the user to keep the DB clean
    await request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(204);
  });
});
