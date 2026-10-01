import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentOverdueService {
  private readonly logger = new Logger(PaymentOverdueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Atualiza mensalidades vencidas e cria notificações
   * para alunos que possuem mais de uma mensalidade em aberto.
   */
  async checkOverduePayments() {
    const now = new Date();

    const overduePayments = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: now,
        },
      },
      include: {
        student: true,
        enrollment: true,
      },
    });

    let updatedPayments = 0;
    let notificationsCreated = 0;

    for (const payment of overduePayments) {
      await this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: 'OVERDUE',
        },
      });

      updatedPayments++;

      const overdueCount = await this.prisma.payment.count({
        where: {
          studentId: payment.studentId,
          status: 'OVERDUE',
        },
      });

      /*
       * A regra solicitada é:
       *
       * 1 mês em atraso -> pagamento fica OVERDUE
       * mais de 1 mês -> Aline recebe notificação
       */
      if (overdueCount > 1) {
        const users = await this.prisma.user.findMany({
          where: {
            active: true,
          },
        });

        for (const user of users) {
          const alreadyNotified =
            await this.notificationsService.hasOverdueNotification(
              user.id,
              payment.studentId,
              payment.referenceMonth,
              payment.referenceYear,
            );

          if (alreadyNotified) {
            continue;
          }

          await this.notificationsService.createOverdueNotification({
            userId: user.id,
            studentId: payment.studentId,
            studentName: payment.student.name,
            overdueMonths: overdueCount,
          });

          notificationsCreated++;
        }
      }
    }

    this.logger.log(
      `Inadimplência verificada: ${updatedPayments} pagamento(s) ` +
      `marcado(s) como OVERDUE e ${notificationsCreated} notificação(ões) criada(s).`,
    );

    return {
      updatedPayments,
      notificationsCreated,
    };
  }
}