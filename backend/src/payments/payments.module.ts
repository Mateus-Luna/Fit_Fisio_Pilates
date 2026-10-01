import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentOverdueService } from './payment-overdue.service';
import { PaymentOverdueScheduler } from './payment-overdue.scheduler';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
  ],
  controllers: [
    PaymentsController,
  ],
  providers: [
    PaymentsService,
    PaymentOverdueService,
    PaymentOverdueScheduler,
  ],
  exports: [
    PaymentsService,
    PaymentOverdueService,
  ],
})
export class PaymentsModule {}