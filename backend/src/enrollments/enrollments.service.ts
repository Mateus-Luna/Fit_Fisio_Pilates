import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus } from '../../generated/prisma/enums';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Decimal } from 'decimal.js';
import { DiscountsService } from '../discounts/discounts.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discountsService: DiscountsService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const {
      studentId,
      modalityId,
      startDate,
      endDate,
      discountPercentage = 0,
      observation,
      classId,
    } = createEnrollmentDto;

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    const modality = await this.prisma.modality.findUnique({
      where: { id: modalityId },
    });

    if (!modality) {
      throw new NotFoundException('Modalidade não encontrada.');
    }

    if (!modality.active) {
      throw new BadRequestException(
        'Não é possível realizar matrícula em uma modalidade inativa.',
      );
    }

    if (
      discountPercentage < 0 ||
      discountPercentage > 100
    ) {
      throw new BadRequestException(
        'O desconto deve estar entre 0% e 100%.',
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate
      ? new Date(endDate)
      : undefined;

    if (
      parsedEndDate &&
      parsedEndDate < parsedStartDate
    ) {
      throw new BadRequestException(
        'A data de término não pode ser anterior à data de início.',
      );
    }

    const existingEnrollment =
      await this.prisma.enrollment.findFirst({
        where: {
          studentId,
          modalityId,
          status: {
            in: [
              EnrollmentStatus.PENDING_DOCUMENTATION,
              EnrollmentStatus.AWAITING_APPROVAL,
              EnrollmentStatus.ACTIVE,
              EnrollmentStatus.SUSPENDED,
            ],
          },
        },
      });

    if (existingEnrollment) {
      throw new ConflictException(
        'O aluno já possui uma matrícula nessa modalidade.',
      );
    }

    await this.validateClassForEnrollment(
        classId,
        modalityId,
      );

    const contractedPrice = new Decimal(
  modality.monthlyPrice.toString(),
);

const discountCalculation  =
  this.discountsService.calculate(
    Number(contractedPrice.toString()),
    discountPercentage,
  );

    return this.prisma.enrollment.create({
      data: {
        studentId,
        modalityId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,

        status: EnrollmentStatus.PENDING_DOCUMENTATION,

        contractedPrice:
          discountCalculation.contractedPrice.toString(),

        discountPercentage:
          discountCalculation.discountPercentage.toString(),

        discountAmount:
          discountCalculation.discountAmount.toString(),

        finalPrice:
          discountCalculation.finalPrice.toString(),

        observation,
        classId,
      },

      include: {
        student: true,
        modality: true,
        class: true,
      },
    });
  }

  async findAll(
    studentId?: string,
    modalityId?: string,
    status?: EnrollmentStatus,
  ) {
    return this.prisma.enrollment.findMany({
      where: {
        studentId,
        modalityId,
        status,
      },

      include: {
        student: true,
        modality: true,
        class: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const enrollment =
      await this.prisma.enrollment.findUnique({
        where: { id },

        include: {
          student: true,
          modality: true,
          class: true,
          payments: true,
          attendances: true,
        },
      });

    if (!enrollment) {
      throw new NotFoundException(
        'Matrícula não encontrada.',
      );
    }

    return enrollment;
  }

  async update(
      id: string,
      updateEnrollmentDto: UpdateEnrollmentDto,
    ) {
      const enrollment =
        await this.prisma.enrollment.findUnique({
          where: { id },
        });

      if (!enrollment) {
        throw new NotFoundException(
          'Matrícula não encontrada.',
        );
      }

      if (
        enrollment.status === EnrollmentStatus.CANCELLED ||
        enrollment.status === EnrollmentStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'Não é possível editar uma matrícula cancelada ou concluída.',
        );
      }

      const {
        modalityId,
        startDate,
        endDate,
        discountPercentage,
        observation,
        classId,
      } = updateEnrollmentDto;

      let contractedPrice = new Decimal(
        enrollment.contractedPrice.toString(),
      );

      let newDiscountPercentage = new Decimal(
        enrollment.discountPercentage.toString(),
      );

      let discountAmount = new Decimal(
        enrollment.discountAmount.toString(),
      );

      let finalPrice = new Decimal(
        enrollment.finalPrice.toString(),
      );

      /*
      * Validação da nova modalidade
      */
      if (
        modalityId &&
        modalityId !== enrollment.modalityId
      ) {
        const modality =
          await this.prisma.modality.findUnique({
            where: { id: modalityId },
          });

        if (!modality) {
          throw new NotFoundException(
            'Modalidade não encontrada.',
          );
        }

        if (!modality.active) {
          throw new BadRequestException(
            'Não é possível utilizar uma modalidade inativa.',
          );
        }

        const existingEnrollment =
          await this.prisma.enrollment.findFirst({
            where: {
              studentId: enrollment.studentId,
              modalityId,
              id: {
                not: id,
              },
              status: {
                in: [
                  EnrollmentStatus.PENDING_DOCUMENTATION,
                  EnrollmentStatus.AWAITING_APPROVAL,
                  EnrollmentStatus.ACTIVE,
                  EnrollmentStatus.SUSPENDED,
                ],
              },
            },
          });

        if (existingEnrollment) {
          throw new ConflictException(
            'O aluno já possui uma matrícula nessa modalidade.',
          );
        }

        contractedPrice = new Decimal(
          modality.monthlyPrice.toString(),
        );
      }

      /*
      * Validação do desconto
      */
      if (
        discountPercentage !== undefined &&
        (discountPercentage < 0 ||
          discountPercentage > 100)
      ) {
        throw new BadRequestException(
          'O desconto deve estar entre 0% e 100%.',
        );
      }

      if (discountPercentage !== undefined) {
        newDiscountPercentage = new Decimal(
          discountPercentage,
        );
      }

      /*
      * Recalcula os valores financeiros quando
      * modalidade ou desconto forem alterados.
      */
      if (
        modalityId ||
        discountPercentage !== undefined
      ) {
        const discountCalculation =
          this.discountsService.calculate(
            Number(contractedPrice.toString()),
            Number(newDiscountPercentage.toString()),
          );

        discountAmount = new Decimal(
          discountCalculation.discountAmount,
        );

        finalPrice = new Decimal(
          discountCalculation.finalPrice,
        );

        newDiscountPercentage = new Decimal(
          discountCalculation.discountPercentage,
        );

        contractedPrice = new Decimal(
          discountCalculation.contractedPrice,
        );
      }

      /*
      * Validação das datas
      */
      const effectiveStartDate = startDate
        ? new Date(startDate)
        : enrollment.startDate;

      const effectiveEndDate =
        endDate !== undefined
          ? endDate
            ? new Date(endDate)
            : null
          : enrollment.endDate;

      if (
        effectiveEndDate &&
        effectiveEndDate < effectiveStartDate
      ) {
        throw new BadRequestException(
          'A data de término não pode ser anterior à data de início.',
        );
      }

      /*
      * Define a modalidade efetiva da matrícula.
      */
      const effectiveModalityId =
        modalityId ?? enrollment.modalityId;

      /*
      * Define a turma efetiva.
      *
      * - classId enviado como string -> usa a nova turma
      * - classId enviado como null -> remove a turma
      * - classId não enviado -> mantém a turma atual
      * - se a modalidade mudou e nenhuma turma foi enviada,
      *   remove a turma anterior
      */
      const effectiveClassId =
        classId !== undefined
          ? classId
          : modalityId &&
              modalityId !== enrollment.modalityId
            ? null
            : enrollment.classId;

      /*
      * Valida:
      * - se a modalidade exige turma
      * - existência da turma
      * - modalidade da turma
      * - turma ativa
      * - capacidade da turma
      */
      await this.validateClassForEnrollment(
        effectiveClassId,
        effectiveModalityId,
        id,
      );

      /*
      * Atualiza a matrícula.
      */
      return this.prisma.enrollment.update({
        where: { id },

        data: {
          modalityId:
            modalityId !== undefined
              ? modalityId
              : undefined,

          startDate: startDate
            ? new Date(startDate)
            : undefined,

          endDate:
            endDate !== undefined
              ? endDate
                ? new Date(endDate)
                : null
              : undefined,

          contractedPrice:
            contractedPrice.toString(),

          discountPercentage:
            newDiscountPercentage.toString(),

          discountAmount:
            discountAmount.toString(),

          finalPrice:
            finalPrice.toString(),

          observation,

          classId: effectiveClassId,
        },

        include: {
          student: true,
          modality: true,
          class: true,
        },
      });
    }

  async requestApproval(id: string) {
    const enrollment = await this.findOne(id);

    if (
      enrollment.status !==
      EnrollmentStatus.PENDING_DOCUMENTATION
    ) {
      throw new BadRequestException(
        'A matrícula precisa estar pendente de documentação.',
      );
    }

    return this.prisma.enrollment.update({
      where: { id },

      data: {
        status:
          EnrollmentStatus.AWAITING_APPROVAL,
      },

      include: {
        student: true,
        modality: true,
        class: true,
      },
    });
  }

  async approve(id: string) {
    const enrollment = await this.findOne(id);

    if (
      enrollment.status !==
      EnrollmentStatus.AWAITING_APPROVAL
    ) {
      throw new BadRequestException(
        'A matrícula precisa estar aguardando aprovação para ser homologada.',
      );
    }

    return this.prisma.enrollment.update({
      where: { id },

      data: {
        status: EnrollmentStatus.ACTIVE,
        approvedAt: new Date(),
      },

      include: {
        student: true,
        modality: true,
        class: true,
      },
    });
  }

  async suspend(id: string) {
    const enrollment = await this.findOne(id);

    if (
      enrollment.status !==
      EnrollmentStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Somente matrículas ativas podem ser suspensas.',
      );
    }

    return this.prisma.enrollment.update({
      where: { id },

      data: {
        status: EnrollmentStatus.SUSPENDED,
      },

      include: {
        student: true,
        modality: true,
        class: true,
      },
    });
  }

  async reactivate(id: string) {
    const enrollment = await this.findOne(id);

    if (
      enrollment.status !==
      EnrollmentStatus.SUSPENDED
    ) {
      throw new BadRequestException(
        'Somente matrículas suspensas podem ser reativadas.',
      );
    }

    return this.prisma.enrollment.update({
      where: { id },

      data: {
        status: EnrollmentStatus.ACTIVE,
      },

      include: {
        student: true,
        modality: true,
        class: true,
      },
    });
  }

  async cancel(id: string) {
    const enrollment = await this.findOne(id);

    if (
      enrollment.status ===
        EnrollmentStatus.CANCELLED ||
      enrollment.status ===
        EnrollmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'A matrícula já está encerrada.',
      );
    }

    return this.prisma.enrollment.update({
      where: { id },

      data: {
        status: EnrollmentStatus.CANCELLED,
        endDate:
          enrollment.endDate ?? new Date(),
      },

      include: {
        student: true,
        modality: true,
        class: true,
      },
    });
  }

  async remove(id: string) {
    return this.cancel(id);
  }

  private async validateClassForEnrollment(
  classId: string | null | undefined,
  modalityId: string,
  enrollmentIdToIgnore?: string,
) {
  const modality = await this.prisma.modality.findUnique({
    where: { id: modalityId },
  });

  if (!modality) {
    throw new NotFoundException(
      'Modalidade não encontrada.',
    );
  }

  if (modality.requiresClass && !classId) {
    throw new BadRequestException(
      'Esta modalidade exige a seleção de uma turma.',
    );
  }

  if (!classId) {
    return;
  }

  const classEntity =
    await this.prisma.class.findUnique({
      where: { id: classId },
    });

  if (!classEntity) {
    throw new NotFoundException(
      'Turma não encontrada.',
    );
  }

  if (classEntity.modalityId !== modalityId) {
    throw new BadRequestException(
      'A turma selecionada não pertence à modalidade da matrícula.',
    );
  }

  if (!classEntity.active) {
    throw new BadRequestException(
      'Não é possível matricular o aluno em uma turma inativa.',
    );
  }

  const enrolledCount =
    await this.prisma.enrollment.count({
      where: {
        classId,
        status: {
          in: [
            EnrollmentStatus.PENDING_DOCUMENTATION,
            EnrollmentStatus.AWAITING_APPROVAL,
            EnrollmentStatus.ACTIVE,
            EnrollmentStatus.SUSPENDED,
          ],
        },
        ...(enrollmentIdToIgnore
          ? {
              id: {
                not: enrollmentIdToIgnore,
              },
            }
          : {}),
      },
    });

  if (
    classEntity.capacity !== null &&
    enrolledCount >= classEntity.capacity
  ) {
    throw new ConflictException(
      'A turma selecionada está lotada.',
    );
  }
}
}