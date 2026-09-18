import { Module } from '@nestjs/common';

import { DiscountsModule } from '../discounts/discounts.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentDocumentService } from './enrollment-document.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    DiscountsModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EnrollmentDocumentService],
  exports: [EnrollmentsService, EnrollmentDocumentService],
})
export class EnrollmentsModule {}