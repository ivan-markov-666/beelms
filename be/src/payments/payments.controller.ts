import {
  Body,
  Controller,
  BadRequestException,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';
import { SettingsService } from '../settings/settings.service';
import { PaymentsService } from './payments.service';
import { VerifyPurchaseDto } from './dto/verify-purchase.dto';

class VerifyPaypalPurchaseDto {
  @IsString()
  @Length(1, 255)
  orderId: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('courses')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly settingsService: SettingsService,
  ) {}

  @Post(':courseId/checkout')
  @UseGuards(FeatureEnabledGuard('paidCourses'), JwtAuthGuard)
  async createCheckout(
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
    @Query('provider') provider: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ url: string }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const normalizedProvider = (provider ?? '').trim().toLowerCase();

    const cfg = await this.settingsService.getOrCreateInstanceConfig();
    const features = cfg.features;

    const stripeEnabled = features?.paymentsStripe !== false;
    const paypalEnabled = features?.paymentsPaypal !== false;
    const myposEnabled = features?.paymentsMypos === true;
    const revolutEnabled = features?.paymentsRevolut === true;

    let url: string;
    if (normalizedProvider === 'paypal') {
      if (!paypalEnabled) {
        throw new BadRequestException('PayPal payments are disabled');
      }
      url = await this.paymentsService.createPaypalCheckoutUrl(
        userId,
        courseId,
      );
    } else if (normalizedProvider === 'mypos') {
      if (!myposEnabled) {
        throw new BadRequestException('myPOS payments are disabled');
      }
      url = await this.paymentsService.createMyposCheckoutUrl(userId, courseId);
    } else if (normalizedProvider === 'revolut') {
      if (!revolutEnabled) {
        throw new BadRequestException('Revolut payments are disabled');
      }
      url = await this.paymentsService.createRevolutCheckoutUrl(
        userId,
        courseId,
      );
    } else {
      if (!stripeEnabled) {
        throw new BadRequestException('Stripe payments are disabled');
      }
      url = await this.paymentsService.createCheckoutSession(userId, courseId);
    }
    if (!url) {
      throw new BadRequestException('Checkout url not available');
    }
    return { url };
  }

  @Post(':courseId/paypal/verify')
  @UseGuards(FeatureEnabledGuard('paidCourses'), JwtAuthGuard)
  @HttpCode(204)
  async verifyPaypalPurchase(
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyPaypalPurchaseDto,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const orderId = (dto?.orderId ?? '').trim();
    if (!orderId) {
      throw new BadRequestException('Missing PayPal order id');
    }

    await this.paymentsService.capturePaypalOrderAndRecordPurchase(
      userId,
      courseId,
      orderId,
    );
  }

  @Post(':courseId/purchase/verify')
  @UseGuards(FeatureEnabledGuard('paidCourses'), JwtAuthGuard)
  @HttpCode(204)
  async verifyPurchase(
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyPurchaseDto,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.paymentsService.verifyCheckoutSessionAndRecordPurchase(
      userId,
      courseId,
      dto.sessionId,
    );
  }
}
