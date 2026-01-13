import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import Stripe from 'stripe';
import { Course } from '../courses/course.entity';
import { CoursePurchase } from '../courses/course-purchase.entity';
import { PaymentSettings } from './payment-settings.entity';
import { AdminUpdatePaymentSettingsDto } from './dto/admin-update-payment-settings.dto';
import { PaymentCheckout } from './payment-checkout.entity';
import {
  StripeWebhookEvent,
  StripeWebhookEventStatus,
} from './stripe-webhook-event.entity';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null;
  private readonly frontendOrigin: string;
  private readonly backendOrigin: string;
  private readonly logger = new Logger(PaymentsService.name);

  private paypalAccessToken: { value: string; expiresAtMs: number } | null =
    null;
  private readonly paypalBaseUrl: string | null;

  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CoursePurchase)
    private readonly purchaseRepo: Repository<CoursePurchase>,
    @InjectRepository(PaymentSettings)
    private readonly settingsRepo: Repository<PaymentSettings>,
    @InjectRepository(StripeWebhookEvent)
    private readonly webhookEventRepo: Repository<StripeWebhookEvent>,
    @InjectRepository(PaymentCheckout)
    private readonly checkoutRepo: Repository<PaymentCheckout>,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = stripeSecretKey?.trim()
      ? new Stripe(stripeSecretKey, {
          apiVersion: '2023-10-16',
        })
      : null;

    const origin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001';
    this.frontendOrigin = origin.replace(/\/$/, '');

    const backendOriginRaw =
      process.env.BACKEND_PUBLIC_ORIGIN ??
      process.env.BACKEND_ORIGIN ??
      `http://localhost:${process.env.PORT ?? 3000}`;
    this.backendOrigin = backendOriginRaw.trim().replace(/\/$/, '');

    const paypalMode = (process.env.PAYPAL_MODE ?? 'sandbox')
      .trim()
      .toLowerCase();
    const paypalConfigured =
      (process.env.PAYPAL_CLIENT_ID ?? '').trim().length > 0 &&
      (process.env.PAYPAL_CLIENT_SECRET ?? '').trim().length > 0;

    if (paypalConfigured) {
      this.paypalBaseUrl =
        paypalMode === 'live'
          ? 'https://api-m.paypal.com'
          : 'https://api-m.sandbox.paypal.com';
    } else {
      this.paypalBaseUrl = null;
    }
  }

  private async getPaypalAccessToken(): Promise<string> {
    if (!this.paypalBaseUrl) {
      throw new NotImplementedException('PayPal is not configured');
    }

    const cached = this.paypalAccessToken;
    if (cached && cached.expiresAtMs - Date.now() > 30_000) {
      return cached.value;
    }

    const clientId = (process.env.PAYPAL_CLIENT_ID ?? '').trim();
    const clientSecret = (process.env.PAYPAL_CLIENT_SECRET ?? '').trim();
    if (!clientId || !clientSecret) {
      throw new NotImplementedException('PayPal is not configured');
    }

    const body = new URLSearchParams({ grant_type: 'client_credentials' });
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(`${this.paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      throw new NotImplementedException('PayPal token request failed');
    }

    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    const token = (json.access_token ?? '').trim();
    const expiresIn = Number(json.expires_in ?? 0);
    if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new NotImplementedException('PayPal token response invalid');
    }

    this.paypalAccessToken = {
      value: token,
      expiresAtMs: Date.now() + expiresIn * 1000,
    };
    return token;
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

    await this.processStripeEvent(event, { throwOnError: true });
  }

  private async processStripeEvent(
    event: Stripe.Event,
    options: { throwOnError: boolean },
  ): Promise<'processed' | 'failed'> {
    const existingEvent = await this.ensureWebhookEventRecord(event);
    if (existingEvent.status === 'processed') {
      this.logger.debug(
        `Stripe event ignored (already processed): ${JSON.stringify({ eventId: event.id, eventType: event.type })}`,
      );
      return 'processed';
    }

    if (
      event.type === 'charge.refunded' ||
      event.type === 'charge.dispute.created'
    ) {
      await this.handleChargeRelatedRevocation(event, existingEvent.id);
      const updated = await this.webhookEventRepo.findOne({
        where: { id: existingEvent.id },
      });
      return updated?.status === 'failed' ? 'failed' : 'processed';
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
      return 'failed';
    }

    const isSuccessCheckoutEvent =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded';

    if (!isSuccessCheckoutEvent) {
      this.logger.debug(
        `Stripe event ignored (unsupported type): ${JSON.stringify({ eventId: event.id, eventType: event.type })}`,
      );
      await this.markWebhookEventProcessed(existingEvent.id);
      return 'processed';
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
            `Stripe event ignored (session already processed): ${JSON.stringify({ eventId: event.id, eventType: event.type, sessionId: session.id })}`,
          );
          await this.markWebhookEventProcessed(existingEvent.id);
          return 'processed';
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
          `Stripe event ignored (purchase already exists): ${JSON.stringify({ eventId: event.id, eventType: event.type, sessionId: session.id, courseId, userId })}`,
        );
        await this.markWebhookEventProcessed(existingEvent.id);
        return 'processed';
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
      return 'processed';
    } catch (err: unknown) {
      await this.markWebhookEventFailed(existingEvent.id, err);
      if (options.throwOnError) {
        throw err;
      }
      return 'failed';
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

  async listWebhookEvents(params: {
    status?: StripeWebhookEventStatus;
    limit?: number;
  }): Promise<StripeWebhookEvent[]> {
    const where: { status?: StripeWebhookEventStatus } = {};
    if (params.status) {
      where.status = params.status;
    }

    const take =
      typeof params.limit === 'number' && params.limit > 0
        ? Math.min(params.limit, 200)
        : 50;

    return this.webhookEventRepo.find({
      where,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async retryWebhookEvent(eventId: string): Promise<{
    status: 'processed' | 'failed';
    errorMessage: string | null;
  }> {
    const existing = await this.webhookEventRepo.findOne({
      where: { eventId },
    });

    if (!existing) {
      throw new NotFoundException('Webhook event not found');
    }

    if (existing.status === 'processed') {
      return { status: 'processed', errorMessage: null };
    }

    try {
      const stripe = this.getStripe();
      const retrieved = await stripe.events.retrieve(eventId);
      await this.processStripeEvent(retrieved, { throwOnError: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      await this.markWebhookEventFailed(existing.id, new Error(message));
    }

    const updated = await this.webhookEventRepo.findOne({
      where: { eventId },
    });

    return {
      status: updated?.status === 'failed' ? 'failed' : 'processed',
      errorMessage: updated?.errorMessage ?? null,
    };
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

  private normalizeMyposCurrency(currency: string): string {
    return currency.trim().toUpperCase();
  }

  private getRevolutConfig(): {
    baseUrl: string;
    apiKey: string;
    apiVersion: string;
    webhookSigningSecret: string;
  } {
    const modeRaw = (process.env.REVOLUT_MODE ?? 'sandbox')
      .trim()
      .toLowerCase();
    const defaultBaseUrl =
      modeRaw === 'live'
        ? 'https://merchant.revolut.com'
        : 'https://sandbox-merchant.revolut.com';

    const baseUrl =
      (process.env.REVOLUT_BASE_URL ?? '').trim() || defaultBaseUrl;
    const apiKey = (process.env.REVOLUT_API_KEY ?? '').trim();
    const apiVersion =
      (process.env.REVOLUT_API_VERSION ?? '').trim() || '2025-12-04';
    const webhookSigningSecret = (
      process.env.REVOLUT_WEBHOOK_SIGNING_SECRET ??
      process.env.REVOLUT_WEBHOOK_SECRET ??
      ''
    ).trim();

    if (!apiKey) {
      throw new NotImplementedException('Revolut is not configured');
    }

    return {
      baseUrl: baseUrl.replace(/\/$/, ''),
      apiKey,
      apiVersion,
      webhookSigningSecret,
    };
  }

  private parseRevolutTimestampMs(timestamp: string): number {
    const num = Number(timestamp);
    if (!Number.isFinite(num) || num <= 0) {
      throw new BadRequestException('Invalid Revolut-Request-Timestamp');
    }
    return num < 1_000_000_000_000 ? num * 1000 : num;
  }

  private computeRevolutSignature(params: {
    signingSecret: string;
    timestamp: string;
    rawBody: Buffer;
  }): string {
    const normalizedRawPayload = this.stripJsonWhitespaceOutsideStrings(
      params.rawBody.toString('utf8'),
    );
    const payloadToSign = `v1.${params.timestamp}.${normalizedRawPayload}`;
    const digest = crypto
      .createHmac('sha256', params.signingSecret)
      .update(payloadToSign, 'utf8')
      .digest('hex');
    return `v1=${digest}`;
  }

  private stripJsonWhitespaceOutsideStrings(input: string): string {
    let out = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];

      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }

      if (ch === '"') {
        out += ch;
        inString = !inString;
        continue;
      }

      if (!inString && /\s/.test(ch)) {
        continue;
      }

      out += ch;
    }

    return out;
  }

  private isRevolutSignatureValid(params: {
    headerValue: string;
    expected: string;
  }): boolean {
    const expectedBuf = Buffer.from(params.expected, 'utf8');

    const candidates = params.headerValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const candidate of candidates) {
      const candidateBuf = Buffer.from(candidate, 'utf8');
      if (candidateBuf.length !== expectedBuf.length) {
        continue;
      }
      if (crypto.timingSafeEqual(candidateBuf, expectedBuf)) {
        return true;
      }
    }

    return false;
  }

  private getMyposConfig(): {
    sid: string;
    walletNumber: string;
    keyIndex: string;
    privateKeyPem: string;
    apiPublicCertPem: string;
    checkoutUrl: string;
  } {
    const modeRaw = (process.env.MYPOS_MODE ?? 'sandbox').trim().toLowerCase();
    const defaultCheckoutUrl =
      modeRaw === 'live'
        ? 'https://mypos.com/vmp/checkout/'
        : 'https://mypos.com/vmp/checkout-test/';

    const sid = (process.env.MYPOS_SID ?? '').trim();
    const walletNumber = (process.env.MYPOS_WALLET_NUMBER ?? '').trim();
    const keyIndex = (process.env.MYPOS_KEY_INDEX ?? '').trim();
    const privateKeyPem = (process.env.MYPOS_PRIVATE_KEY ?? '').trim();
    const apiPublicCertPem = (process.env.MYPOS_API_PUBLIC_CERT ?? '').trim();
    const checkoutUrlRaw =
      (process.env.MYPOS_CHECKOUT_URL ?? '').trim() || defaultCheckoutUrl;

    if (
      !sid ||
      !walletNumber ||
      !keyIndex ||
      !privateKeyPem ||
      !apiPublicCertPem
    ) {
      throw new NotImplementedException('myPOS is not configured');
    }

    const checkoutUrl = checkoutUrlRaw.trim();
    return {
      sid,
      walletNumber,
      keyIndex,
      privateKeyPem,
      apiPublicCertPem,
      checkoutUrl,
    };
  }

  private myposSign(values: string[], privateKeyPem: string): string {
    const concatenated = values.join('-');
    const concData = Buffer.from(concatenated, 'utf8').toString('base64');
    const signature = crypto.sign(
      'RSA-SHA256',
      Buffer.from(concData, 'utf8'),
      privateKeyPem,
    );
    return signature.toString('base64');
  }

  private myposVerify(
    values: string[],
    signatureBase64: string,
    apiPublicCertPem: string,
  ): boolean {
    const concatenated = values.join('-');
    const concData = Buffer.from(concatenated, 'utf8').toString('base64');
    return crypto.verify(
      'RSA-SHA256',
      Buffer.from(concData, 'utf8'),
      apiPublicCertPem,
      Buffer.from(signatureBase64, 'base64'),
    );
  }

  private parseUrlEncodedPairs(
    rawBody: Buffer,
  ): Array<{ key: string; value: string }> {
    const text = rawBody.toString('utf8');
    if (!text) {
      return [];
    }

    const pairs: Array<{ key: string; value: string }> = [];
    for (const part of text.split('&')) {
      if (!part) {
        continue;
      }
      const idx = part.indexOf('=');
      const rawKey = idx >= 0 ? part.slice(0, idx) : part;
      const rawValue = idx >= 0 ? part.slice(idx + 1) : '';
      const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
      const value = decodeURIComponent(rawValue.replace(/\+/g, ' '));
      pairs.push({ key, value });
    }
    return pairs;
  }

  private getParamValue(
    pairs: Array<{ key: string; value: string }>,
    key: string,
  ): string | null {
    const lowerKey = key.toLowerCase();
    const found = pairs.find((p) => p.key.toLowerCase() === lowerKey);
    return found ? found.value : null;
  }

  async createMyposCheckoutUrl(
    userId: string,
    courseId: string,
  ): Promise<string> {
    this.getMyposConfig();

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPaid) {
      throw new BadRequestException('Course is not paid');
    }

    const settings = await this.getPaymentSettings();
    const currency = this.normalizeMyposCurrency(
      course.currency || settings.currency || 'eur',
    );
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestException('Invalid myPOS currency configuration');
    }

    const priceCentsRaw =
      typeof course.priceCents === 'number' && course.priceCents > 0
        ? course.priceCents
        : typeof settings.priceCents === 'number' && settings.priceCents > 0
          ? settings.priceCents
          : 999;

    const amountCents = Number(priceCentsRaw);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new BadRequestException('Invalid myPOS course price configuration');
    }

    const externalOrderId = crypto.randomUUID();
    const created = await this.checkoutRepo.save(
      this.checkoutRepo.create({
        provider: 'mypos',
        courseId: course.id,
        userId,
        externalOrderId,
        status: 'created',
        amountCents: Math.round(amountCents),
        currency: currency.toLowerCase(),
        myposTrnref: null,
      }),
    );

    return `${this.backendOrigin}/api/payments/mypos/redirect/${created.id}`;
  }

  async buildMyposRedirectHtml(checkoutId: string): Promise<string> {
    const cfg = this.getMyposConfig();
    const checkout = await this.checkoutRepo.findOne({
      where: { id: checkoutId },
    });
    if (!checkout || checkout.provider !== 'mypos') {
      throw new NotFoundException('Checkout not found');
    }

    if (checkout.status !== 'created') {
      throw new BadRequestException('Checkout is not active');
    }

    const amount = (checkout.amountCents / 100).toFixed(2);
    const currency = this.normalizeMyposCurrency(checkout.currency);

    const urlOk = `${this.frontendOrigin}/courses/${checkout.courseId}/checkout/mypos/success?checkout_id=${encodeURIComponent(checkout.id)}`;
    const urlCancel = `${this.frontendOrigin}/courses/${checkout.courseId}/checkout/mypos/cancel?checkout_id=${encodeURIComponent(checkout.id)}`;
    const urlNotify = `${this.backendOrigin}/api/payments/mypos/notify`;

    const orderedParams: Array<{ key: string; value: string }> = [
      { key: 'IPCmethod', value: 'IPCPurchase' },
      { key: 'IPCVersion', value: '1.4' },
      { key: 'IPCLanguage', value: 'EN' },
      { key: 'SID', value: cfg.sid },
      { key: 'walletnumber', value: cfg.walletNumber },
      { key: 'Amount', value: amount },
      { key: 'Currency', value: currency },
      { key: 'OrderID', value: checkout.externalOrderId },
      { key: 'URL_OK', value: urlOk },
      { key: 'URL_Cancel', value: urlCancel },
      { key: 'URL_Notify', value: urlNotify },
      { key: 'CardTokenRequest', value: '0' },
      { key: 'KeyIndex', value: cfg.keyIndex },
      { key: 'PaymentParametersRequired', value: '2' },
      { key: 'PaymentMethod', value: '1' },
    ];

    const valuesToSign = orderedParams.map((p) => p.value);
    const signature = this.myposSign(valuesToSign, cfg.privateKeyPem);
    orderedParams.push({ key: 'Signature', value: signature });

    const formFields = orderedParams
      .map((p) => {
        const escapedKey = p.key.replace(/"/g, '&quot;');
        const escapedValue = p.value.replace(/"/g, '&quot;');
        return `<input type="hidden" name="${escapedKey}" value="${escapedValue}" />`;
      })
      .join('');

    const action = cfg.checkoutUrl;

    return `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><form id="mypos" method="POST" action="${action}">${formFields}</form><script>document.getElementById('mypos').submit();</script></body></html>`;
  }

  async handleMyposNotify(rawBody: Buffer): Promise<void> {
    const cfg = this.getMyposConfig();
    const pairs = this.parseUrlEncodedPairs(rawBody);
    const signature = this.getParamValue(pairs, 'Signature');
    if (!signature) {
      throw new BadRequestException('Missing myPOS signature');
    }

    const valuesInOrder = pairs
      .filter((p) => p.key.toLowerCase() !== 'signature')
      .map((p) => p.value);

    const verified = this.myposVerify(
      valuesInOrder,
      signature,
      cfg.apiPublicCertPem,
    );
    if (!verified) {
      throw new BadRequestException('Invalid myPOS signature');
    }

    const orderId = this.getParamValue(pairs, 'OrderID');
    const amountRaw = this.getParamValue(pairs, 'Amount');
    const currencyRaw = this.getParamValue(pairs, 'Currency');
    const trnref = this.getParamValue(pairs, 'IPC_Trnref');

    if (!orderId || !amountRaw || !currencyRaw) {
      throw new BadRequestException('Missing myPOS notify parameters');
    }

    const amountCents = Math.round(Number(amountRaw) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new BadRequestException('Invalid myPOS notify amount');
    }

    const currency = currencyRaw.trim().toLowerCase();
    if (!/^[a-z]{3}$/.test(currency)) {
      throw new BadRequestException('Invalid myPOS notify currency');
    }

    const checkout = await this.checkoutRepo.findOne({
      where: { provider: 'mypos', externalOrderId: orderId },
    });
    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    if (
      checkout.currency.toLowerCase() !== currency.toLowerCase() ||
      checkout.amountCents !== amountCents
    ) {
      throw new BadRequestException('myPOS notify does not match checkout');
    }

    const existingByOrder = await this.purchaseRepo.findOne({
      where: { myposOrderId: orderId },
    });
    if (existingByOrder) {
      if (
        existingByOrder.courseId !== checkout.courseId ||
        existingByOrder.userId !== checkout.userId
      ) {
        throw new BadRequestException('myPOS order already processed');
      }

      checkout.status = 'completed';
      checkout.myposTrnref = trnref;
      await this.checkoutRepo.save(checkout);
      return;
    }

    const existing = await this.purchaseRepo.findOne({
      where: {
        userId: checkout.userId,
        courseId: checkout.courseId,
        revokedAt: IsNull(),
      },
    });

    if (!existing) {
      const revokedExisting = await this.purchaseRepo.findOne({
        where: { userId: checkout.userId, courseId: checkout.courseId },
      });

      if (revokedExisting && revokedExisting.revokedAt) {
        revokedExisting.source = 'mypos';
        revokedExisting.grantedByUserId = null;
        revokedExisting.grantReason = null;
        revokedExisting.revokedAt = null;
        revokedExisting.revokedReason = null;
        revokedExisting.revokedEventId = null;
        revokedExisting.myposOrderId = orderId;
        revokedExisting.myposTrnref = trnref;
        revokedExisting.amountCents = amountCents;
        revokedExisting.currency = currency;
        await this.purchaseRepo.save(revokedExisting);
      } else {
        await this.purchaseRepo.save(
          this.purchaseRepo.create({
            userId: checkout.userId,
            courseId: checkout.courseId,
            source: 'mypos',
            grantedByUserId: null,
            grantReason: null,
            myposOrderId: orderId,
            myposTrnref: trnref,
            amountCents,
            currency,
          }),
        );
      }
    }

    checkout.status = 'completed';
    checkout.myposTrnref = trnref;
    await this.checkoutRepo.save(checkout);

    this.logger.log(
      `myPOS notify purchase recorded: ${JSON.stringify({ orderId, courseId: checkout.courseId, userId: checkout.userId })}`,
    );
  }

  async createRevolutCheckoutUrl(
    userId: string,
    courseId: string,
  ): Promise<string> {
    const cfg = this.getRevolutConfig();

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPaid) {
      throw new BadRequestException('Course is not paid');
    }

    const settings = await this.getPaymentSettings();
    const currency = (course.currency || settings.currency || 'EUR')
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestException('Invalid currency configuration');
    }

    const priceCentsRaw =
      typeof course.priceCents === 'number' && course.priceCents > 0
        ? course.priceCents
        : typeof settings.priceCents === 'number' && settings.priceCents > 0
          ? settings.priceCents
          : 999;

    const amountCents = Number(priceCentsRaw);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new BadRequestException('Invalid course price configuration');
    }

    const externalOrderId = crypto.randomUUID();
    const checkout = await this.checkoutRepo.save(
      this.checkoutRepo.create({
        provider: 'revolut',
        courseId: course.id,
        userId,
        externalOrderId,
        status: 'created',
        amountCents: Math.round(amountCents),
        currency: currency.toLowerCase(),
        myposTrnref: null,
        revolutOrderId: null,
      }),
    );

    const redirectUrl = `${this.frontendOrigin}/courses/${checkout.courseId}/checkout/revolut/success?checkout_id=${encodeURIComponent(checkout.id)}`;

    const body = {
      amount: checkout.amountCents,
      currency,
      description: `Course purchase: ${course.title}`,
      redirect_url: redirectUrl,
      merchant_order_data: {
        reference: checkout.externalOrderId,
      },
    };

    const res = await fetch(`${cfg.baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Revolut-Api-Version': cfg.apiVersion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(
        `Revolut create order failed: ${JSON.stringify({ status: res.status, body: text })}`,
      );
      throw new NotImplementedException('Revolut order creation failed');
    }

    const data = (await res.json()) as {
      id?: string;
      checkout_url?: string;
    };

    const revolutOrderId = (data.id ?? '').trim();
    const checkoutUrl = (data.checkout_url ?? '').trim();
    if (!revolutOrderId || !checkoutUrl) {
      throw new BadRequestException('Revolut checkout url not available');
    }

    checkout.revolutOrderId = revolutOrderId;
    await this.checkoutRepo.save(checkout);

    return checkoutUrl;
  }

  async handleRevolutWebhook(params: {
    rawBody: Buffer;
    timestamp: string | undefined;
    signature: string | undefined;
  }): Promise<void> {
    const cfg = this.getRevolutConfig();
    if (!cfg.webhookSigningSecret) {
      throw new NotImplementedException(
        'Revolut webhook signing secret not configured',
      );
    }

    const timestamp = (params.timestamp ?? '').trim();
    const signatureHeader = (params.signature ?? '').trim();
    if (!timestamp || !signatureHeader) {
      throw new BadRequestException('Missing Revolut signature headers');
    }

    const timestampMs = this.parseRevolutTimestampMs(timestamp);
    const toleranceMs = 5 * 60 * 1000;
    if (Math.abs(Date.now() - timestampMs) > toleranceMs) {
      throw new BadRequestException('Revolut timestamp outside tolerance');
    }

    const expected = this.computeRevolutSignature({
      signingSecret: cfg.webhookSigningSecret,
      timestamp,
      rawBody: params.rawBody,
    });

    const ok = this.isRevolutSignatureValid({
      headerValue: signatureHeader,
      expected,
    });
    if (!ok) {
      throw new BadRequestException('Invalid Revolut signature');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(params.rawBody.toString('utf8')) as unknown;
    } catch {
      throw new BadRequestException('Invalid Revolut webhook payload');
    }

    const payload = parsed as {
      event?: unknown;
      order_id?: unknown;
      merchant_order_ext_ref?: unknown;
    };

    const event = typeof payload.event === 'string' ? payload.event.trim() : '';
    const revolutOrderId =
      typeof payload.order_id === 'string' ? payload.order_id.trim() : '';
    const extRef =
      typeof payload.merchant_order_ext_ref === 'string'
        ? payload.merchant_order_ext_ref.trim()
        : '';

    if (!event) {
      throw new BadRequestException('Invalid Revolut webhook payload');
    }

    if (event === 'ORDER_COMPLETED') {
      const checkout =
        (revolutOrderId
          ? await this.checkoutRepo.findOne({
              where: { provider: 'revolut', revolutOrderId },
            })
          : null) ??
        (extRef
          ? await this.checkoutRepo.findOne({
              where: { provider: 'revolut', externalOrderId: extRef },
            })
          : null);

      if (!checkout) {
        this.logger.warn(
          `Revolut webhook order not found: ${JSON.stringify({ event, revolutOrderId, extRef })}`,
        );
        return;
      }

      if (!checkout.revolutOrderId && revolutOrderId) {
        checkout.revolutOrderId = revolutOrderId;
      }

      const existingByOrder = revolutOrderId
        ? await this.purchaseRepo.findOne({ where: { revolutOrderId } })
        : null;
      if (existingByOrder) {
        checkout.status = 'completed';
        await this.checkoutRepo.save(checkout);
        return;
      }

      const existing = await this.purchaseRepo.findOne({
        where: {
          userId: checkout.userId,
          courseId: checkout.courseId,
          revokedAt: IsNull(),
        },
      });

      if (!existing) {
        const revokedExisting = await this.purchaseRepo.findOne({
          where: { userId: checkout.userId, courseId: checkout.courseId },
        });

        if (revokedExisting && revokedExisting.revokedAt) {
          revokedExisting.source = 'revolut';
          revokedExisting.grantedByUserId = null;
          revokedExisting.grantReason = null;
          revokedExisting.revokedAt = null;
          revokedExisting.revokedReason = null;
          revokedExisting.revokedEventId = null;
          revokedExisting.revolutOrderId =
            revolutOrderId || checkout.revolutOrderId;
          revokedExisting.amountCents = checkout.amountCents;
          revokedExisting.currency = checkout.currency;
          await this.purchaseRepo.save(revokedExisting);
        } else {
          await this.purchaseRepo.save(
            this.purchaseRepo.create({
              userId: checkout.userId,
              courseId: checkout.courseId,
              source: 'revolut',
              grantedByUserId: null,
              grantReason: null,
              revolutOrderId: revolutOrderId || checkout.revolutOrderId,
              amountCents: checkout.amountCents,
              currency: checkout.currency,
            }),
          );
        }
      }

      checkout.status = 'completed';
      await this.checkoutRepo.save(checkout);
      return;
    }

    if (event === 'ORDER_CANCELLED') {
      if (revolutOrderId) {
        const checkout = await this.checkoutRepo.findOne({
          where: { provider: 'revolut', revolutOrderId },
        });
        if (checkout && checkout.status === 'created') {
          checkout.status = 'cancelled';
          await this.checkoutRepo.save(checkout);
        }
      }
      return;
    }

    if (event === 'ORDER_FAILED') {
      if (revolutOrderId) {
        const checkout = await this.checkoutRepo.findOne({
          where: { provider: 'revolut', revolutOrderId },
        });
        if (checkout && checkout.status === 'created') {
          checkout.status = 'failed';
          await this.checkoutRepo.save(checkout);
        }
      }
      return;
    }
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

  async createPaypalCheckoutUrl(
    userId: string,
    courseId: string,
  ): Promise<string> {
    if (!this.paypalBaseUrl) {
      throw new NotImplementedException('PayPal is not configured');
    }

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
          : 999;

    if (!/^[a-z]{3}$/.test(currency)) {
      throw new BadRequestException('Invalid PayPal currency configuration');
    }

    const priceCents = Number(priceCentsRaw);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      throw new BadRequestException(
        'Invalid PayPal course price configuration',
      );
    }

    const amountValue = (priceCents / 100).toFixed(2);
    const returnUrl = `${this.frontendOrigin}/courses/${course.id}/checkout/paypal/success`;
    const cancelUrl = `${this.frontendOrigin}/courses/${course.id}/checkout/paypal/cancel`;
    const customId = JSON.stringify({ courseId: course.id, userId });

    const accessToken = await this.getPaypalAccessToken();

    const res = await fetch(`${this.paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: customId,
            description: course.title,
            amount: {
              currency_code: currency.toUpperCase(),
              value: amountValue,
            },
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!res.ok) {
      throw new NotImplementedException('PayPal order creation failed');
    }

    const data = (await res.json()) as {
      id?: string;
      links?: Array<{ href?: string; rel?: string; method?: string }>;
    };

    const approveUrl =
      data.links?.find((l) => (l.rel ?? '').trim() === 'approve')?.href ?? null;
    const url = (approveUrl ?? '').trim();
    if (!url) {
      throw new BadRequestException('PayPal approval url not available');
    }

    return url;
  }

  async capturePaypalOrderAndRecordPurchase(
    userId: string,
    courseId: string,
    orderId: string,
  ): Promise<void> {
    if (!this.paypalBaseUrl) {
      throw new NotImplementedException('PayPal is not configured');
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPaid) {
      throw new BadRequestException('Course is not paid');
    }

    const normalizedOrderId = (orderId ?? '').trim();
    if (!normalizedOrderId) {
      throw new BadRequestException('Missing PayPal order id');
    }

    const existingByOrder = await this.purchaseRepo.findOne({
      where: { paypalOrderId: normalizedOrderId },
    });
    if (existingByOrder) {
      return;
    }

    const existing = await this.purchaseRepo.findOne({
      where: { userId, courseId, revokedAt: IsNull() },
    });
    if (existing) {
      return;
    }

    const accessToken = await this.getPaypalAccessToken();

    const res = await fetch(
      `${this.paypalBaseUrl}/v2/checkout/orders/${encodeURIComponent(normalizedOrderId)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) {
      throw new BadRequestException('PayPal capture failed');
    }

    const data = (await res.json()) as {
      status?: string;
      purchase_units?: Array<{
        custom_id?: string;
        amount?: { currency_code?: string; value?: string };
        payments?: { captures?: Array<{ id?: string; status?: string }> };
      }>;
    };

    const status = (data.status ?? '').trim().toUpperCase();
    if (status !== 'COMPLETED') {
      throw new ForbiddenException('Payment not completed');
    }

    const unit = Array.isArray(data.purchase_units)
      ? data.purchase_units[0]
      : null;
    const customIdRaw = (unit?.custom_id ?? '').trim();
    let custom: { courseId?: string; userId?: string } | null = null;
    try {
      custom = customIdRaw
        ? (JSON.parse(customIdRaw) as { courseId?: string; userId?: string })
        : null;
    } catch {
      custom = null;
    }

    if (custom?.courseId !== courseId || custom?.userId !== userId) {
      throw new ForbiddenException(
        'PayPal order does not match this user/course',
      );
    }

    const currency =
      (unit?.amount?.currency_code ?? '').trim().toLowerCase() || null;
    const valueRaw = (unit?.amount?.value ?? '').trim();
    const amountCents = (() => {
      const n = Number(valueRaw);
      if (!Number.isFinite(n) || n <= 0) return null;
      return Math.round(n * 100);
    })();

    const capture = Array.isArray(unit?.payments?.captures)
      ? unit?.payments?.captures[0]
      : null;
    const paypalCaptureId = (capture?.id ?? '').trim() || null;

    const revokedExisting = await this.purchaseRepo.findOne({
      where: { userId, courseId },
    });

    if (revokedExisting && revokedExisting.revokedAt) {
      revokedExisting.source = 'paypal';
      revokedExisting.grantedByUserId = null;
      revokedExisting.grantReason = null;
      revokedExisting.revokedAt = null;
      revokedExisting.revokedReason = null;
      revokedExisting.revokedEventId = null;
      revokedExisting.paypalOrderId = normalizedOrderId;
      revokedExisting.paypalCaptureId = paypalCaptureId;
      revokedExisting.amountCents = amountCents;
      revokedExisting.currency = currency;
      await this.purchaseRepo.save(revokedExisting);
      return;
    }

    await this.purchaseRepo.save(
      this.purchaseRepo.create({
        userId,
        courseId,
        source: 'paypal',
        grantedByUserId: null,
        grantReason: null,
        paypalOrderId: normalizedOrderId,
        paypalCaptureId,
        amountCents,
        currency,
      }),
    );
  }
}
