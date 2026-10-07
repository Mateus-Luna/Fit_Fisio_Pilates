import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {
  BillingFrequency,
  EnrollmentStatus,
  PaymentMethod,
  PaymentPeriod,
  PaymentStatus,
} from 'generated/prisma/enums';

function splitFortnightAmounts(modalityPrice: number, finalPrice: number) {
  const totalFinalCents = Math.round(finalPrice * 100);
  const firstFinalCents = Math.ceil(totalFinalCents / 2);
  const secondFinalCents = totalFinalCents - firstFinalCents;

  const totalAmountCents = Math.round(modalityPrice * 100);
  const firstAmountCents = Math.ceil(totalAmountCents / 2);
  const secondAmountCents = totalAmountCents - firstAmountCents;

  const firstAmount = firstAmountCents / 100;
  const secondAmount = secondAmountCents / 100;

  const firstFinalAmount = firstFinalCents / 100;
  const secondFinalAmount = secondFinalCents / 100;

  const firstDiscountAmount = Number(
    (firstAmount - firstFinalAmount).toFixed(2),
  );
  const secondDiscountAmount = Number(
    (secondAmount - secondFinalAmount).toFixed(2),
  );

  return {
    first: {
      amount: firstAmount,
      discountAmount: firstDiscountAmount,
      finalAmount: firstFinalAmount,
    },
    second: {
      amount: secondAmount,
      discountAmount: secondDiscountAmount,
      finalAmount: secondFinalAmount,
    },
  };
}

