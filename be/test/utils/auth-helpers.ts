import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const uniqueEmail = (suffix: string): string => {
  const ts = Date.now().toString(36);
  const safeSuffix = (suffix || 'test')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 20);

  // Keep the local-part short to satisfy validator.js / RFC constraints (<= 64 chars)
  return `t-${safeSuffix}-${ts}@example.com`;
};

export async function registerAndLogin(
  app: INestApplication,
  suffix: string,
): Promise<{
  email: string;
  password: string;
  accessToken: string;
  tokenType: string;
}> {
  const email = uniqueEmail(suffix);
  const password = 'Password1234';

  const registerRes = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email,
      password,
      captchaToken: 'test-captcha-token',
      acceptTerms: true,
    });

  if (registerRes.status !== 201) {
    console.error(
      'registerAndLogin register failed',
      registerRes.status,
      registerRes.body,
    );
    throw new Error(
      `registerAndLogin: expected 201 from /api/auth/register, got ${registerRes.status}: ${JSON.stringify(registerRes.body)}`,
    );
  }

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const body = res.body as {
    accessToken: string;
    tokenType: string;
  };

  return {
    email,
    password,
    accessToken: body.accessToken,
    tokenType: body.tokenType,
  };
}
