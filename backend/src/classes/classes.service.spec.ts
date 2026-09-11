import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';

import { ClassesService } from './classes.service';

describe('ClassesService', () => {
  let service: ClassesService;

  let prisma: {
    modality: {
      findUnique: Mock<(...args: any[]) => any>;
    };
    class: {
      create: Mock<(...args: any[]) => any>;
      findMany: Mock<(...args: any[]) => any>;
      findUnique: Mock<(...args: any[]) => any>;
      update: Mock<(...args: any[]) => any>;
      delete: Mock<(...args: any[]) => any>;
    };
    classSchedule: {
      deleteMany: Mock<(...args: any[]) => any>;
    };
    enrollment: {
      count: Mock<(...args: any[]) => any>;
    };
    $transaction: Mock<(...args: any[]) => any>;
  };

  const mockModality = {
    id: 'modality-1',
    name: 'Pilates',
    active: true,
    requiresClass: true,
  };

  const mockClass = {
    id: 'class-1',
    name: 'Pilates - Manhã',
    modalityId: 'modality-1',
    capacity: 8,
    active: true,
  };

  const mockSchedule = {
    id: 'schedule-1',
    classId: 'class-1',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '08:50',
    room: 'Sala 1',
    active: true,
  };

  beforeEach(() => {
    prisma = {
      modality: {
        findUnique: jest.fn(),
      },
      class: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      classSchedule: {
        deleteMany: jest.fn(),
      },
      enrollment: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new ClassesService(prisma as any);
  });

  describe('create', () => {
    const createDto = {
      name: '  Pilates - Manhã  ',
      modalityId: 'modality-1',
      capacity: 8,
      schedules: [
        {
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '08:50',
          room: '  Sala 1  ',
        },
      ],
    };

    it('should create a class successfully', async () => {
      prisma.modality.findUnique.mockResolvedValue(
        mockModality,
      );

      prisma.class.create.mockResolvedValue({
        ...mockClass,
        name: 'Pilates - Manhã',
        schedules: [mockSchedule],
      });

      const result = await service.create(createDto);

      expect(result).toEqual({
        ...mockClass,
        name: 'Pilates - Manhã',
        schedules: [mockSchedule],
      });

      expect(prisma.modality.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'modality-1',
        },
      });

      expect(prisma.class.create).toHaveBeenCalledWith({
        data: {
          name: 'Pilates - Manhã',
          modalityId: 'modality-1',
          capacity: 8,
          schedules: {
            create: [
              {
                dayOfWeek: 1,
                startTime: '08:00',
                endTime: '08:50',
                room: 'Sala 1',
              },
            ],
          },
        },
        include: {
          modality: true,
          schedules: true,
        },
      });
    });

    it('should throw when modality does not exist', async () => {
      prisma.modality.findUnique.mockResolvedValue(null);

      await expect(
        service.create(createDto),
      ).rejects.toThrow(
        'Modalidade não encontrada.',
      );

      expect(prisma.class.create).not.toHaveBeenCalled();
    });

    it('should throw when modality is inactive', async () => {
      prisma.modality.findUnique.mockResolvedValue({
        ...mockModality,
        active: false,
      });

      await expect(
        service.create(createDto),
      ).rejects.toThrow(
        'Não é possível criar uma turma para uma modalidade inativa.',
      );

      expect(prisma.class.create).not.toHaveBeenCalled();
    });

    it('should throw when modality does not require classes', async () => {
      prisma.modality.findUnique.mockResolvedValue({
        ...mockModality,
        requiresClass: false,
      });

      await expect(
        service.create(createDto),
      ).rejects.toThrow(
        'Esta modalidade não exige turmas.',
      );

      expect(prisma.class.create).not.toHaveBeenCalled();
    });

    it('should create a class without schedules', async () => {
      prisma.modality.findUnique.mockResolvedValue(
        mockModality,
      );

      prisma.class.create.mockResolvedValue(mockClass);

      await service.create({
        name: 'Pilates Livre',
        modalityId: 'modality-1',
        capacity: 8,
      });

      expect(prisma.class.create).toHaveBeenCalledWith({
        data: {
          name: 'Pilates Livre',
          modalityId: 'modality-1',
          capacity: 8,
          schedules: undefined,
        },
        include: {
          modality: true,
          schedules: true,
        },
      });
    });

    it('should throw when schedule time format is invalid', async () => {
      prisma.modality.findUnique.mockResolvedValue(
        mockModality,
      );

      await expect(
        service.create({
          ...createDto,
          schedules: [
            {
              dayOfWeek: 1,
              startTime: '8:00',
              endTime: '08:50',
            },
          ],
        }),
      ).rejects.toThrow(
        'Os horários devem estar no formato HH:mm.',
      );

      expect(prisma.class.create).not.toHaveBeenCalled();
    });

    it('should throw when schedule contains invalid hour or minute', async () => {
      prisma.modality.findUnique.mockResolvedValue(
        mockModality,
      );

      await expect(
        service.create({
          ...createDto,
          schedules: [
            {
              dayOfWeek: 1,
              startTime: '25:00',
              endTime: '25:50',
            },
          ],
        }),
      ).rejects.toThrow(
        'Horário inválido.',
      );

      expect(prisma.class.create).not.toHaveBeenCalled();
    });

    it('should throw when schedule starts at the same time it ends', async () => {
      prisma.modality.findUnique.mockResolvedValue(
        mockModality,
      );

      await expect(
        service.create({
          ...createDto,
          schedules: [
            {
              dayOfWeek: 1,
              startTime: '08:00',
              endTime: '08:00',
            },
          ],
        }),
      ).rejects.toThrow(
        'O horário inicial deve ser anterior ao horário final.',
      );

      expect(prisma.class.create).not.toHaveBeenCalled();
    });

    it('should throw when schedule starts after it ends', async () => {
      prisma.modality.findUnique.mockResolvedValue(
        mockModality,
      );

      await expect(
        service.create({
          ...createDto,
          schedules: [
            {
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '08:00',
            },
          ],
        }),
      ).rejects.toThrow(
        'O horário inicial deve ser anterior ao horário final.',
      );

      expect(prisma.class.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all classes with enrolledCount', async () => {
      prisma.class.findMany.mockResolvedValue([
        {
          ...mockClass,
          schedules: [mockSchedule],
          modality: mockModality,
          _count: {
            enrollments: 3,
          },
        },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          ...mockClass,
          schedules: [mockSchedule],
          modality: mockModality,
          enrolledCount: 3,
          _count: undefined,
        },
      ]);

      expect(prisma.class.findMany).toHaveBeenCalledWith({
        where: undefined,
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
    });

    it('should filter classes by modalityId', async () => {
      prisma.class.findMany.mockResolvedValue([]);

      await service.findAll('modality-1');

      expect(prisma.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            modalityId: 'modality-1',
          },
        }),
      );
    });

    it('should count only active enrollment statuses', async () => {
      prisma.class.findMany.mockResolvedValue([
        {
          ...mockClass,
          _count: {
            enrollments: 4,
          },
        },
      ]);

      await service.findAll();

      expect(prisma.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
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
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a class with enrolledCount', async () => {
      prisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        modality: mockModality,
        schedules: [mockSchedule],
        enrollments: [
          {
            id: 'enrollment-1',
            student: {
              id: 'student-1',
              name: 'João da Silva',
            },
          },
          {
            id: 'enrollment-2',
            student: {
              id: 'student-2',
              name: 'Maria da Silva',
            },
          },
        ],
      });

      const result = await service.findOne('class-1');

      expect(result).toEqual({
        ...mockClass,
        modality: mockModality,
        schedules: [mockSchedule],
        enrollments: [
          {
            id: 'enrollment-1',
            student: {
              id: 'student-1',
              name: 'João da Silva',
            },
          },
          {
            id: 'enrollment-2',
            student: {
              id: 'student-2',
              name: 'Maria da Silva',
            },
          },
        ],
        enrolledCount: 2,
      });
    });

    it('should throw when class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('class-1'),
      ).rejects.toThrow(
        'Turma não encontrada.',
      );
    });

    it('should request only active enrollment statuses', async () => {
      prisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        modality: mockModality,
        schedules: [],
        enrollments: [],
      });

      await service.findOne('class-1');

      expect(prisma.class.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
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
          }),
        }),
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        modality: mockModality,
      });

      prisma.$transaction.mockImplementation(
        async (callback: any) => {
          const transaction = {
            classSchedule: {
              deleteMany: jest.fn().mockImplementation(async () => undefined),
            },
            class: {
              update: prisma.class.update,
            },
          };

          return callback(transaction);
        },
      );

      prisma.class.update.mockResolvedValue({
        ...mockClass,
      });
    });

    it('should update class name', async () => {
      const result = await service.update(
        'class-1',
        {
          name: '  Pilates - Noite  ',
        },
      );

      expect(result).toEqual(mockClass);

      expect(prisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'class-1',
          },
          data: expect.objectContaining({
            name: 'Pilates - Noite',
          }),
        }),
      );
    });

    it('should throw when class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(
        service.update('class-1', {
          name: 'Nova turma',
        }),
      ).rejects.toThrow(
        'Turma não encontrada.',
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should update active status', async () => {
      await service.update('class-1', {
        active: false,
      });

      expect(prisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            active: false,
          }),
        }),
      );
    });

    it('should update capacity when capacity is valid', async () => {
      prisma.enrollment.count.mockResolvedValue(3);

      await service.update('class-1', {
        capacity: 5,
      });

      expect(prisma.enrollment.count).toHaveBeenCalledWith({
        where: {
          classId: 'class-1',
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

      expect(prisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            capacity: 5,
          }),
        }),
      );
    });

    it('should reject capacity below current enrollment count', async () => {
      prisma.enrollment.count.mockResolvedValue(5);

      await expect(
        service.update('class-1', {
          capacity: 4,
        }),
      ).rejects.toThrow(
        'A capacidade não pode ser menor que o número atual de alunos vinculados à turma (5).',
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.class.update).not.toHaveBeenCalled();
    });

    it('should allow capacity equal to current enrollment count', async () => {
      prisma.enrollment.count.mockResolvedValue(5);

      await service.update('class-1', {
        capacity: 5,
      });

      expect(prisma.class.update).toHaveBeenCalled();
    });

    it('should update schedules', async () => {
      const schedules = [
        {
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '09:50',
          room: '  Sala 2  ',
        },
      ];

      await service.update('class-1', {
        schedules,
      });

      expect(prisma.$transaction).toHaveBeenCalled();

      expect(prisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schedules: {
              create: [
                {
                  dayOfWeek: 2,
                  startTime: '09:00',
                  endTime: '09:50',
                  room: 'Sala 2',
                },
              ],
            },
          }),
        }),
      );
    });

    it('should reject invalid updated schedule', async () => {
      await expect(
        service.update('class-1', {
          schedules: [
            {
              dayOfWeek: 2,
              startTime: '10:00',
              endTime: '09:00',
            },
          ],
        }),
      ).rejects.toThrow(
        'O horário inicial deve ser anterior ao horário final.',
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should change modality successfully', async () => {
      const newModality = {
        id: 'modality-2',
        name: 'Natação Adulto',
        active: true,
        requiresClass: true,
      };

      prisma.modality.findUnique.mockResolvedValue(
        newModality,
      );

      await service.update('class-1', {
        modalityId: 'modality-2',
      });

      expect(prisma.modality.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'modality-2',
        },
      });

      expect(prisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modalityId: 'modality-2',
          }),
        }),
      );
    });

    it('should reject changing to a nonexistent modality', async () => {
      prisma.modality.findUnique.mockResolvedValue(null);

      await expect(
        service.update('class-1', {
          modalityId: 'modality-2',
        }),
      ).rejects.toThrow(
        'Modalidade não encontrada.',
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should reject changing to an inactive modality', async () => {
      prisma.modality.findUnique.mockResolvedValue({
        ...mockModality,
        id: 'modality-2',
        active: false,
      });

      await expect(
        service.update('class-1', {
          modalityId: 'modality-2',
        }),
      ).rejects.toThrow(
        'Não é possível associar a turma a uma modalidade inativa.',
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should reject changing to a modality that does not require classes', async () => {
      prisma.modality.findUnique.mockResolvedValue({
        ...mockModality,
        id: 'modality-2',
        requiresClass: false,
      });

      await expect(
        service.update('class-1', {
          modalityId: 'modality-2',
        }),
      ).rejects.toThrow(
        'Esta modalidade não exige turmas.',
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an empty class', async () => {
      prisma.class.findUnique.mockResolvedValue(
        mockClass,
      );

      prisma.enrollment.count.mockResolvedValue(0);

      prisma.class.delete.mockResolvedValue(
        mockClass,
      );

      const result = await service.remove('class-1');

      expect(result).toEqual({
        message: 'Turma excluída com sucesso.',
      });

      expect(prisma.class.delete).toHaveBeenCalledWith({
        where: {
          id: 'class-1',
        },
      });
    });

    it('should throw when class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('class-1'),
      ).rejects.toThrow(
        'Turma não encontrada.',
      );

      expect(prisma.enrollment.count).not.toHaveBeenCalled();
      expect(prisma.class.delete).not.toHaveBeenCalled();
    });

    it('should reject removing a class with enrolled students', async () => {
      prisma.class.findUnique.mockResolvedValue(
        mockClass,
      );

      prisma.enrollment.count.mockResolvedValue(2);

      await expect(
        service.remove('class-1'),
      ).rejects.toThrow(
        'Não é possível excluir uma turma que possui alunos vinculados.',
      );

      expect(prisma.class.delete).not.toHaveBeenCalled();
    });

    it('should count only active enrollment statuses when removing', async () => {
      prisma.class.findUnique.mockResolvedValue(
        mockClass,
      );

      prisma.enrollment.count.mockResolvedValue(0);

      await service.remove('class-1');

      expect(prisma.enrollment.count).toHaveBeenCalledWith({
        where: {
          classId: 'class-1',
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
    });
  });
});