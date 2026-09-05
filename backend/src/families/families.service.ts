import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Injectable()
export class FamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFamilyDto: CreateFamilyDto) {
    return this.prisma.family.create({
      data: {
        name: createFamilyDto.name,
        observation: createFamilyDto.observation,
      },
      include: {
        students: true,
      },
    });
  }

  async findAll() {
    return this.prisma.family.findMany({
      include: {
        students: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: {
        students: true,
      },
    });

    if (!family) {
      throw new NotFoundException('Família não encontrada.');
    }

    return family;
  }

  async update(
    id: string,
    updateFamilyDto: UpdateFamilyDto,
  ) {
    await this.findOne(id);

    return this.prisma.family.update({
      where: { id },
      data: {
        name: updateFamilyDto.name,
        observation: updateFamilyDto.observation,
      },
      include: {
        students: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.family.delete({
      where: { id },
    });
  }
}