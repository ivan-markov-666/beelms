import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { CoursePurchase } from '../src/courses/course-purchase.entity';
import { registerAndLogin } from './utils/auth-helpers';

type CreatedCourse = {
  id: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
};

describe('Payments PayPal mock (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let purchaseRepo: Repository<CoursePurchase>;

  let originalStripeSecretKey: string | undefined;
  let originalPaypalMode: string | undefined;
  let originalPaypalClientId: string | undefined;
  let originalPaypalClientSecret: string | undefined;
  let originalFrontendOrigin: string | undefined;

  let originalFetch: typeof global.fetch | undefined;

  beforeAll(async () => {
    originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
    originalPaypalMode = process.env.PAYPAL_MODE;
    originalPaypalClientId = process.env.PAYPAL_CLIENT_ID;
    originalPaypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    originalFrontendOrigin = process.env.FRONTEND_ORIGIN;

    process.env.STRIPE_SECRET_KEY = '';

    process.env.PAYPAL_MODE = 'sandbox';
    process.env.PAYPAL_CLIENT_ID = 'paypal_client_id';
    process.env.PAYPAL_CLIENT_SECRET = 'paypal_client_secret';
    process.env.FRONTEND_ORIGIN = 'http://localhost:3001';

    originalFetch = global.fetch;

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

    if (originalPaypalMode === undefined) {
      delete process.env.PAYPAL_MODE;
    } else {
      process.env.PAYPAL_MODE = originalPaypalMode;
    }

    if (originalPaypalClientId === undefined) {
      delete process.env.PAYPAL_CLIENT_ID;
    } else {
      process.env.PAYPAL_CLIENT_ID = originalPaypalClientId;
    }

    if (originalPaypalClientSecret === undefined) {
      delete process.env.PAYPAL_CLIENT_SECRET;
    } else {
      process.env.PAYPAL_CLIENT_SECRET = originalPaypalClientSecret;
    }

    if (originalFrontendOrigin === undefined) {
      delete process.env.FRONTEND_ORIGIN;
    } else {
      process.env.FRONTEND_ORIGIN = originalFrontendOrigin;
    }

    if (originalFetch === undefined) {
      delete (global as unknown as { fetch?: unknown }).fetch;
    } else {
      global.fetch = originalFetch;
    }
  });

  beforeEach(() => {
    jest.restoreAllMocks();

    if (originalFetch === undefined) {
      delete (global as unknown as { fetch?: unknown }).fetch;
    } else {
      global.fetch = originalFetch;
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
        description: 'Paid course for mocked PayPal tests',
        language: 'bg',
        status: 'active',
        isPaid: true,
        currency: 'eur',
        priceCents: 999,
      })
      .expect(201);

    return createRes.body as CreatedCourse;
  };

  const makeFetchResponse = (args: {
    ok: boolean;
    status?: number;
    json: unknown;
  }): Response => {
    return {
      ok: args.ok,
      status: args.status ?? (args.ok ? 200 : 400),
      json: () => Promise.resolve(args.json),
    } as unknown as Response;
  };

  it('POST /api/courses/:courseId/checkout?provider=paypal returns url (mocked PayPal)', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'paypal-mock-checkout-admin');
    await makeAdmin(adminEmail);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(
      app,
      'paypal-mock-checkout-buyer',
    );

    const buyerUser = await userRepo.findOne({
      where: { email: buyerLogin.email },
    });
    if (!buyerUser) {
      throw new Error('Buyer user not found');
    }

    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      if (url.includes('/v1/oauth2/token')) {
        return Promise.resolve(
          makeFetchResponse({
            ok: true,
            json: { access_token: 'AT', expires_in: 3600 },
          }),
        );
      }

      if (url.includes('/v2/checkout/orders')) {
        const bodyText = typeof init?.body === 'string' ? init.body : '{}';
        const body = JSON.parse(bodyText) as {
          purchase_units?: Array<{ custom_id?: string }>;
          application_context?: { return_url?: string; cancel_url?: string };
        };

        const customRaw = (body.purchase_units?.[0]?.custom_id ?? '').trim();
        const custom = JSON.parse(customRaw) as {
          courseId?: string;
          userId?: string;
        };

        expect(custom.courseId).toBe(course.id);
        expect(custom.userId).toBe(buyerUser.id);

        expect(body.application_context?.return_url).toBe(
          `http://localhost:3001/courses/${course.id}/checkout/paypal/success`,
        );
        expect(body.application_context?.cancel_url).toBe(
          `http://localhost:3001/courses/${course.id}/checkout/paypal/cancel`,
        );

        return Promise.resolve(
          makeFetchResponse({
            ok: true,
            json: {
              id: 'ORDER_ID_1',
              links: [
                {
                  rel: 'approve',
                  href: 'https://paypal.test/approve/ORDER_ID_1',
                },
              ],
            },
          }),
        );
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    const res = await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/checkout?provider=paypal`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .expect(201);

    expect(res.body).toEqual({
      url: 'https://paypal.test/approve/ORDER_ID_1',
    });
  });

  it('POST /api/courses/:courseId/paypal/verify records CoursePurchase (mocked PayPal)', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'paypal-mock-verify-admin');
    await makeAdmin(adminEmail);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(app, 'paypal-mock-verify-buyer');

    const buyerUser = await userRepo.findOne({
      where: { email: buyerLogin.email },
    });
    if (!buyerUser) {
      throw new Error('Buyer user not found');
    }

    const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const fetchMock = jest.fn((url: string) => {
      if (url.includes('/v1/oauth2/token')) {
        return Promise.resolve(
          makeFetchResponse({
            ok: true,
            json: { access_token: 'AT', expires_in: 3600 },
          }),
        );
      }

      if (
        url.includes(
          `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        )
      ) {
        return Promise.resolve(
          makeFetchResponse({
            ok: true,
            json: {
              status: 'COMPLETED',
              purchase_units: [
                {
                  custom_id: JSON.stringify({
                    courseId: course.id,
                    userId: buyerUser.id,
                  }),
                  amount: { currency_code: 'EUR', value: '9.99' },
                  payments: {
                    captures: [{ id: 'CAPTURE_1', status: 'COMPLETED' }],
                  },
                },
              ],
            },
          }),
        );
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/paypal/verify`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .send({ orderId })
      .expect(204);

    const purchase = await purchaseRepo.findOne({
      where: {
        courseId: course.id,
        userId: buyerUser.id,
      },
    });

    expect(purchase).toBeDefined();
    expect(purchase?.paypalOrderId).toBe(orderId);
    expect(purchase?.paypalCaptureId).toBe('CAPTURE_1');
    expect(purchase?.source).toBe('paypal');
  });

  it('POST /api/courses/:courseId/paypal/verify returns 403 when PayPal custom payload mismatches user/course', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'paypal-mock-verify-mismatch-admin');
    await makeAdmin(adminEmail);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(
      app,
      'paypal-mock-verify-mismatch-buyer',
    );

    const buyerUser = await userRepo.findOne({
      where: { email: buyerLogin.email },
    });
    if (!buyerUser) {
      throw new Error('Buyer user not found');
    }

    const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const fetchMock = jest.fn((url: string) => {
      if (url.includes('/v1/oauth2/token')) {
        return Promise.resolve(
          makeFetchResponse({
            ok: true,
            json: { access_token: 'AT', expires_in: 3600 },
          }),
        );
      }

      if (
        url.includes(
          `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        )
      ) {
        return Promise.resolve(
          makeFetchResponse({
            ok: true,
            json: {
              status: 'COMPLETED',
              purchase_units: [
                {
                  custom_id: JSON.stringify({
                    courseId: 'another-course',
                    userId: 'other-user',
                  }),
                  amount: { currency_code: 'EUR', value: '9.99' },
                },
              ],
            },
          }),
        );
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/paypal/verify`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .send({ orderId })
      .expect(403);

    const purchase = await purchaseRepo.findOne({
      where: {
        courseId: course.id,
        userId: buyerUser.id,
      },
    });

    expect(purchase).toBeNull();
  });

  it('POST /api/courses/:courseId/checkout?provider=paypal returns 501 when PayPal env vars missing', async () => {
    const prevClientId = process.env.PAYPAL_CLIENT_ID;
    const prevClientSecret = process.env.PAYPAL_CLIENT_SECRET;

    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;

    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'paypal-mock-checkout-not-configured-admin');
    await makeAdmin(adminEmail);

    const course = await createPaidCourseAsAdmin(adminToken);

    const buyerLogin = await registerAndLogin(
      app,
      'paypal-mock-checkout-not-configured-buyer',
    );

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/checkout?provider=paypal`)
      .set('Authorization', `Bearer ${buyerLogin.accessToken}`)
      .expect(501);

    process.env.PAYPAL_CLIENT_ID = prevClientId;
    process.env.PAYPAL_CLIENT_SECRET = prevClientSecret;
  });
});
