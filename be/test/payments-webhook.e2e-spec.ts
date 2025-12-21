import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { json } from 'body-parser';
import Stripe from 'stripe';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { CoursePurchase } from '../src/courses/course-purchase.entity';
import { StripeWebhookEvent } from '../src/payments/stripe-webhook-event.entity';
import { registerAndLogin } from './utils/auth-helpers';

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

describe('Payments webhook (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let purchaseRepo: Repository<CoursePurchase>;
  let webhookEventRepo: Repository<StripeWebhookEvent>;

  let originalStripeSecretKey: string | undefined;
  let originalStripeWebhookSecret: string | undefined;

  beforeAll(async () => {
    originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
    originalStripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    process.env.STRIPE_SECRET_KEY = 'sk_test_mocked';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mocked';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    app.use(
      json({
        limit: process.env.REQUEST_BODY_LIMIT ?? '1mb',
        verify: (
          req: unknown,
          _res: unknown,
          buf: Buffer,
          _encoding: string,
        ) => {
          void _encoding;
          (req as { rawBody?: Buffer }).rawBody = buf;
        },
      }),
    );

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
    webhookEventRepo = app.get<Repository<StripeWebhookEvent>>(
      getRepositoryToken(StripeWebhookEvent),
    );
  });

  afterAll(async () => {
    await app.close();

    if (originalStripeSecretKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    }

    if (originalStripeWebhookSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = originalStripeWebhookSecret;
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
        description: 'Paid course for webhook tests',
        language: 'bg',
        status: 'active',
        isPaid: true,
        currency: 'eur',
        priceCents: 999,
      })
      .expect(201);

    return createRes.body as CreatedCourse;
  };

  it('POST /api/payments/webhook records purchase for checkout.session.completed (idempotent)', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'webhook-admin');
    await makeAdmin(adminEmail);

    const course = await createPaidCourseAsAdmin(adminToken);

    const { email: buyerEmail, accessToken: buyerToken } =
      await registerAndLogin(app, 'webhook-buyer');

    const buyer = await userRepo.findOne({ where: { email: buyerEmail } });
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    const mockStripe = (
      Stripe as unknown as {
        __mockStripe?: {
          webhooks?: { constructEvent?: jest.Mock };
        };
      }
    ).__mockStripe;
    if (!mockStripe?.webhooks?.constructEvent) {
      throw new Error('Stripe webhook mock not found');
    }

    const uniqueSessionId = `cs_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const eventId = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    mockStripe.webhooks.constructEvent.mockReturnValue({
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: uniqueSessionId,
          metadata: {
            courseId: course.id,
            userId: buyer.id,
          },
          payment_intent: 'pi_test_1',
          amount_total: 999,
          currency: 'eur',
        },
      },
    });

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig_mocked')
      .send({ any: 'payload' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig_mocked')
      .send({ any: 'payload' })
      .expect(200);

    const statusRes = await request(app.getHttpServer())
      .get(`/api/payments/courses/${course.id}/purchase/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(statusRes.body).toEqual({ purchased: true });

    const purchases = await purchaseRepo.find({
      where: { userId: buyer.id, courseId: course.id },
    });

    expect(purchases.length).toBe(1);
    expect(purchases[0].stripeSessionId).toBe(uniqueSessionId);
    expect(purchases[0].stripePaymentIntentId).toBe('pi_test_1');
    expect(purchases[0].amountCents).toBe(999);
    expect(purchases[0].currency).toBe('eur');

    const webhookEvents = await webhookEventRepo.find({ where: { eventId } });
    expect(webhookEvents.length).toBe(1);
    expect(webhookEvents[0].status).toBe('processed');
  });

  it('POST /api/payments/webhook marks event failed and stores error when processing fails', async () => {
    const mockStripe = (
      Stripe as unknown as {
        __mockStripe?: {
          webhooks?: { constructEvent?: jest.Mock };
        };
      }
    ).__mockStripe;
    if (!mockStripe?.webhooks?.constructEvent) {
      throw new Error('Stripe webhook mock not found');
    }

    const eventId = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const sessionId = `cs_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    mockStripe.webhooks.constructEvent.mockReturnValue({
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          metadata: {},
          payment_intent: 'pi_test_fail_1',
          amount_total: 999,
          currency: 'eur',
        },
      },
    });

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig_mocked')
      .send({ any: 'payload' })
      .expect(400);

    const webhookEvents = await webhookEventRepo.find({ where: { eventId } });
    expect(webhookEvents.length).toBe(1);
    expect(webhookEvents[0].status).toBe('failed');
    expect(webhookEvents[0].errorMessage).toContain('Stripe session metadata');
    expect(webhookEvents[0].errorStack).toBeTruthy();
    expect(webhookEvents[0].eventPayload).toBeTruthy();
  });

  it('POST /api/payments/webhook dedupes by event id even if payload differs', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'webhook-dedupe-admin');
    await makeAdmin(adminEmail);

    const course = await createPaidCourseAsAdmin(adminToken);

    const { email: buyerEmail } = await registerAndLogin(
      app,
      'webhook-dedupe-buyer',
    );

    const buyer = await userRepo.findOne({ where: { email: buyerEmail } });
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    const mockStripe = (
      Stripe as unknown as {
        __mockStripe?: {
          webhooks?: { constructEvent?: jest.Mock };
        };
      }
    ).__mockStripe;
    if (!mockStripe?.webhooks?.constructEvent) {
      throw new Error('Stripe webhook mock not found');
    }

    const eventId = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const sessionId1 = `cs_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const sessionId2 = `cs_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    mockStripe.webhooks.constructEvent
      .mockReturnValueOnce({
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId1,
            metadata: {
              courseId: course.id,
              userId: buyer.id,
            },
            payment_intent: 'pi_test_dedupe_1',
            amount_total: 999,
            currency: 'eur',
          },
        },
      })
      .mockReturnValueOnce({
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId2,
            metadata: {
              courseId: course.id,
              userId: buyer.id,
            },
            payment_intent: 'pi_test_dedupe_2',
            amount_total: 999,
            currency: 'eur',
          },
        },
      });

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig_mocked')
      .send({ any: 'payload' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig_mocked')
      .send({ any: 'payload' })
      .expect(200);

    const purchases = await purchaseRepo.find({
      where: { userId: buyer.id, courseId: course.id },
    });

    expect(purchases.length).toBe(1);
    expect(purchases[0].stripeSessionId).toBe(sessionId1);

    const purchaseBySecondSession = await purchaseRepo.findOne({
      where: { stripeSessionId: sessionId2 },
    });
    expect(purchaseBySecondSession).toBeNull();

    const webhookEvents = await webhookEventRepo.find({ where: { eventId } });
    expect(webhookEvents.length).toBe(1);
    expect(webhookEvents[0].status).toBe('processed');
  });

  it('POST /api/payments/webhook returns 400 for invalid signature', async () => {
    const mockStripe = (
      Stripe as unknown as {
        __mockStripe?: {
          webhooks?: { constructEvent?: jest.Mock };
        };
      }
    ).__mockStripe;
    if (!mockStripe?.webhooks?.constructEvent) {
      throw new Error('Stripe webhook mock not found');
    }

    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig_bad')
      .send({ any: 'payload' })
      .expect(400);
  });
});
