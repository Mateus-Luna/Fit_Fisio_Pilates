import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {
  EnrollmentStatus,
  PaymentMethod,
  PaymentStatus,
} from 'generated/prisma/enums';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma mensalidade a partir de uma matrícula.
   *
   * O valor NÃO é recebido do frontend.
   * Ele é obtido diretamente de Enrollment.finalPrice.
   */
  async create(createPaymentDto: CreatePaymentDto) {
    const {
      studentId,
      enrollmentId,
      referenceMonth,
      referenceYear,
      dueDate,
      observation,
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

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        enrollmentId,
        referenceMonth,
        referenceYear,
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Já existe uma mensalidade para esta matrícula neste mês.',
      );
    }

    const finalAmount = Number(enrollment.finalPrice);
    const contractedPrice = Number(enrollment.contractedPrice);

    const discountAmount = Number(enrollment.discountAmount);

    return this.prisma.payment.create({
      data: {
        studentId,
        enrollmentId,
        referenceMonth,
        referenceYear,
        dueDate: new Date(dueDate),

        amount: contractedPrice,
        discountAmount,
        finalAmount,

        status: PaymentStatus.PENDING,

        observation:
          observation ??
          `Mensalidade de ${enrollment.modality.name}.`,
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
   * Exemplo:
   *
   * Pilates       R$ 150
   * Natação       R$ 120
   * Hidroginástica R$ 180
   *
   * Serão criados 3 Payments.
   *
   * Total mensal do aluno = R$ 450.
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
      const existingPayment =
        await this.prisma.payment.findFirst({
          where: {
            enrollmentId: enrollment.id,
            referenceMonth,
            referenceYear,
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
          dueDate: new Date(dueDate),

          amount: enrollment.contractedPrice,
          discountAmount: enrollment.discountAmount,
          finalAmount: enrollment.finalPrice,

          status: PaymentStatus.PENDING,

          observation:
            `Mensalidade de ${enrollment.modality.name}.`,
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

    const totalAmount = payments.reduce(
      (total, payment) =>
        total + Number(payment.finalAmount),
      0,
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
    referenceMonth?: number;
    referenceYear?: number;
  }) {
    return this.prisma.payment.findMany({
      where: {
        studentId: filters?.studentId,
        enrollmentId: filters?.enrollmentId,
        status: filters?.status,
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