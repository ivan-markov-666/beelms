import {
  BadRequestException,
  ForbiddenException,
  NotImplementedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { Course } from '../courses/course.entity';
import { CoursePurchase } from '../courses/course-purchase.entity';
import { PaymentSettings } from './payment-settings.entity';
import { PaymentsService } from './payments.service';
import { PaymentCheckout } from './payment-checkout.entity';
import { StripeWebhookEvent } from './stripe-webhook-event.entity';

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

type MockRepo = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update?: jest.Mock;
};

describe('PaymentsService (PayPal)', () => {
  let service: PaymentsService;

  let courseRepo: MockRepo;
  let purchaseRepo: MockRepo;
  let settingsRepo: MockRepo;
  let webhookEventRepo: MockRepo;
  let checkoutRepo: MockRepo;

  let originalEnv: NodeJS.ProcessEnv;
  let originalFetch: typeof global.fetch | undefined;

  const makeFetchResponse = (args: {
    ok: boolean;
    status?: number;
    json: unknown;
  }): Response => {
    return {
      ok: args.ok,
      status: args.status ?? (args.ok ? 200 : 400),
      json: async () => args.json,
    } as unknown as Response;
  };

  beforeEach(async () => {
    originalEnv = { ...process.env };
    originalFetch = global.fetch;

    process.env.STRIPE_SECRET_KEY = '';

    process.env.PAYPAL_MODE = 'sandbox';
    process.env.PAYPAL_CLIENT_ID = 'paypal_client_id';
    process.env.PAYPAL_CLIENT_SECRET = 'paypal_client_secret';
    process.env.FRONTEND_ORIGIN = 'http://localhost:3001';

    courseRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((e) => e),
      save: jest.fn(),
    };

    purchaseRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((e) => e),
      save: jest.fn(),
    };

    settingsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((e) => e),
      save: jest.fn(),
    };

    webhookEventRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((e) => e),
      save: jest.fn(),
      update: jest.fn(),
    };

    checkoutRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((e) => e),
      save: jest.fn(),
    };

    (settingsRepo.find as jest.Mock).mockResolvedValue([
      {
        currency: 'eur',
        priceCents: 999,
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepo,
        },
        {
          provide: getRepositoryToken(CoursePurchase),
          useValue: purchaseRepo,
        },
        {
          provide: getRepositoryToken(PaymentSettings),
          useValue: settingsRepo,
        },
        {
          provide: getRepositoryToken(StripeWebhookEvent),
          useValue: webhookEventRepo,
        },
        {
          provide: getRepositoryToken(PaymentCheckout),
          useValue: checkoutRepo,
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  afterEach(() => {
    process.env = originalEnv;

    if (originalFetch === undefined) {
      delete (global as unknown as { fetch?: unknown }).fetch;
    } else {
      global.fetch = originalFetch;
    }
  });

  it('createPaypalCheckoutUrl returns approval url (happy path)', async () => {
    const userId = 'user-1';
    const courseId = 'course-1';

    (courseRepo.findOne as jest.Mock).mockResolvedValue({
      id: courseId,
      status: 'active',
      isPaid: true,
      title: 'Course title',
      currency: 'eur',
      priceCents: 1234,
    });

    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/v1/oauth2/token')) {
        expect(init?.method).toBe('POST');
        return makeFetchResponse({
          ok: true,
          json: { access_token: 'AT', expires_in: 3600 },
        });
      }

      if (url.includes('/v2/checkout/orders')) {
        expect(init?.method).toBe('POST');

        const bodyText = typeof init?.body === 'string' ? init.body : '{}';
        const body = JSON.parse(bodyText) as {
          application_context?: { return_url?: string; cancel_url?: string };
          purchase_units?: Array<{ custom_id?: string; amount?: unknown }>;
        };

        expect(body.application_context?.return_url).toBe(
          `http://localhost:3001/courses/${courseId}/checkout/paypal/success`,
        );
        expect(body.application_context?.cancel_url).toBe(
          `http://localhost:3001/courses/${courseId}/checkout/paypal/cancel`,
        );

        const customRaw = body.purchase_units?.[0]?.custom_id;
        expect(customRaw).toBeDefined();
        const custom = JSON.parse(customRaw as string) as {
          courseId?: string;
          userId?: string;
        };
        expect(custom.courseId).toBe(courseId);
        expect(custom.userId).toBe(userId);

        return makeFetchResponse({
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
        });
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    const url = await service.createPaypalCheckoutUrl(userId, courseId);
    expect(url).toBe('https://paypal.test/approve/ORDER_ID_1');
  });

  it('createPaypalCheckoutUrl throws when PayPal is not configured', async () => {
    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepo,
        },
        {
          provide: getRepositoryToken(CoursePurchase),
          useValue: purchaseRepo,
        },
        {
          provide: getRepositoryToken(PaymentSettings),
          useValue: settingsRepo,
        },
        {
          provide: getRepositoryToken(StripeWebhookEvent),
          useValue: webhookEventRepo,
        },
        {
          provide: getRepositoryToken(PaymentCheckout),
          useValue: checkoutRepo,
        },
      ],
    }).compile();

    const svc = module.get(PaymentsService);

    await expect(svc.createPaypalCheckoutUrl('u', 'c')).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  it('capturePaypalOrderAndRecordPurchase records CoursePurchase (happy path)', async () => {
    const userId = 'user-1';
    const courseId = 'course-1';
    const orderId = 'ORDER_ID_1';

    (courseRepo.findOne as jest.Mock).mockResolvedValue({
      id: courseId,
      status: 'active',
      isPaid: true,
      title: 'Course title',
      currency: 'eur',
      priceCents: 1234,
    });

    // 1) existingByOrder
    // 2) existing active purchase
    // 3) revokedExisting check
    (purchaseRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes('/v1/oauth2/token')) {
        return makeFetchResponse({
          ok: true,
          json: { access_token: 'AT', expires_in: 3600 },
        });
      }

      if (
        url.includes(
          `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        )
      ) {
        return makeFetchResponse({
          ok: true,
          json: {
            status: 'COMPLETED',
            purchase_units: [
              {
                custom_id: JSON.stringify({ courseId, userId }),
                amount: { currency_code: 'EUR', value: '12.34' },
                payments: {
                  captures: [{ id: 'CAPTURE_1', status: 'COMPLETED' }],
                },
              },
            ],
          },
        });
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    await service.capturePaypalOrderAndRecordPurchase(
      userId,
      courseId,
      orderId,
    );

    expect(purchaseRepo.create).toHaveBeenCalledTimes(1);
    expect(purchaseRepo.save).toHaveBeenCalledTimes(1);

    const saved = (purchaseRepo.save as jest.Mock).mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;

    expect(saved['source']).toBe('paypal');
    expect(saved['userId']).toBe(userId);
    expect(saved['courseId']).toBe(courseId);
    expect(saved['paypalOrderId']).toBe(orderId);
    expect(saved['paypalCaptureId']).toBe('CAPTURE_1');
    expect(saved['amountCents']).toBe(1234);
    expect(saved['currency']).toBe('eur');

    expect(purchaseRepo.findOne).toHaveBeenCalledWith({
      where: { paypalOrderId: orderId },
    });

    expect(purchaseRepo.findOne).toHaveBeenCalledWith({
      where: { userId, courseId, revokedAt: IsNull() },
    });
  });

  it('capturePaypalOrderAndRecordPurchase throws 403 for custom_id mismatch', async () => {
    const userId = 'user-1';
    const courseId = 'course-1';
    const orderId = 'ORDER_ID_1';

    (courseRepo.findOne as jest.Mock).mockResolvedValue({
      id: courseId,
      status: 'active',
      isPaid: true,
      title: 'Course title',
      currency: 'eur',
      priceCents: 1234,
    });

    (purchaseRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes('/v1/oauth2/token')) {
        return makeFetchResponse({
          ok: true,
          json: { access_token: 'AT', expires_in: 3600 },
        });
      }

      if (
        url.includes(
          `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        )
      ) {
        return makeFetchResponse({
          ok: true,
          json: {
            status: 'COMPLETED',
            purchase_units: [
              {
                custom_id: JSON.stringify({ courseId, userId: 'other-user' }),
                amount: { currency_code: 'EUR', value: '12.34' },
              },
            ],
          },
        });
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(
      service.capturePaypalOrderAndRecordPurchase(userId, courseId, orderId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(purchaseRepo.save).not.toHaveBeenCalled();
  });

  it('capturePaypalOrderAndRecordPurchase throws 400 when capture fails', async () => {
    const userId = 'user-1';
    const courseId = 'course-1';
    const orderId = 'ORDER_ID_1';

    (courseRepo.findOne as jest.Mock).mockResolvedValue({
      id: courseId,
      status: 'active',
      isPaid: true,
      title: 'Course title',
      currency: 'eur',
      priceCents: 1234,
    });

    (purchaseRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes('/v1/oauth2/token')) {
        return makeFetchResponse({
          ok: true,
          json: { access_token: 'AT', expires_in: 3600 },
        });
      }

      if (
        url.includes(
          `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        )
      ) {
        return makeFetchResponse({
          ok: false,
          status: 500,
          json: { name: 'INTERNAL_SERVER_ERROR' },
        });
      }

      throw new Error(`Unexpected fetch url: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(
      service.capturePaypalOrderAndRecordPurchase(userId, courseId, orderId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
