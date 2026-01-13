import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments/revolut')
export class PaymentsRevolutController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: Request,
    @Headers('revolut-request-timestamp') timestamp: string | undefined,
    @Headers('revolut-signature') signature: string | undefined,
  ): Promise<{ status: 'ok' }> {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    await this.paymentsService.handleRevolutWebhook({
      rawBody,
      timestamp,
      signature,
    });

    return { status: 'ok' };
  }
}
