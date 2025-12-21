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

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
}
