import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateModalityDto } from './dto/create-modality.dto';
import { UpdateModalityDto } from './dto/update-modality.dto';
import { EnrollmentStatus, PaymentPeriod, PaymentStatus } from 'generated/prisma/enums';

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

@Injectable()
export class ModalitiesService {
    constructor(private readonly prisma: PrismaService) {}

  private validateCapacity(
    requiresClass?: boolean,
    capacity?: number | null,
  ): void {
    if (
      requiresClass === true &&
      (capacity === undefined || capacity === null)
    ) {
      throw new BadRequestException(
        'Modalidades que exigem turma devem possuir capacidade definida.',
      );
    }

    if (
      capacity !== undefined &&
      capacity !== null &&
      capacity < 1
    ) {
      throw new BadRequestException(
        'A capacidade deve ser maior que zero.',
      );
    }
  }

  async create(createModalityDto: CreateModalityDto) {
    this.validateCapacity(
      createModalityDto.requiresClass,
      createModalityDto.capacity,
    );

    return this.prisma.modality.create({
      data: {
        name: createModalityDto.name,
        description: createModalityDto.description,
        monthlyPrice: createModalityDto.monthlyPrice,
        requiresClass: createModalityDto.requiresClass ?? false,
        capacity: createModalityDto.capacity,
      },
    });
  }

  async findAll() {
    return this.prisma.modality.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const modality = await this.prisma.modality.findUnique({
      where: { id },
    });

    if (!modality) {
      throw new NotFoundException(
        'Modalidade não encontrada.',
      );
    }

    return modality;
  }

  async update(
    id: string,
    updateModalityDto: UpdateModalityDto,
  ) {
    const currentModality = await this.findOne(id);

    const requiresClass =
      updateModalityDto.requiresClass ??
      currentModality.requiresClass;

    const capacity =
      updateModalityDto.capacity !== undefined
        ? updateModalityDto.capacity
        : currentModality.capacity;

    this.validateCapacity(
      requiresClass,
      capacity,
    );

    const updated = await this.prisma.modality.update({
      where: { id },
      data: {
        ...(updateModalityDto.name !== undefined && {
          name: updateModalityDto.name,
        }),

        ...(updateModalityDto.description !== undefined && {
          description: updateModalityDto.description,
        }),

        ...(updateModalityDto.monthlyPrice !== undefined && {
          monthlyPrice: updateModalityDto.monthlyPrice,
        }),

        ...(updateModalityDto.requiresClass !== undefined && {
          requiresClass: updateModalityDto.requiresClass,
        }),

        ...(updateModalityDto.capacity !== undefined && {
          capacity: updateModalityDto.capacity,
        }),
      },
    });

    if (updateModalityDto.monthlyPrice !== undefined) {
      const newPrice = Number(updateModalityDto.monthlyPrice);
      const activeEnrollments = await this.prisma.enrollment.findMany({
        where: {
          modalityId: id,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      for (const enr of activeEnrollments) {
        const pct = Number(enr.discountPercentage || 0);
        const totalDiscountAmount = Number(((newPrice * pct) / 100).toFixed(2));
        const totalFinalAmount = Number((newPrice - totalDiscountAmount).toFixed(2));

        const pendingPayments = await this.prisma.payment.findMany({
          where: {
            enrollmentId: enr.id,
            status: PaymentStatus.PENDING,
          },
        });

        for (const p of pendingPayments) {
          if (
            p.period === PaymentPeriod.FIRST_FORTNIGHT ||
            p.period === PaymentPeriod.SECOND_FORTNIGHT
          ) {
            const split = splitFortnightAmounts(newPrice, totalFinalAmount);
            const part =
              p.period === PaymentPeriod.FIRST_FORTNIGHT
                ? split.first
                : split.second;
            await this.prisma.payment.update({
              where: { id: p.id },
              data: {
                amount: part.amount,
                discountAmount: part.discountAmount,
                finalAmount: part.finalAmount,
              },
            });
          } else {
            await this.prisma.payment.update({
              where: { id: p.id },
              data: {
                amount: newPrice,
                discountAmount: totalDiscountAmount,
                finalAmount: totalFinalAmount,
              },
            });
          }
        }
      }
    }

    return updated;
  }

  async deactivate(id: string) {
    await this.findOne(id);

    return this.prisma.modality.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  async activate(id: string) {
    await this.findOne(id);

    return this.prisma.modality.update({
      where: { id },
      data: {
        active: true,
      },
    });
  }
}
