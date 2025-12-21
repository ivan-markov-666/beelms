import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import Stripe from 'stripe';
import { Course } from '../courses/course.entity';
import { CoursePurchase } from '../courses/course-purchase.entity';
import { PaymentSettings } from './payment-settings.entity';
import { AdminUpdatePaymentSettingsDto } from './dto/admin-update-payment-settings.dto';
import { StripeWebhookEvent } from './stripe-webhook-event.entity';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null;
  private readonly frontendOrigin: string;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CoursePurchase)
    private readonly purchaseRepo: Repository<CoursePurchase>,
    @InjectRepository(PaymentSettings)
    private readonly settingsRepo: Repository<PaymentSettings>,
    @InjectRepository(StripeWebhookEvent)
    private readonly webhookEventRepo: Repository<StripeWebhookEvent>,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = stripeSecretKey?.trim()
      ? new Stripe(stripeSecretKey, {
          apiVersion: '2023-10-16',
        })
      : null;

    const origin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001';
    this.frontendOrigin = origin.replace(/\/$/, '');
  }

  async handleStripeWebhook(
    stripeSignature: string,
    rawBody: Buffer,
  ): Promise<void> {
    const stripe = this.getStripe();
    const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? '').trim();
    if (!webhookSecret) {
      throw new NotImplementedException(
        'Stripe webhook secret is not configured',
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        stripeSignature,
        webhookSecret,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(
        `Stripe webhook signature verification failed: ${JSON.stringify({ message })}`,
      );
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const existingEvent = await this.ensureWebhookEventRecord(event);
    if (existingEvent.status === 'processed') {
      this.logger.debug(
        `Stripe webhook event ignored (already processed): ${JSON.stringify({ eventId: event.id, eventType: event.type })}`,
      );
      return;
    }

    if (
      event.type === 'charge.refunded' ||
      event.type === 'charge.dispute.created'
    ) {
      await this.handleChargeRelatedRevocation(event, existingEvent.id);
      return;
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      const session = this.getCheckoutSessionFromEvent(event);
      const courseId = session?.metadata?.courseId;
      const userId = session?.metadata?.userId;

      if (!courseId || !userId) {
        this.logger.warn(
          `Stripe webhook missing metadata: ${JSON.stringify({ eventId: event.id, eventType: event.type, sessionId: session?.id ?? 'unknown' })}`,
        );
      }

      await this.markWebhookEventFailed(
        existingEvent.id,
        new Error('Stripe async payment failed'),
      );
      return;
    }

    const isSuccessCheckoutEvent =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded';

    if (!isSuccessCheckoutEvent) {
      this.logger.debug(
        `Stripe webhook event ignored (unsupported type): ${JSON.stringify({ eventId: event.id, eventType: event.type })}`,
      );
      await this.markWebhookEventProcessed(existingEvent.id);
      return;
    }

    try {
      const session = this.getCheckoutSessionFromEvent(event);
      if (!session) {
        throw new BadRequestException('Stripe session payload missing');
      }

      const courseId = session.metadata?.courseId;
      const userId = session.metadata?.userId;

      if (!courseId || !userId) {
        this.logger.warn(
          `Stripe webhook missing metadata: ${JSON.stringify({ eventId: event.id, eventType: event.type, sessionId: session.id })}`,
        );
        throw new BadRequestException('Stripe session metadata missing');
      }

      const existingBySession = await this.purchaseRepo.findOne({
        where: { stripeSessionId: session.id },
      });
      if (existingBySession) {
        if (
          existingBySession.courseId === courseId &&
          existingBySession.userId === userId
        ) {
          this.logger.debug(
            `Stripe webhook ignored (session already processed): ${JSON.stringify({ eventId: event.id, eventType: event.type, sessionId: session.id })}`,
          );
          await this.markWebhookEventProcessed(existingEvent.id);
          return;
        }

        throw new BadRequestException('Stripe session already processed');
      }

      const course = await this.courseRepo.findOne({ where: { id: courseId } });
      if (!course || course.status !== 'active') {
        throw new NotFoundException('Course not found');
      }

      if (!course.isPaid) {
        throw new BadRequestException('Course is not paid');
      }

      const existing = await this.purchaseRepo.findOne({
        where: { userId, courseId, revokedAt: IsNull() },
      });
      if (existing) {
        this.logger.debug(
          `Stripe webhook ignored (purchase already exists): ${JSON.stringify({ eventId: event.id, eventType: event.type, sessionId: session.id, courseId, userId })}`,
        );
        await this.markWebhookEventProcessed(existingEvent.id);
        return;
      }

      const revokedExisting = await this.purchaseRepo.findOne({
        where: { userId, courseId },
      });

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : null;

      const amountCents =
        typeof session.amount_total === 'number' ? session.amount_total : null;
      const currency =
        typeof session.currency === 'string' ? session.currency : null;

      if (revokedExisting && revokedExisting.revokedAt) {
        revokedExisting.source = 'stripe';
        revokedExisting.grantedByUserId = null;
        revokedExisting.grantReason = null;
        revokedExisting.revokedAt = null;
        revokedExisting.revokedReason = null;
        revokedExisting.revokedEventId = null;
        revokedExisting.stripeSessionId = session.id;
        revokedExisting.stripePaymentIntentId = paymentIntentId;
        revokedExisting.amountCents = amountCents;
        revokedExisting.currency = currency;
        await this.purchaseRepo.save(revokedExisting);
      } else {
        await this.purchaseRepo.save(
          this.purchaseRepo.create({
            userId,
            courseId,
            source: 'stripe',
            grantedByUserId: null,
            grantReason: null,
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            amountCents,
            currency,
          }),
        );
      }

      this.logger.log(
        `Stripe webhook purchase recorded: ${JSON.stringify({ eventId: event.id, eventType: event.type, sessionId: session.id, courseId, userId })}`,
      );
      await this.markWebhookEventProcessed(existingEvent.id);
    } catch (err: unknown) {
      await this.markWebhookEventFailed(existingEvent.id, err);
      throw err;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getCheckoutSessionFromEvent(
    event: Stripe.Event,
  ): Stripe.Checkout.Session | null {
    const data = event.data as unknown as { object?: unknown } | undefined;
    const obj = data?.object;

    if (!this.isRecord(obj)) {
      return null;
    }

    const id = obj['id'];
    if (typeof id !== 'string' || id.trim().length === 0) {
      return null;
    }

    return obj as unknown as Stripe.Checkout.Session;
  }

  private sanitizeWebhookEvent(event: Stripe.Event): Record<string, unknown> {
    const data = event.data as unknown as { object?: unknown } | undefined;
    const rawObj = data?.object;
    const obj = this.isRecord(rawObj) ? rawObj : {};

    const safeObject: Record<string, unknown> = {};
    const allowedKeys = [
      'id',
      'metadata',
      'payment_intent',
      'amount_total',
      'currency',
      'payment_status',
    ];

    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        safeObject[key] = obj[key];
      }
    }

    return {
      id: event.id,
      type: event.type,
      created: event.created,
      livemode: event.livemode,
      api_version: event.api_version ?? null,
      data: {
        object: safeObject,
      },
    };
  }

  private async ensureWebhookEventRecord(
    event: Stripe.Event,
  ): Promise<StripeWebhookEvent> {
    const existing = await this.webhookEventRepo.findOne({
      where: { eventId: event.id },
    });
    if (existing) {
      return existing;
    }

    try {
      return await this.webhookEventRepo.save(
        this.webhookEventRepo.create({
          eventId: event.id,
          eventType: event.type,
          status: 'received',
          errorMessage: null,
          errorStack: null,
          eventPayload: this.sanitizeWebhookEvent(event),
          processedAt: null,
        }),
      );
    } catch (e: unknown) {
      if (e instanceof QueryFailedError) {
        const maybeCode = (e as unknown as { code?: string }).code;
        if (maybeCode === '23505') {
          const createdByOther = await this.webhookEventRepo.findOne({
            where: { eventId: event.id },
          });
          if (createdByOther) {
            return createdByOther;
          }
        }
      }

      throw e;
    }
  }

  private async markWebhookEventProcessed(id: string): Promise<void> {
    await this.webhookEventRepo.update(
      { id },
      {
        status: 'processed',
        processedAt: new Date(),
        errorMessage: null,
        errorStack: null,
      },
    );
  }

  private async markWebhookEventFailed(
    id: string,
    err: unknown,
  ): Promise<void> {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? (err.stack ?? null) : null;

    this.logger.error(
      `Stripe webhook processing failed: ${JSON.stringify({ webhookEventId: id, message })}`,
      stack ?? undefined,
    );

    await this.webhookEventRepo.update(
      { id },
      {
        status: 'failed',
        processedAt: new Date(),
        errorMessage: message,
        errorStack: stack,
      },
    );
  }

  async hasPurchased(userId: string, courseId: string): Promise<boolean> {
    const existing = await this.purchaseRepo.findOne({
      where: { userId, courseId, revokedAt: IsNull() },
    });
    return !!existing;
  }

  private getPaymentIntentIdFromEventObject(
    event: Stripe.Event,
  ): string | null {
    const data = event.data as unknown as { object?: unknown } | undefined;
    const obj = data?.object;
    if (!this.isRecord(obj)) {
      return null;
    }

    const raw = obj['payment_intent'];
    return typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
  }

  private async handleChargeRelatedRevocation(
    event: Stripe.Event,
    webhookEventId: string,
  ): Promise<void> {
    const paymentIntentId = this.getPaymentIntentIdFromEventObject(event);
    if (!paymentIntentId) {
      await this.markWebhookEventFailed(
        webhookEventId,
        new Error('Stripe charge event missing payment_intent'),
      );
      return;
    }

    const purchase = await this.purchaseRepo.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!purchase) {
      await this.markWebhookEventFailed(
        webhookEventId,
        new Error('Purchase not found for payment_intent'),
      );
      return;
    }

    if (!purchase.revokedAt) {
      purchase.revokedAt = new Date();
      purchase.revokedReason = event.type;
      purchase.revokedEventId = event.id;
      await this.purchaseRepo.save(purchase);
    }

    await this.markWebhookEventProcessed(webhookEventId);
  }

  getSupportedCurrencies(): string[] {
    try {
      const supportedValuesOf = (
        Intl as unknown as {
          supportedValuesOf?: (key: string) => string[];
        }
      ).supportedValuesOf;

      if (typeof supportedValuesOf === 'function') {
        return supportedValuesOf('currency')
          .map((c) => c.toLowerCase())
          .sort();
      }
    } catch {
      // ignore
    }

    return [
      'eur',
      'usd',
      'gbp',
      'bgn',
      'ron',
      'try',
      'chf',
      'sek',
      'nok',
      'dkk',
      'pln',
      'czk',
      'huf',
    ];
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const existing = await this.settingsRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (existing.length > 0) {
      return existing[0];
    }

    const created = this.settingsRepo.create({
      currency: 'eur',
      priceCents: 999,
    });
    return this.settingsRepo.save(created);
  }

  async updatePaymentSettings(
    dto: AdminUpdatePaymentSettingsDto,
  ): Promise<void> {
    const settings = await this.getPaymentSettings();

    if (dto.currency !== undefined) {
      const nextCurrency = (dto.currency ?? '').trim().toLowerCase();
      if (!/^[a-z]{3}$/.test(nextCurrency)) {
        throw new BadRequestException('Invalid currency');
      }

      settings.currency = nextCurrency;
    }

    if (dto.priceCents !== undefined) {
      const nextPriceCents = Number(dto.priceCents);
      if (!Number.isFinite(nextPriceCents) || nextPriceCents < 1) {
        throw new BadRequestException('Invalid priceCents');
      }

      settings.priceCents = Math.round(nextPriceCents);
    }

    await this.settingsRepo.save(settings);
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new NotImplementedException('Stripe is not configured');
    }

    return this.stripe;
  }

  async createCheckoutSession(
    userId: string,
    courseId: string,
  ): Promise<string> {
    const stripe = this.getStripe();

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPaid) {
      throw new BadRequestException('Course is not paid');
    }

    const settings = await this.getPaymentSettings();

    const currency = (
      course.currency ||
      settings.currency ||
      'eur'
    ).toLowerCase();
    const priceCentsRaw =
      typeof course.priceCents === 'number' && course.priceCents > 0
        ? course.priceCents
        : typeof settings.priceCents === 'number' && settings.priceCents > 0
          ? settings.priceCents
          : Number(process.env.STRIPE_COURSE_PRICE_CENTS ?? 999);

    if (!/^[a-z]{3}$/.test(currency)) {
      throw new BadRequestException('Invalid Stripe currency configuration');
    }

    const priceCents = Number(priceCentsRaw);

    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      throw new BadRequestException(
        'Invalid Stripe course price configuration',
      );
    }

    const successUrl = `${this.frontendOrigin}/courses/${course.id}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.frontendOrigin}/courses/${course.id}/checkout/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        courseId: course.id,
        userId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: priceCents,
            product_data: {
              name: course.title,
            },
          },
        },
      ],
    });

    if (!session.url) {
      throw new BadRequestException('Stripe session url not available');
    }

    return session.url;
  }

  async verifyCheckoutSessionAndRecordPurchase(
    userId: string,
    courseId: string,
    sessionId: string,
  ): Promise<void> {
    const stripe = this.getStripe();

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPaid) {
      throw new BadRequestException('Course is not paid');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const metaCourseId = session.metadata?.courseId;
    const metaUserId = session.metadata?.userId;

    if (metaCourseId !== courseId || metaUserId !== userId) {
      throw new ForbiddenException(
        'Stripe session does not match this user/course',
      );
    }

    if (session.payment_status !== 'paid') {
      throw new ForbiddenException('Payment not completed');
    }

    const existing = await this.purchaseRepo.findOne({
      where: { userId, courseId },
    });

    if (existing) {
      return;
    }

    const purchase = this.purchaseRepo.create({
      userId,
      courseId,
      source: 'stripe',
      grantedByUserId: null,
      grantReason: null,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : null,
      amountCents:
        typeof session.amount_total === 'number' ? session.amount_total : null,
      currency: typeof session.currency === 'string' ? session.currency : null,
    });

    await this.purchaseRepo.save(purchase);
  }
}
