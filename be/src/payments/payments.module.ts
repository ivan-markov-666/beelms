import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Course } from '../courses/course.entity';
import { CoursePurchase } from '../courses/course-purchase.entity';
import { PaymentSettings } from './payment-settings.entity';
import { StripeWebhookEvent } from './stripe-webhook-event.entity';
import { PaymentCheckout } from './payment-checkout.entity';
import { PaymentsController } from './payments.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { PaymentsMyposController } from './payments-mypos.controller';
import { PaymentsRevolutController } from './payments-revolut.controller';
import { PaymentsService } from './payments.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CoursePurchase,
      PaymentSettings,
      StripeWebhookEvent,
      PaymentCheckout,
    ]),
    AuthModule,
    SettingsModule,
  ],
  controllers: [
    PaymentsController,
    AdminPaymentsController,
    PaymentsWebhookController,
    PaymentsMyposController,
    PaymentsRevolutController,
  ],
  providers: [PaymentsService],
})
export class PaymentsModule {}
