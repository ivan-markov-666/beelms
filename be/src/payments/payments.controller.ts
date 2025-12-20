import {
  Body,
  Controller,
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
import { PaymentsService } from './payments.service';
import { VerifyPurchaseDto } from './dto/verify-purchase.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('courses')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':courseId/checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ url: string }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const url = await this.paymentsService.createCheckoutSession(
      userId,
      courseId,
    );
    return { url };
  }

  @Post(':courseId/purchase/verify')
  @UseGuards(JwtAuthGuard)
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
