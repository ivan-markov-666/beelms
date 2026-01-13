import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Patch,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PaymentsService } from './payments.service';
import { AdminUpdatePaymentSettingsDto } from './dto/admin-update-payment-settings.dto';
import { StripeWebhookEventStatus } from './stripe-webhook-event.entity';
import { SettingsService } from '../settings/settings.service';
import { AdminUpdatePaymentProvidersDto } from './dto/admin-update-payment-providers.dto';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('currencies')
  listCurrencies(): string[] {
    return this.paymentsService.getSupportedCurrencies();
  }

  @Get('settings')
  async getSettings(): Promise<{ currency: string; priceCents: number }> {
    const settings = await this.paymentsService.getPaymentSettings();
    return {
      currency: settings.currency,
      priceCents: settings.priceCents,
    };
  }

  @Patch('settings')
  @HttpCode(204)
  async updateSettings(
    @Body() dto: AdminUpdatePaymentSettingsDto,
  ): Promise<void> {
    await this.paymentsService.updatePaymentSettings(dto);
  }

  @Get('webhook-events')
  async listWebhookEvents(
    @Query('status') status?: string,
    @Query('limit') limitRaw?: string,
  ): Promise<
    Array<{
      id: string;
      eventId: string;
      eventType: string;
      status: StripeWebhookEventStatus;
      errorMessage: string | null;
      processedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    const allowedStatuses: StripeWebhookEventStatus[] = [
      'received',
      'processed',
      'failed',
    ];

    const normalizedStatus = status?.trim();
    if (
      normalizedStatus &&
      !allowedStatuses.includes(normalizedStatus as StripeWebhookEventStatus)
    ) {
      throw new BadRequestException('Invalid status');
    }

    const limit = limitRaw ? Number(limitRaw) : undefined;
    const events = await this.paymentsService.listWebhookEvents({
      status: normalizedStatus as StripeWebhookEventStatus | undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return events.map((e) => ({
      id: e.id,
      eventId: e.eventId,
      eventType: e.eventType,
      status: e.status,
      errorMessage: e.errorMessage,
      processedAt: e.processedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }

  @Post('webhook-events/:eventId/retry')
  async retryWebhookEvent(
    @Param('eventId') eventId: string,
  ): Promise<{ status: 'processed' | 'failed'; errorMessage: string | null }> {
    return this.paymentsService.retryWebhookEvent(eventId);
  }

  @Get('providers/status')
  async getProvidersStatus(): Promise<{
    stripe: {
      configured: boolean;
      mode: 'test' | 'live' | 'unconfigured';
      webhookSecretConfigured: boolean;
      enabled: boolean;
    };
    paypal: {
      configured: boolean;
      mode: 'sandbox' | 'live' | 'unconfigured';
      enabled: boolean;
    };
    mypos: {
      configured: boolean;
      mode: 'sandbox' | 'live' | 'unconfigured';
      enabled: boolean;
    };
    revolut: {
      configured: boolean;
      mode: 'sandbox' | 'live' | 'unconfigured';
      enabled: boolean;
    };
    defaultProvider: 'stripe' | 'paypal' | 'mypos' | 'revolut';
    frontendOrigin: string;
  }> {
    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const features = cfg.features;

    const stripeEnabled = features?.paymentsStripe !== false;
    const paypalEnabled = features?.paymentsPaypal !== false;
    const myposEnabled = features?.paymentsMypos === true;
    const revolutEnabled = features?.paymentsRevolut === true;

    const defaultProviderRaw = (features?.paymentsDefaultProvider ?? 'stripe')
      .trim()
      .toLowerCase();
    const defaultProvider =
      defaultProviderRaw === 'paypal' ||
      defaultProviderRaw === 'mypos' ||
      defaultProviderRaw === 'revolut'
        ? defaultProviderRaw
        : 'stripe';

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').trim();
    const stripeWebhookSecret = (
      process.env.STRIPE_WEBHOOK_SECRET ?? ''
    ).trim();
    const stripeConfigured = stripeKey.length > 0;

    let stripeMode: 'test' | 'live' | 'unconfigured' = 'unconfigured';
    if (stripeConfigured) {
      stripeMode = stripeKey.startsWith('sk_live_') ? 'live' : 'test';
    }

    const paypalModeRaw = (process.env.PAYPAL_MODE ?? 'sandbox')
      .trim()
      .toLowerCase();
    const paypalConfigured =
      (process.env.PAYPAL_CLIENT_ID ?? '').trim().length > 0 &&
      (process.env.PAYPAL_CLIENT_SECRET ?? '').trim().length > 0;

    let paypalMode: 'sandbox' | 'live' | 'unconfigured' = 'unconfigured';
    if (paypalConfigured) {
      paypalMode = paypalModeRaw === 'live' ? 'live' : 'sandbox';
    }

    const myposSid = (process.env.MYPOS_SID ?? '').trim();
    const myposWallet = (process.env.MYPOS_WALLET_NUMBER ?? '').trim();
    const myposKeyIndex = (process.env.MYPOS_KEY_INDEX ?? '').trim();
    const myposPrivateKey = (process.env.MYPOS_PRIVATE_KEY ?? '').trim();
    const myposPublicCert = (process.env.MYPOS_API_PUBLIC_CERT ?? '').trim();
    const myposConfigured =
      myposSid.length > 0 &&
      myposWallet.length > 0 &&
      myposKeyIndex.length > 0 &&
      myposPrivateKey.length > 0 &&
      myposPublicCert.length > 0;
    const myposModeRaw = (process.env.MYPOS_MODE ?? 'sandbox')
      .trim()
      .toLowerCase();
    let myposMode: 'sandbox' | 'live' | 'unconfigured' = 'unconfigured';
    if (myposConfigured) {
      myposMode = myposModeRaw === 'live' ? 'live' : 'sandbox';
    }

    const revolutApiKey = (process.env.REVOLUT_API_KEY ?? '').trim();
    const revolutWebhookSigningSecret = (
      process.env.REVOLUT_WEBHOOK_SIGNING_SECRET ??
      process.env.REVOLUT_WEBHOOK_SECRET ??
      ''
    ).trim();
    const revolutConfigured =
      revolutApiKey.length > 0 && revolutWebhookSigningSecret.length > 0;
    const revolutModeRaw = (process.env.REVOLUT_MODE ?? 'sandbox')
      .trim()
      .toLowerCase();
    let revolutMode: 'sandbox' | 'live' | 'unconfigured' = 'unconfigured';
    if (revolutConfigured) {
      revolutMode = revolutModeRaw === 'live' ? 'live' : 'sandbox';
    }

    const origin = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001')
      .trim()
      .replace(/\/$/, '');

    return {
      stripe: {
        configured: stripeConfigured,
        mode: stripeMode,
        webhookSecretConfigured: stripeWebhookSecret.length > 0,
        enabled: stripeEnabled,
      },
      paypal: {
        configured: paypalConfigured,
        mode: paypalMode,
        enabled: paypalEnabled,
      },
      mypos: {
        configured: myposConfigured,
        mode: myposMode,
        enabled: myposEnabled,
      },
      revolut: {
        configured: revolutConfigured,
        mode: revolutMode,
        enabled: revolutEnabled,
      },
      defaultProvider,
      frontendOrigin: origin,
    };
  }

  @Patch('providers')
  @HttpCode(204)
  async updateProviders(@Body() dto: AdminUpdatePaymentProvidersDto) {
    await this.settingsService.updateInstanceConfig({
      features: dto,
    });
  }
}
