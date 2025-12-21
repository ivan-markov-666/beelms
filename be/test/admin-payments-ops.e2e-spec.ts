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
  const events = {
    retrieve: jest.fn(),
  };
  const webhooks = {
    constructEvent: jest.fn(),
  };

  const mockStripe = {
    checkout: {
      sessions,
    },
    events,
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

describe('Admin payments ops (e2e)', () => {
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
        description: 'Paid course for payments ops tests',
        language: 'bg',
        status: 'active',
        isPaid: true,
        currency: 'eur',
        priceCents: 999,
      })
      .expect(201);

    return createRes.body as CreatedCourse;
  };

  it('GET /api/admin/payments/webhook-events?status=failed lists failed webhook events and POST retry processes them', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'admin-payments-ops-admin');
    await makeAdmin(adminEmail);

    const course = await createPaidCourseAsAdmin(adminToken);

    const { email: buyerEmail } = await registerAndLogin(
      app,
      'admin-payments-ops-buyer',
    );

    const buyer = await userRepo.findOne({ where: { email: buyerEmail } });
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    const mockStripe = (
      Stripe as unknown as {
        __mockStripe?: {
          webhooks?: { constructEvent?: jest.Mock };
          events?: { retrieve?: jest.Mock };
        };
      }
    ).__mockStripe;
    if (
      !mockStripe?.webhooks?.constructEvent ||
      !mockStripe?.events?.retrieve
    ) {
      throw new Error('Stripe mock not found');
    }

    const eventId = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    mockStripe.webhooks.constructEvent.mockReturnValue({
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      },
    });

    await request(app.getHttpServer())
      .post('/api/payments/webhook')
      .set('stripe-signature', 'sig_mocked')
      .send({ any: 'payload' })
      .expect(400);

    const failedEvents = await request(app.getHttpServer())
      .get('/api/admin/payments/webhook-events?status=failed&limit=20')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(failedEvents.body)).toBe(true);
    expect(
      (failedEvents.body as Array<{ eventId: string }>).some(
        (e) => e.eventId === eventId,
      ),
    ).toBe(true);

    mockStripe.events.retrieve.mockResolvedValue({
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          metadata: {
            courseId: course.id,
            userId: buyer.id,
          },
          payment_intent: `pi_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          amount_total: 999,
          currency: 'eur',
        },
      },
    });

    const retryRes = await request(app.getHttpServer())
      .post(`/api/admin/payments/webhook-events/${eventId}/retry`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(201);

    const retryBody = retryRes.body as unknown as {
      status: 'processed' | 'failed';
      errorMessage: string | null;
    };

    expect(retryBody.status).toBe('processed');

    const purchase = await purchaseRepo.findOne({
      where: { userId: buyer.id, courseId: course.id },
    });

    expect(purchase).toBeTruthy();

    const updatedEvent = await webhookEventRepo.findOne({ where: { eventId } });
    expect(updatedEvent?.status).toBe('processed');
  });
});
