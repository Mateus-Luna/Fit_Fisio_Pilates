import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createClassDto: CreateClassDto) {
    const modality = await this.prisma.modality.findUnique({
      where: {
        id: createClassDto.modalityId,
      },
    });

    if (!modality) {
      throw new NotFoundException(
        'Modalidade não encontrada.',
      );
    }

    if (!modality.active) {
      throw new BadRequestException(
        'Não é possível criar uma turma para uma modalidade inativa.',
      );
    }

    if (!modality.requiresClass) {
      throw new BadRequestException(
        'Esta modalidade não exige turmas.',
      );
    }

    this.validateSchedules(createClassDto.schedules);

    return this.prisma.class.create({
      data: {
        name: createClassDto.name.trim(),
        modalityId: createClassDto.modalityId,
        capacity: createClassDto.capacity,
        schedules: createClassDto.schedules
          ? {
              create: createClassDto.schedules.map(
                (schedule) => ({
                  dayOfWeek: schedule.dayOfWeek,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime,
                  room: schedule.room?.trim() || null,
                }),
              ),
            }
          : undefined,
      },
      include: {
        modality: true,
        schedules: true,
      },
    });
  }

  async findAll(modalityId?: string) {
    const classes = await this.prisma.class.findMany({
      where: modalityId
        ? {
            modalityId,
          }
        : undefined,
      include: {
        modality: true,
        schedules: true,
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: [
                    'PENDING_DOCUMENTATION',
                    'AWAITING_APPROVAL',
                    'ACTIVE',
                    'SUSPENDED',
                  ],
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return classes.map((classItem) => ({
      ...classItem,
      enrolledCount: classItem._count.enrollments,
      _count: undefined,
    }));
  }

  async findOne(id: string) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id,
      },
      include: {
        modality: true,
        schedules: true,
        enrollments: {
          where: {
            status: {
              in: [
                'PENDING_DOCUMENTATION',
                'AWAITING_APPROVAL',
                'ACTIVE',
                'SUSPENDED',
              ],
            },
          },
          include: {
            student: true,
          },
          orderBy: {
            student: {
              name: 'asc',
            },
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException(
        'Turma não encontrada.',
      );
    }

    return {
      ...classItem,
      enrolledCount: classItem.enrollments.length,
    };
  }

  async update(
    id: string,
    updateClassDto: UpdateClassDto,
  ) {
    const existingClass =
      await this.prisma.class.findUnique({
        where: {
          id,
        },
        include: {
          modality: true,
        },
      });

    if (!existingClass) {
      throw new NotFoundException(
        'Turma não encontrada.',
      );
    }

    let modalityId = existingClass.modalityId;

    if (updateClassDto.modalityId) {
      const modality =
        await this.prisma.modality.findUnique({
          where: {
            id: updateClassDto.modalityId,
          },
        });

      if (!modality) {
        throw new NotFoundException(
          'Modalidade não encontrada.',
        );
      }

      if (!modality.active) {
        throw new BadRequestException(
          'Não é possível associar a turma a uma modalidade inativa.',
        );
      }

      if (!modality.requiresClass) {
        throw new BadRequestException(
          'Esta modalidade não exige turmas.',
        );
      }

      modalityId = modality.id;
    }

    if (updateClassDto.schedules) {
      this.validateSchedules(
        updateClassDto.schedules.filter(
          (schedule) => schedule.dayOfWeek !== undefined,
        ) as any,
      );
    }

    if (updateClassDto.capacity !== undefined) {
      const enrolledCount =
        await this.prisma.enrollment.count({
          where: {
            classId: id,
            status: {
              in: [
                'PENDING_DOCUMENTATION',
                'AWAITING_APPROVAL',
                'ACTIVE',
                'SUSPENDED',
              ],
            },
          },
        });

      if (
        updateClassDto.capacity < enrolledCount
      ) {
        throw new BadRequestException(
          `A capacidade não pode ser menor que o número atual de alunos vinculados à turma (${enrolledCount}).`,
        );
      }
    }

    return this.prisma.$transaction(
      async (transaction) => {
        if (updateClassDto.schedules) {
          await transaction.classSchedule.deleteMany({
            where: {
              classId: id,
            },
          });
        }

        return transaction.class.update({
          where: {
            id,
          },
          data: {
            name: updateClassDto.name?.trim(),
            modalityId,
            capacity: updateClassDto.capacity,
            active: updateClassDto.active,
            schedules: updateClassDto.schedules
              ? {
                  create:
                    updateClassDto.schedules.map(
                      (schedule) => ({
                        dayOfWeek:
                          schedule.dayOfWeek!,
                        startTime:
                          schedule.startTime!,
                        endTime:
                          schedule.endTime!,
                        room:
                          schedule.room?.trim() ||
                          null,
                      }),
                    ),
                }
              : undefined,
          },
          include: {
            modality: true,
            schedules: true,
          },
        });
      },
    );
  }

  async remove(id: string) {
    const existingClass =
      await this.prisma.class.findUnique({
        where: {
          id,
        },
      });

    if (!existingClass) {
      throw new NotFoundException(
        'Turma não encontrada.',
      );
    }

    const enrolledCount =
      await this.prisma.enrollment.count({
        where: {
          classId: id,
          status: {
            in: [
              'PENDING_DOCUMENTATION',
              'AWAITING_APPROVAL',
              'ACTIVE',
              'SUSPENDED',
            ],
          },
        },
      });

    if (enrolledCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma turma que possui alunos vinculados.',
      );
    }

    await this.prisma.class.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Turma excluída com sucesso.',
    };
  }

  private validateSchedules(
    schedules:
      | {
          dayOfWeek: number;
          startTime: string;
          endTime: string;
        }[]
      | undefined,
  ) {
    if (!schedules) {
      return;
    }

    for (const schedule of schedules) {
      if (
        !/^\d{2}:\d{2}$/.test(schedule.startTime) ||
        !/^\d{2}:\d{2}$/.test(schedule.endTime)
      ) {
        throw new BadRequestException(
          'Os horários devem estar no formato HH:mm.',
        );
      }

      const [startHour, startMinute] =
        schedule.startTime
          .split(':')
          .map(Number);

      const [endHour, endMinute] =
        schedule.endTime
          .split(':')
          .map(Number);

      if (
        startHour > 23 ||
        startMinute > 59 ||
        endHour > 23 ||
        endMinute > 59
      ) {
        throw new BadRequestException(
          'Horário inválido.',
        );
      }

      const start =
        startHour * 60 + startMinute;

      const end =
        endHour * 60 + endMinute;

      if (start >= end) {
        throw new BadRequestException(
          'O horário inicial deve ser anterior ao horário final.',
        );
      }
    }
  }
}