function calculateFortnightDueDates(
  dueDateStr: string,
  referenceMonth: number,
  referenceYear: number,
) {
  const baseDue = new Date(dueDateStr);
  const year = isNaN(baseDue.getFullYear())
    ? referenceYear
    : baseDue.getFullYear();
  const month = isNaN(baseDue.getMonth())
    ? referenceMonth - 1
    : baseDue.getMonth();
  const day = isNaN(baseDue.getDate()) ? 10 : baseDue.getDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let firstDue: Date;
  let secondDue: Date;

  if (day <= 15) {
    firstDue = new Date(year, month, day);
    const secondDay = Math.min(day + 15, daysInMonth);
    secondDue = new Date(year, month, secondDay);
  } else {
    const firstDay = Math.max(1, day - 15);
    firstDue = new Date(year, month, firstDay);
    secondDue = new Date(year, month, Math.min(day, daysInMonth));
  }

  return { firstDue, secondDue };
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma mensalidade a partir de uma matrícula.
   *
   * A Modalidade é a fonte da verdade do preço atual da mensalidade.
   */
  async create(createPaymentDto: CreatePaymentDto) {
    const {
      studentId,
      enrollmentId,
      referenceMonth,
      referenceYear,
      dueDate,
      observation,
      period,
    } = createPaymentDto;

    if (!enrollmentId) {
      throw new BadRequestException(
        'A matrícula é obrigatória para criar uma mensalidade.',
      );
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        modality: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada.');
    }

    if (enrollment.studentId !== studentId) {
      throw new BadRequestException(
        'A matrícula informada não pertence ao aluno.',
      );
    }

    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException(
        'Somente matrículas ativas podem gerar mensalidades.',
      );
    }

    const modalityPrice = Number(enrollment.modality.monthlyPrice);
    const discountPercentage = Number(
      enrollment.discountPercentage || 0,
    );
    const totalDiscountAmount = Number(
      ((modalityPrice * discountPercentage) / 100).toFixed(2),
    );
    const totalFinalAmount = Number(
      (modalityPrice - totalDiscountAmount).toFixed(2),
    );

    const effectivePeriod =
      period ??
      (enrollment.billingFrequency === BillingFrequency.BIWEEKLY
        ? PaymentPeriod.FIRST_FORTNIGHT
        : PaymentPeriod.MONTHLY);

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        enrollmentId,
        referenceMonth,
        referenceYear,
        period: effectivePeriod,
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Já existe uma cobrança para este período desta matrícula neste mês.',
      );
    }

    let amount = modalityPrice;
    let discountAmount = totalDiscountAmount;
    let finalAmount = totalFinalAmount;
    let defaultObservation = `Mensalidade de ${enrollment.modality.name}.`;

    if (
      effectivePeriod === PaymentPeriod.FIRST_FORTNIGHT ||
      effectivePeriod === PaymentPeriod.SECOND_FORTNIGHT
    ) {
      const split = splitFortnightAmounts(
        modalityPrice,
        totalFinalAmount,
      );
      const isFirst =
        effectivePeriod === PaymentPeriod.FIRST_FORTNIGHT;
      const part = isFirst ? split.first : split.second;
      amount = part.amount;
      discountAmount = part.discountAmount;
      finalAmount = part.finalAmount;
      defaultObservation = `Mensalidade de ${enrollment.modality.name} (${
        isFirst ? '1ª quinzena' : '2ª quinzena'
      }).`;
    }

    return this.prisma.payment.create({
      data: {
        studentId,
        enrollmentId,
        referenceMonth,
        referenceYear,
        period: effectivePeriod,
        dueDate: new Date(dueDate),

        amount,
        discountAmount,
        finalAmount,

        status: PaymentStatus.PENDING,

        observation: observation ?? defaultObservation,
      },

      include: {
        student: true,
        enrollment: {
          include: {
            modality: true,
            class: true,
          },
        },
      },
    });
  }

  /**
   * Gera as mensalidades de todas as matrículas ativas de um aluno
   * para determinado mês.
   *
   * Suporta:
   * - Cobrança MENSAL (1 pagamento por mês)
   * - Cobrança QUINZENAL / BIWEEKLY (2 pagamentos por mês)
   * - Preço atualizado a partir de Modality.monthlyPrice
   * - Desconto percentual aplicado sobre a mensalidade antes da divisão
   * - Tratamento exato de centavos no arredondamento
   * - Idempotência (não duplica cobranças já geradas)
   */
  async createMonthlyPaymentsForStudent(
    studentId: string,
    referenceMonth: number,
    referenceYear: number,
    dueDate: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: {
            status: EnrollmentStatus.ACTIVE,
          },
          include: {
            modality: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    if (student.enrollments.length === 0) {
      throw new BadRequestException(
        'O aluno não possui matrículas ativas.',
      );
    }

    const payments: any[] = [];

    for (const enrollment of student.enrollments) {
      const modalityPrice = Number(
        enrollment.modality.monthlyPrice,
      );
      const discountPercentage = Number(
        enrollment.discountPercentage || 0,
      );
      const totalDiscountAmount = Number(
        ((modalityPrice * discountPercentage) / 100).toFixed(2),
      );
      const totalFinalAmount = Number(
        (modalityPrice - totalDiscountAmount).toFixed(2),
      );

      if (
        enrollment.billingFrequency ===
        BillingFrequency.BIWEEKLY
      ) {
        const split = splitFortnightAmounts(
          modalityPrice,
          totalFinalAmount,
        );
        const { firstDue, secondDue } =
          calculateFortnightDueDates(
            dueDate,
            referenceMonth,
            referenceYear,
          );

        // 1ª Quinzena
        const existingFirst =
          await this.prisma.payment.findFirst({
            where: {
              enrollmentId: enrollment.id,
              referenceMonth,
              referenceYear,
              period: PaymentPeriod.FIRST_FORTNIGHT,
            },
            include: {
              enrollment: {
                include: {
                  modality: true,
                },
              },
            },
          });

        if (existingFirst) {
          payments.push(existingFirst);
        } else {
          const p1 = await this.prisma.payment.create({
            data: {
              studentId: student.id,
              enrollmentId: enrollment.id,
              referenceMonth,
              referenceYear,
              period: PaymentPeriod.FIRST_FORTNIGHT,
              dueDate: firstDue,

              amount: split.first.amount,
              discountAmount: split.first.discountAmount,
              finalAmount: split.first.finalAmount,

              status: PaymentStatus.PENDING,

              observation: `Mensalidade de ${enrollment.modality.name} (1ª quinzena).`,
            },
            include: {
              enrollment: {
                include: {
                  modality: true,
                },
              },
            },
          });
          payments.push(p1);
        }

        // 2ª Quinzena
        const existingSecond =
          await this.prisma.payment.findFirst({
            where: {
              enrollmentId: enrollment.id,
              referenceMonth,
              referenceYear,
              period: PaymentPeriod.SECOND_FORTNIGHT,
            },
            include: {
              enrollment: {
                include: {
                  modality: true,
                },
              },
            },
          });

        if (existingSecond) {
          payments.push(existingSecond);
        } else {
          const p2 = await this.prisma.payment.create({
            data: {
              studentId: student.id,
              enrollmentId: enrollment.id,
              referenceMonth,
              referenceYear,
              period: PaymentPeriod.SECOND_FORTNIGHT,
              dueDate: secondDue,

              amount: split.second.amount,
              discountAmount: split.second.discountAmount,
              finalAmount: split.second.finalAmount,

              status: PaymentStatus.PENDING,

              observation: `Mensalidade de ${enrollment.modality.name} (2ª quinzena).`,
            },
            include: {
              enrollment: {
                include: {
                  modality: true,
                },
              },
            },
          });
          payments.push(p2);
        }
      } else {
        // MENSAL (MONTHLY)
        const existingPayment =
          await this.prisma.payment.findFirst({
            where: {
              enrollmentId: enrollment.id,
              referenceMonth,
              referenceYear,
              period: PaymentPeriod.MONTHLY,
            },
            include: {
              enrollment: {
                include: {
                  modality: true,
                },
              },
            },
          });

        if (existingPayment) {
          payments.push(existingPayment);
          continue;
        }

        const payment = await this.prisma.payment.create({
          data: {
            studentId: student.id,
            enrollmentId: enrollment.id,
            referenceMonth,
            referenceYear,
            period: PaymentPeriod.MONTHLY,
            dueDate: new Date(dueDate),

            amount: modalityPrice,
            discountAmount: totalDiscountAmount,
            finalAmount: totalFinalAmount,

            status: PaymentStatus.PENDING,

            observation: `Mensalidade de ${enrollment.modality.name}.`,
          },

          include: {
            enrollment: {
              include: {
                modality: true,
              },
            },
          },
        });

        payments.push(payment);
      }
    }

    const totalAmount = Number(
      payments
        .reduce(
          (total, payment) =>
            total + Number(payment.finalAmount),
          0,
        )
        .toFixed(2),
    );

    return {
      studentId: student.id,
      studentName: student.name,
      referenceMonth,
      referenceYear,
      payments,
      totalAmount,
    };
  }

  /**
   * Lista pagamentos.
   */
  async findAll(filters?: {
    studentId?: string;
    enrollmentId?: string;
    status?: PaymentStatus;
    period?: PaymentPeriod;
    referenceMonth?: number;
    referenceYear?: number;
  }) {
    return this.prisma.payment.findMany({
      where: {
        studentId: filters?.studentId,
        enrollmentId: filters?.enrollmentId,
        status: filters?.status,
        period: filters?.period,
        referenceMonth: filters?.referenceMonth,
        referenceYear: filters?.referenceYear,
      },
      include: {
        student: true,
        enrollment: {
          include: {
            modality: true,
            class: true,
          },
        },
      },
      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  /**
   * Retorna o resumo financeiro mensal de um aluno.
   */
  async getStudentMonthlySummary(
    studentId: string,
    referenceMonth: number,
    referenceYear: number,
  ) {
    const payments = await this.prisma.payment.findMany({
      where: {
        studentId,
        referenceMonth,
        referenceYear,
      },
      include: {
        enrollment: {
          include: {
            modality: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const total = payments.reduce(
      (sum, payment) =>
        sum + Number(payment.finalAmount),
      0,
    );

    const paid = payments
      .filter(
        (payment) =>
          payment.status === PaymentStatus.PAID,
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.finalAmount),
        0,
      );

    const pending = payments
      .filter(
        (payment) =>
          payment.status === PaymentStatus.PENDING,
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.finalAmount),
        0,
      );

    const overdue = payments
      .filter(
        (payment) =>
          payment.status === PaymentStatus.OVERDUE,
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.finalAmount),
        0,
      );

    return {
      studentId,
      referenceMonth,
      referenceYear,
      payments,
      total,
      paid,
      pending,
      overdue,
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: true,
        enrollment: {
          include: {
            modality: true,
            class: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        ...(updatePaymentDto.referenceMonth !== undefined && {
          referenceMonth:
            updatePaymentDto.referenceMonth,
        }),

        ...(updatePaymentDto.referenceYear !== undefined && {
          referenceYear:
            updatePaymentDto.referenceYear,
        }),

        ...(updatePaymentDto.dueDate !== undefined && {
          dueDate: new Date(updatePaymentDto.dueDate),
        }),

        ...(updatePaymentDto.method !== undefined && {
          method: updatePaymentDto.method,
        }),

        ...(updatePaymentDto.status !== undefined && {
          status: updatePaymentDto.status,
        }),

        ...(updatePaymentDto.transactionId !== undefined && {
          transactionId:
            updatePaymentDto.transactionId,
        }),

        ...(updatePaymentDto.observation !== undefined && {
          observation:
            updatePaymentDto.observation,
        }),
      },
      include: {
        student: true,
        enrollment: {
          include: {
            modality: true,
          },
        },
      },
    });
  }

  /**
   * Marca pagamento recebido.
   *
   * Principalmente utilizado por Aline para DINHEIRO.
   */
  async markAsPaid(
    id: string,
    method: PaymentMethod,
    transactionId?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    if (
      method === PaymentMethod.CASH &&
      transactionId
    ) {
      throw new BadRequestException(
        'Pagamento em dinheiro não possui transactionId.',
      );
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        method,
        transactionId:
          transactionId ?? null,
        paidAt: new Date(),
      },
      include: {
        student: true,
        enrollment: {
          include: {
            modality: true,
          },
        },
      },
    });
  }

  /**
   * Confirmação automática preparada para PIX/cartão.
   */
  async confirmOnlinePayment(
    id: string,
    method: PaymentMethod,
    transactionId: string,
  ) {
    if (
      method !== PaymentMethod.PIX &&
      method !== PaymentMethod.CARD
    ) {
      throw new BadRequestException(
        'Confirmação automática disponível apenas para PIX e cartão.',
      );
    }

    if (!transactionId) {
      throw new BadRequestException(
        'transactionId é obrigatório.',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        method,
        transactionId,
        paidAt: new Date(),
      },
      include: {
        student: true,
        enrollment: true,
      },
    });
  }

  /**
   * Marca como inadimplentes os pagamentos vencidos.
   */
  async updateOverduePayments() {
    const now = new Date();

    const result =
      await this.prisma.payment.updateMany({
        where: {
          status: PaymentStatus.PENDING,
          dueDate: {
            lt: now,
          },
        },
        data: {
          status: PaymentStatus.OVERDUE,
        },
      });

    return {
      updated: result.count,
    };
  }

  async findOverdue() {
    return this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.OVERDUE,
      },
      include: {
        student: true,
        enrollment: {
          include: {
            modality: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async cancel(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Um pagamento recebido não pode ser cancelado desta forma.',
      );
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.CANCELLED,
      },
    });
  }
}