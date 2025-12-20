import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PaymentsService } from './payments.service';
import { AdminUpdatePaymentSettingsDto } from './dto/admin-update-payment-settings.dto';

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
}
