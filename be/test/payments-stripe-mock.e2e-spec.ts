import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { CoursePurchase } from '../src/courses/course-purchase.entity';
import { registerAndLogin } from './utils/auth-helpers';

// Mock Stripe SDK used by PaymentsService
jest.mock('stripe', () => {
  const sessions = {
    create: jest.fn(),
    retrieve: jest.fn(),
  };
  const webhooks = {
    constructEvent: jest.fn(),
  };
  const mockStripe = {
    checkout: {
      sessions,
    },
    webhooks,
  };

  const Stripe = jest.fn().mockImplementation(() => mockStripe);
  // Expose singleton mock to tests
  (Stripe as unknown as { __mockStripe?: unknown }).__mockStripe = mockStripe;

  return Stripe;
});

type CreatedCourse = {
  id: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
};

describe('Payments Stripe mock (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let purchaseRepo: Repository<CoursePurchase>;

  let originalStripeSecretKey: string | undefined;

  beforeAll(async () => {
    // Ensure PaymentsService constructs Stripe client
    originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_test_mocked';

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
    purchaseRepo = app.get<Repository<CoursePurchase>>(
      getRepositoryToken(CoursePurchase),
    );
  });

  afterAll(async () => {
    await app.close();

    if (originalStripeSecretKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    }
  });

  const makeAdmin = async (email: string) => {
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }
    user.role = 'admin';
    await userRepo.save(user);
  };

  const createPaidCourseAsAdmin = async (adminToken: string) => {
    const createRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Paid course ${Date.now()}`,
        description: 'Paid course for mocked Stripe tests',
        language: 'bg',
        status: 'active',
        isPaid: true,
        currency: 'eur',
        priceCents: 999,
      })
      .expect(201);

    return createRes.body as CreatedCourse;
  };

  it('POST /api/courses/:courseId/checkout returns url (mocked Stripe)', async () => {
    const { email, accessToken: adminToken } = await registerAndLogin(
      app,
      'stripe-mock-checkout-admin',
    );
    await makeAdmin(email);

    const course = await createPaidCourseAsAdmin(adminToken);

    const { accessToken: buyerToken } = await registerAndLogin(
      app,
      'stripe-mock-checkout-buyer',
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as unknown as { __mockStripe: any };
    const stripe = Stripe.__mockStripe;

    stripe.checkout.sessions.create.mockResolvedValue({
      url: 'https://stripe.test/checkout/session/mock',
    });

    const res = await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/checkout`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);

    expect(res.body).toEqual({ url: 'https://stripe.test/checkout/session/mock' });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('POST /api/courses/:courseId/purchase/verify records CoursePurchase (happy path)', async () => {
    const { email, accessToken: adminToken } = await registerAndLogin(
      app,
      'stripe-mock-verify-admin',
    );
    await makeAdmin(email);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(app, 'stripe-mock-verify-buyer');

    const buyerUser = await userRepo.findOne({ where: { email: buyerLogin.email } });
    if (!buyerUser) {
      throw new Error('Buyer user not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as unknown as { __mockStripe: any };
    const stripe = Stripe.__mockStripe;

    stripe.checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: {
        courseId: course.id,
        userId: buyerUser.id,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/purchase/verify`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .send({ sessionId: 'cs_test_paid_123' })
      .expect(204);

    const purchase = await purchaseRepo.findOne({
      where: { courseId: course.id, userId: buyerUser.id },
    });

    expect(purchase).toBeDefined();
  });

  it('POST /api/courses/:courseId/purchase/verify returns 403 for metadata mismatch', async () => {
    const { email, accessToken: adminToken } = await registerAndLogin(
      app,
      'stripe-mock-mismatch-admin',
    );
    await makeAdmin(email);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(app, 'stripe-mock-mismatch-buyer');
    const buyerUser = await userRepo.findOne({ where: { email: buyerLogin.email } });
    if (!buyerUser) {
      throw new Error('Buyer user not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as unknown as { __mockStripe: any };
    const stripe = Stripe.__mockStripe;

    stripe.checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: {
        courseId: course.id,
        userId: '00000000-0000-0000-0000-000000000000',
      },
    });

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/purchase/verify`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .send({ sessionId: 'cs_test_paid_mismatch' })
      .expect(403);

    const purchase = await purchaseRepo.findOne({
      where: { courseId: course.id, userId: buyerUser.id },
    });

    expect(purchase).toBeNull();
  });

  it('POST /api/courses/:courseId/purchase/verify returns 403 when payment_status is not paid', async () => {
    const { email, accessToken: adminToken } = await registerAndLogin(
      app,
      'stripe-mock-unpaid-admin',
    );
    await makeAdmin(email);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(app, 'stripe-mock-unpaid-buyer');
    const buyerUser = await userRepo.findOne({ where: { email: buyerLogin.email } });
    if (!buyerUser) {
      throw new Error('Buyer user not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as unknown as { __mockStripe: any };
    const stripe = Stripe.__mockStripe;

    stripe.checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'unpaid',
      metadata: {
        courseId: course.id,
        userId: buyerUser.id,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/purchase/verify`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .send({ sessionId: 'cs_test_unpaid_123' })
      .expect(403);
  });

  it('verify is idempotent: second call returns 204 and keeps single purchase row', async () => {
    const { email, accessToken: adminToken } = await registerAndLogin(
      app,
      'stripe-mock-idempotent-admin',
    );
    await makeAdmin(email);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(app, 'stripe-mock-idempotent-buyer');
    const buyerUser = await userRepo.findOne({ where: { email: buyerLogin.email } });
    if (!buyerUser) {
      throw new Error('Buyer user not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as unknown as { __mockStripe: any };
    const stripe = Stripe.__mockStripe;

    stripe.checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: {
        courseId: course.id,
        userId: buyerUser.id,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/purchase/verify`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .send({ sessionId: 'cs_test_paid_idempotent' })
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/purchase/verify`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .send({ sessionId: 'cs_test_paid_idempotent' })
      .expect(204);

    const purchases = await purchaseRepo.find({
      where: { courseId: course.id, userId: buyerUser.id },
    });

    expect(purchases.length).toBe(1);
  });

  it('checkout returns 400 when Stripe session url is missing', async () => {
    const { email, accessToken: adminToken } = await registerAndLogin(
      app,
      'stripe-mock-checkout-url-missing-admin',
    );
    await makeAdmin(email);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(
      app,
      'stripe-mock-checkout-url-missing-buyer',
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as unknown as { __mockStripe: any };
    const stripe = Stripe.__mockStripe;

    stripe.checkout.sessions.create.mockResolvedValue({ url: null });

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/checkout`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .expect(400);
  });
});
