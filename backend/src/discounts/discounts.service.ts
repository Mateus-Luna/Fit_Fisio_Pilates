import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

import {
  DiscountCategory,
  DiscountType,
} from 'generated/prisma/enums';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateDiscount(
    category: DiscountCategory,
    type: DiscountType,
    value: number,
    minimumQuantity?: number | null,
  ): void {
    if (value < 0) {
      throw new BadRequestException(
        'O valor do desconto não pode ser negativo.',
      );
    }

    if (
      type === DiscountType.PERCENTAGE &&
      value > 100
    ) {
      throw new BadRequestException(
        'O desconto percentual não pode ser maior que 100%.',
      );
    }

    if (
      category === DiscountCategory.MULTIPLE_MODALITIES &&
      (minimumQuantity === undefined ||
        minimumQuantity === null)
    ) {
      throw new BadRequestException(
        'Descontos por múltiplas modalidades devem possuir uma quantidade mínima.',
      );
    }

    if (
      category === DiscountCategory.FAMILY &&
      (minimumQuantity === undefined ||
        minimumQuantity === null)
    ) {
      throw new BadRequestException(
        'Descontos familiares devem possuir uma quantidade mínima.',
      );
    }

    if (
      minimumQuantity !== undefined &&
      minimumQuantity !== null &&
      minimumQuantity < 2
    ) {
      throw new BadRequestException(
        'A quantidade mínima deve ser pelo menos 2.',
      );
    }

    if (
      category === DiscountCategory.MANUAL &&
      minimumQuantity !== undefined &&
      minimumQuantity !== null
    ) {
      throw new BadRequestException(
        'Descontos manuais não devem possuir quantidade mínima.',
      );
    }
  }

  async create(createDiscountDto: CreateDiscountDto) {
    const existingDiscount =
      await this.prisma.discountRule.findFirst({
        where: {
          name: createDiscountDto.name,
        },
      });

    if (existingDiscount) {
      throw new ConflictException(
        'Já existe uma regra de desconto com esse nome.',
      );
    }

    this.validateDiscount(
      createDiscountDto.category,
      createDiscountDto.type,
      createDiscountDto.value,
      createDiscountDto.minimumQuantity,
    );

    return this.prisma.discountRule.create({
      data: {
        name: createDiscountDto.name,
        category: createDiscountDto.category,
        type: createDiscountDto.type,
        minimumQuantity:
          createDiscountDto.minimumQuantity,
        value: createDiscountDto.value,
        active: createDiscountDto.active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.discountRule.findMany({
      orderBy: [
        {
          category: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const discount =
      await this.prisma.discountRule.findUnique({
        where: { id },
      });

    if (!discount) {
      throw new NotFoundException(
        'Regra de desconto não encontrada.',
      );
    }

    return discount;
  }

  async update(
    id: string,
    updateDiscountDto: UpdateDiscountDto,
  ) {
    const currentDiscount = await this.findOne(id);

    if (
      updateDiscountDto.name !== undefined &&
      updateDiscountDto.name !== currentDiscount.name
    ) {
      const existingDiscount =
        await this.prisma.discountRule.findFirst({
          where: {
            name: updateDiscountDto.name,
            NOT: {
              id,
            },
          },
        });

      if (existingDiscount) {
        throw new ConflictException(
          'Já existe uma regra de desconto com esse nome.',
        );
      }
    }

    const category =
      updateDiscountDto.category ??
      currentDiscount.category;

    const type =
      updateDiscountDto.type ??
      currentDiscount.type;

    const value =
      updateDiscountDto.value ??
      Number(currentDiscount.value);

    const minimumQuantity =
      updateDiscountDto.minimumQuantity !== undefined
        ? updateDiscountDto.minimumQuantity
        : currentDiscount.minimumQuantity;

    this.validateDiscount(
      category,
      type,
      value,
      minimumQuantity,
    );

    return this.prisma.discountRule.update({
      where: { id },
      data: {
        ...(updateDiscountDto.name !== undefined && {
          name: updateDiscountDto.name,
        }),

        ...(updateDiscountDto.category !== undefined && {
          category: updateDiscountDto.category,
        }),

        ...(updateDiscountDto.type !== undefined && {
          type: updateDiscountDto.type,
        }),

        ...(updateDiscountDto.minimumQuantity !== undefined && {
          minimumQuantity:
            updateDiscountDto.minimumQuantity,
        }),

        ...(updateDiscountDto.value !== undefined && {
          value: updateDiscountDto.value,
        }),

        ...(updateDiscountDto.active !== undefined && {
          active: updateDiscountDto.active,
        }),
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);

    return this.prisma.discountRule.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  async activate(id: string) {
    await this.findOne(id);

    return this.prisma.discountRule.update({
      where: { id },
      data: {
        active: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.discountRule.delete({
      where: { id },
    });
  }
}