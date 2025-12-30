import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';
import { PaymentsService } from './payments.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('payments')
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') stripeSignature: string | undefined,
  ): Promise<{ received: true }> {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body');
    }
    if (!stripeSignature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    await this.paymentsService.handleStripeWebhook(stripeSignature, rawBody);

    return { received: true };
  }

  @Get('courses/:courseId/purchase/status')
  @UseGuards(FeatureEnabledGuard('paidCourses'), JwtAuthGuard)
  async getPurchaseStatus(
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ purchased: boolean }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const purchased = await this.paymentsService.hasPurchased(userId, courseId);
    return { purchased };
  }
}
