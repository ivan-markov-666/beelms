import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Course } from '../courses/course.entity';
import { CoursePurchase } from '../courses/course-purchase.entity';
import { PaymentSettings } from './payment-settings.entity';
import { StripeWebhookEvent } from './stripe-webhook-event.entity';
import { PaymentsController } from './payments.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CoursePurchase,
      PaymentSettings,
      StripeWebhookEvent,
    ]),
    AuthModule,
  ],
  controllers: [
    PaymentsController,
    AdminPaymentsController,
    PaymentsWebhookController,
  ],
  providers: [PaymentsService],
})
export class PaymentsModule {}
