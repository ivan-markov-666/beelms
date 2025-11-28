import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { registerAndLogin } from './utils/auth-helpers';

describe('Account endpoints (e2e)', () => {
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

  it('GET /api/users/me returns current user profile for valid token', async () => {
    const { accessToken, email } = await registerAndLogin(app, 'get-me');

    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', email);
    expect(typeof res.body.createdAt).toBe('string');
  });

  it('GET /api/users/me returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('PATCH /api/users/me updates email for current user', async () => {
    const { accessToken, email: oldEmail } = await registerAndLogin(app, 'update-email');

    const newEmail = oldEmail.replace('@', '+updated@');

    const res = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: newEmail })
      .expect(200);

    expect(res.body).toHaveProperty('email', newEmail);

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
    const { email, password: oldPassword, accessToken } = await registerAndLogin(
      app,
      'change-password-success',
    );

    const newPassword = 'NewPassword5678';

    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: oldPassword, newPassword })
      .expect(200);

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
    const { accessToken } = await registerAndLogin(app, 'change-password-wrong-current');

    await request(app.getHttpServer())
      .post('/api/users/me/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'WrongPassword1234', newPassword: 'NewPassword5678' })
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
      .send({ currentPassword: 'Password1234', newPassword: 'NewPassword5678' })
      .expect(401);
  });

  it('DELETE /api/users/me deactivates account and prevents further access', async () => {
    const { email, password, accessToken } = await registerAndLogin(app, 'delete-me');

    await request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(401);
  });

  it('DELETE /api/users/me returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer()).delete('/api/users/me').expect(401);
  });

  it('POST /api/users/me/export returns export data for current user', async () => {
    const { email, accessToken } = await registerAndLogin(app, 'export-success');

    const res = await request(app.getHttpServer())
      .post('/api/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', email);
    expect(typeof res.body.createdAt).toBe('string');
    expect(res.body).toHaveProperty('active', true);
  });

  it('POST /api/users/me/export returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer()).post('/api/users/me/export').send({}).expect(401);
  });

  it('POST /api/users/me/export requires captcha when ACCOUNT_EXPORT_REQUIRE_CAPTCHA is true', async () => {
    process.env.ACCOUNT_EXPORT_REQUIRE_CAPTCHA = 'true';

    const { email, accessToken } = await registerAndLogin(app, 'export-captcha');

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

  it('INT-PA full happy path: profile view, update, change password, export, delete', async () => {
    const { email, password, accessToken } = await registerAndLogin(app, 'int-pa-flow');

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
      .expect(200);

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

    const newAccessToken = loginRes.body.accessToken as string;

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
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: updatedEmail, password: newPassword })
      .expect(401);
  });
});
