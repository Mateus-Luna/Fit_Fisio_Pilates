import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {
  PaymentMethod,
  PaymentPeriod,
  PaymentStatus,
} from 'generated/prisma/enums';
import { PaymentOverdueService } from './payment-overdue.service';


@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentOverdueService: PaymentOverdueService,

  ) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  /**
   * Gera todas as mensalidades do aluno para um mês.
   */
  @Post('student/:studentId/monthly')
  createMonthlyPaymentsForStudent(
    @Param('studentId') studentId: string,
    @Body()
    body: {
      referenceMonth: number;
      referenceYear: number;
      dueDate: string;
    },
  ) {
    return this.paymentsService.createMonthlyPaymentsForStudent(
      studentId,
      body.referenceMonth,
      body.referenceYear,
      body.dueDate,
    );
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('enrollmentId') enrollmentId?: string,
    @Query('status') status?: PaymentStatus,
    @Query('period') period?: PaymentPeriod,
    @Query('referenceMonth')
    referenceMonth?: string,
    @Query('referenceYear')
    referenceYear?: string,
  ) {
    return this.paymentsService.findAll({
      studentId,
      enrollmentId,
      status,
      period,
      referenceMonth: referenceMonth
        ? Number(referenceMonth)
        : undefined,
      referenceYear: referenceYear
        ? Number(referenceYear)
        : undefined,
    });
  }

  @Get('overdue')
  findOverdue() {
    return this.paymentsService.findOverdue();
  }

  @Get('student/:studentId/monthly-summary')
  getStudentMonthlySummary(
    @Param('studentId') studentId: string,
    @Query('referenceMonth') referenceMonth: string,
    @Query('referenceYear') referenceYear: string,
  ) {
    return this.paymentsService.getStudentMonthlySummary(
      studentId,
      Number(referenceMonth),
      Number(referenceYear),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, dto);
  }

  @Patch(':id/pay')
  markAsPaid(
    @Param('id') id: string,
    @Body()
    body: {
      method: PaymentMethod;
      transactionId?: string;
    },
  ) {
    return this.paymentsService.markAsPaid(
      id,
      body.method,
      body.transactionId,
    );
  }

  @Patch(':id/confirm-online')
  confirmOnlinePayment(
    @Param('id') id: string,
    @Body()
    body: {
      method: PaymentMethod;
      transactionId: string;
    },
  ) {
    return this.paymentsService.confirmOnlinePayment(
      id,
      body.method,
      body.transactionId,
    );
  }

  @Patch('overdue/update')
  updateOverduePayments() {
    return this.paymentsService.updateOverduePayments();
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.paymentsService.cancel(id);
  }

  @Post('check-overdue')
  checkOverdue() {
    return this.paymentOverdueService.checkOverduePayments();
  }
}