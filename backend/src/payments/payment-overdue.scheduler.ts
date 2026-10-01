import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentOverdueService } from './payment-overdue.service';

@Injectable()
export class PaymentOverdueScheduler {
  private readonly logger = new Logger(
    PaymentOverdueScheduler.name,
  );

  constructor(
    private readonly paymentOverdueService: PaymentOverdueService,
  ) {}

  /**
   * Executa todos os dias às 00:05.
   */
  @Cron('5 0 * * *')
  async handleOverduePayments() {
    this.logger.log(
      'Iniciando verificação automática de inadimplência...',
    );

    try {
      await this.paymentOverdueService.checkOverduePayments();
    } catch (error) {
      this.logger.error(
        'Erro ao verificar inadimplência.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}