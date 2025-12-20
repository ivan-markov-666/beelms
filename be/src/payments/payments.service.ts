import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Course } from '../courses/course.entity';
import { CoursePurchase } from '../courses/course-purchase.entity';
import { PaymentSettings } from './payment-settings.entity';
import { AdminUpdatePaymentSettingsDto } from './dto/admin-update-payment-settings.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null;
  private readonly frontendOrigin: string;

  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CoursePurchase)
    private readonly purchaseRepo: Repository<CoursePurchase>,
    @InjectRepository(PaymentSettings)
    private readonly settingsRepo: Repository<PaymentSettings>,
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
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const session = event.data.object;
    const courseId = session.metadata?.courseId;
    const userId = session.metadata?.userId;

    if (!courseId || !userId) {
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
      where: { userId, courseId },
    });
    if (existing) {
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null;

    const amountCents =
      typeof session.amount_total === 'number' ? session.amount_total : null;
    const currency =
      typeof session.currency === 'string' ? session.currency : null;

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

  async hasPurchased(userId: string, courseId: string): Promise<boolean> {
    const existing = await this.purchaseRepo.findOne({
      where: { userId, courseId },
    });
    return !!existing;
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
