import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';

type AdminPaymentSettings = {
  currency: string;
  priceCents: number;
};

type AdminCourseDetail = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
};

describe('Payments & paid courses (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let originalStripeSecretKey: string | undefined;

  beforeAll(async () => {
    originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = '';

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

    if (originalStripeSecretKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    }
  });

  it('GET /api/admin/payments/settings returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/payments/settings')
      .expect(401);
  });

  it('GET /api/admin/payments/settings returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-payments-settings-non-admin',
    );

    await request(app.getHttpServer())
      .get('/api/admin/payments/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('PATCH /api/admin/payments/settings allows admin to update currency and priceCents', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-payments-settings-admin',
    );

    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const initialRes = await request(app.getHttpServer())
      .get('/api/admin/payments/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const initial = initialRes.body as AdminPaymentSettings;

    await request(app.getHttpServer())
      .patch('/api/admin/payments/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currency: 'usd', priceCents: 1234 })
      .expect(204);

    const res = await request(app.getHttpServer())
      .get('/api/admin/payments/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as AdminPaymentSettings;
    expect(body.currency).toBe('usd');
    expect(body.priceCents).toBe(1234);

    // restore
    await request(app.getHttpServer())
      .patch('/api/admin/payments/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currency: initial.currency, priceCents: initial.priceCents })
      .expect(204);
  });

  it('PATCH /api/admin/payments/settings validates currency and priceCents', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-payments-settings-validate',
    );

    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    await request(app.getHttpServer())
      .patch('/api/admin/payments/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currency: 'EURO' })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/admin/payments/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ priceCents: 0 })
      .expect(400);
  });

  it('Admin courses require currency and integer priceCents when isPaid=true', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-course-paid-pricing-required',
    );

    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const baseCourse = {
      title: `Paid course ${Date.now()}`,
      description: 'Paid course description',
      language: 'bg',
      status: 'active',
      isPaid: true,
    };

    await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...baseCourse, priceCents: 999 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...baseCourse, currency: 'eur' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...baseCourse, currency: 'eur', priceCents: 9.5 })
      .expect(400);

    const createdRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...baseCourse, currency: 'eur', priceCents: 999 })
      .expect(201);

    const created = createdRes.body as AdminCourseDetail;
    expect(created.isPaid).toBe(true);
    expect(created.currency).toBe('eur');
    expect(created.priceCents).toBe(999);

    await request(app.getHttpServer())
      .patch(`/api/admin/courses/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currency: null })
      .expect(400);

    const updatedRes = await request(app.getHttpServer())
      .patch(`/api/admin/courses/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currency: 'usd', priceCents: 1000 })
      .expect(200);

    const updated = updatedRes.body as AdminCourseDetail;
    expect(updated.currency).toBe('usd');
    expect(updated.priceCents).toBe(1000);
  });

  it('Payments endpoints return 501 when Stripe is not configured', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'checkout-501-admin-create-course',
    );

    const adminUser = await userRepo.findOne({ where: { email } });
    if (!adminUser) {
      throw new Error('User not found after registerAndLogin');
    }

    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    const createdRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: `Paid course checkout ${Date.now()}`,
        description: 'Paid course for checkout',
        language: 'bg',
        status: 'active',
        isPaid: true,
        currency: 'eur',
        priceCents: 999,
      })
      .expect(201);

    const created = createdRes.body as AdminCourseDetail;

    const { accessToken: buyerToken } = await registerAndLogin(
      app,
      'checkout-501-buyer',
    );

    await request(app.getHttpServer())
      .post(`/api/courses/${created.id}/checkout`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(501);

    await request(app.getHttpServer())
      .post(`/api/courses/${created.id}/purchase/verify`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ sessionId: 'cs_test_dummy' })
      .expect(501);
  });
});
