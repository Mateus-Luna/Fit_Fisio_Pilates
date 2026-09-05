import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateModalityDto } from './dto/create-modality.dto';
import { UpdateModalityDto } from './dto/update-modality.dto';

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

    return this.prisma.modality.update({
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
