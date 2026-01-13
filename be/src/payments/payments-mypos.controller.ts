import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Header,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments/mypos')
export class PaymentsMyposController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('redirect/:checkoutId')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async redirect(@Param('checkoutId') checkoutId: string): Promise<string> {
    return this.paymentsService.buildMyposRedirectHtml(checkoutId);
  }

  @Post('notify')
  @HttpCode(200)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async notify(
    @Req() req: Request,
    @Headers('content-type') contentType: string | undefined,
  ): Promise<string> {
    const normalizedContentType = contentType?.toLowerCase();
    if (
      !normalizedContentType ||
      !normalizedContentType.includes('application/x-www-form-urlencoded')
    ) {
      throw new BadRequestException('Invalid content-type');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    await this.paymentsService.handleMyposNotify(rawBody);

    return 'OK';
  }
}
