import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StudentType } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
     constructor(private readonly prisma: PrismaService) {}

  private calculateAge(birthDate: Date): number {
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
      today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private validateStudentData(
    birthDate: Date,
    type: StudentType,
    cpf?: string,
    rg?: string,
  ): void {
    const age = this.calculateAge(birthDate);

    if (age < 0) {
      throw new BadRequestException(
        'A data de nascimento não pode estar no futuro.',
      );
    }

    const expectedType =
      age >= 18
        ? StudentType.ADULT
        : StudentType.CHILD;

    if (type !== expectedType) {
      throw new BadRequestException(
        `O tipo do aluno é incompatível com a idade. ` +
          `Alunos com ${age} anos devem ser cadastrados como ` +
          `${expectedType === StudentType.ADULT ? 'adultos' : 'crianças'}.`,
      );
    }

    if (type === StudentType.CHILD && (cpf || rg)) {
      throw new BadRequestException(
        'CPF e RG só podem ser informados para alunos adultos.',
      );
    }
  }

  private async validateFamily(familyId?: string): Promise<void> {
    if (!familyId) {
      return;
    }

    const family = await this.prisma.family.findUnique({
      where: {
        id: familyId,
      },
    });

    if (!family) {
      throw new NotFoundException(
        'Família não encontrada.',
      );
    }
  }

  async create(createStudentDto: CreateStudentDto) {
    const birthDate = new Date(createStudentDto.birthDate);

    this.validateStudentData(
      birthDate,
      createStudentDto.type,
      createStudentDto.cpf,
      createStudentDto.rg,
    );

    await this.validateFamily(
      createStudentDto.familyId ?? undefined,
    );

    return this.prisma.student.create({
      data: {
        name: createStudentDto.name,
        birthDate,
        type: createStudentDto.type,
        phone: createStudentDto.phone,
        address: createStudentDto.address,
        observation: createStudentDto.observation,
        rg:
          createStudentDto.type === StudentType.ADULT
            ? createStudentDto.rg
            : null,
        cpf:
          createStudentDto.type === StudentType.ADULT
            ? createStudentDto.cpf
            : null,
        familyId: createStudentDto.familyId,
      },
      include: {
        family: true,
      },
    });
  }

  async findAll() {
    return this.prisma.student.findMany({
      include: {
        family: true,
        enrollments: {
          include: {
            modality: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: {
        id,
      },
      include: {
        family: true,
        enrollments: {
          include: {
            modality: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(
        'Aluno não encontrado.',
      );
    }

    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ) {
    const currentStudent = await this.findOne(id);

    const birthDate = updateStudentDto.birthDate
      ? new Date(updateStudentDto.birthDate)
      : currentStudent.birthDate;

    const type =
      updateStudentDto.type ?? currentStudent.type;

    const cpf =
      updateStudentDto.cpf !== undefined
        ? updateStudentDto.cpf
        : currentStudent.cpf ?? undefined;

    const rg =
      updateStudentDto.rg !== undefined
        ? updateStudentDto.rg
        : currentStudent.rg ?? undefined;

    this.validateStudentData(
      birthDate,
      type,
      cpf,
      rg,
    );

    if (updateStudentDto.familyId !== undefined) {
      await this.validateFamily(
        updateStudentDto.familyId ?? undefined,
      );
    }

    return this.prisma.student.update({
      where: {
        id,
      },
      data: {
        ...(updateStudentDto.name !== undefined && {
          name: updateStudentDto.name,
        }),

        ...(updateStudentDto.birthDate !== undefined && {
          birthDate,
        }),

        ...(updateStudentDto.type !== undefined && {
          type,
        }),

        ...(updateStudentDto.phone !== undefined && {
          phone: updateStudentDto.phone,
        }),

        ...(updateStudentDto.address !== undefined && {
          address: updateStudentDto.address,
        }),

        ...(updateStudentDto.observation !== undefined && {
          observation: updateStudentDto.observation,
        }),

        ...(updateStudentDto.familyId !== undefined && {
          familyId: updateStudentDto.familyId,
        }),

        ...(type === StudentType.ADULT && {
          cpf,
          rg,
        }),

        ...(type === StudentType.CHILD && {
          cpf: null,
          rg: null,
        }),
      },
      include: {
        family: true,
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);

    return this.prisma.student.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
  }

  async activate(id: string) {
    await this.findOne(id);

    return this.prisma.student.update({
      where: {
        id,
      },
      data: {
        active: true,
      },
    });
  }

  async remove(id: string) {
    const student = await this.findOne(id);

    if (student.enrollments.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir um aluno que possui matrículas. ' +
          'Desative o cadastro em vez de excluí-lo.',
      );
    }

    return this.prisma.student.delete({
      where: {
        id,
      },
    });
  }
}
