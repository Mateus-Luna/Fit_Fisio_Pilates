import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus } from '../../generated/prisma/enums';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../prisma/prisma.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { Decimal } from 'decimal.js';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  let prisma: {
    enrollment: {
      create: Mock<(...args: any[]) => any>;
      findMany: Mock<(...args: any[]) => any>;
      findUnique: Mock<(...args: any[]) => any>;
      findFirst: Mock<(...args: any[]) => any>;
      update: Mock<(...args: any[]) => any>;
      count: Mock<(...args: any[]) => any>;
    };
    student: {
      findUnique: Mock<(...args: any[]) => any>;
    };
    modality: {
      findUnique: Mock<(...args: any[]) => any>;
    };
    class: {
      findUnique: Mock<(...args: any[]) => any>;
    };
  };
  let discountsService: {
    calculate: Mock<(...args: any[]) => any>;
  };


  const mockStudent = {
    id: 'student-1',
    name: 'João da Silva',
  };

  const mockModality = {
    id: 'modality-1',
    name: 'Pilates',
    active: true,
    monthlyPrice: new Decimal('200'),
  };

  const mockClass = {
    id: 'class-1',
    name: 'Pilates - Manhã',
    modalityId: 'modality-1',
    active: true,
  };

  const mockEnrollment = {
    id: 'enrollment-1',
    studentId: 'student-1',
    modalityId: 'modality-1',
    classId: null,
    startDate: new Date('2026-09-01'),
    endDate: null,
    status: EnrollmentStatus.PENDING_DOCUMENTATION,
    contractedPrice: new Decimal('200'),
    discountPercentage: 0,
    discountAmount: new Decimal('0'),
    finalPrice: new Decimal('200'),
    observation: null,
    approvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    discountsService = {
      calculate: jest.fn(),
    };
    prisma = {
      enrollment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },

      student: {
        findUnique: jest.fn(),
      },

      modality: {
        findUnique: jest.fn(),
      },

      class: {
        findUnique: jest.fn(),
      },
    };

    discountsService.calculate.mockImplementation(
      (
        contractedPrice: number,
        discountPercentage: number,
      ) => {
        const discountAmount =
          contractedPrice * (discountPercentage / 100);

        return {
          contractedPrice,
          discountPercentage,
          discountAmount,
          finalPrice:
            contractedPrice - discountAmount,
        };
      },
    );

    service = new EnrollmentsService(
      prisma as unknown as PrismaService,
      discountsService as any,
    );
  });

  describe('create', () => {
    const dto = {
      studentId: 'student-1',
      modalityId: 'modality-1',
      startDate: '2026-09-01',
    };

    beforeEach(() => {
      prisma.student.findUnique.mockResolvedValue(
        mockStudent,
      );

      prisma.modality.findUnique.mockResolvedValue(
        mockModality,
      );
      prisma.enrollment.count.mockResolvedValue(0);

      prisma.enrollment.findFirst.mockResolvedValue(
        null,
      );

      prisma.enrollment.create.mockResolvedValue(
        mockEnrollment,
      );
    });

    it('should create an enrollment successfully', async () => {
      const result = await service.create(dto);

      expect(result).toEqual(mockEnrollment);

      expect(
        prisma.student.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: dto.studentId,
        },
      });

      expect(
        prisma.modality.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: dto.modalityId,
        },
      });

      expect(
        prisma.enrollment.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: 'student-1',
            modalityId: 'modality-1',
            status:
              EnrollmentStatus.PENDING_DOCUMENTATION,
            contractedPrice: '200',
            discountPercentage: '0',
            discountAmount: '0',
            finalPrice: '200',
          }),

          include: {
            student: true,
            modality: true,
            class: true,
          },
        }),
      );
    });

    it('should throw NotFoundException when student does not exist', async () => {
      prisma.student.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.create(dto),
      ).rejects.toThrow(NotFoundException);

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when modality does not exist', async () => {
      prisma.modality.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.create(dto),
      ).rejects.toThrow(NotFoundException);

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when modality is inactive', async () => {
      prisma.modality.findUnique.mockResolvedValue({
        ...mockModality,
        active: false,
      });

      await expect(
        service.create(dto),
      ).rejects.toThrow(
        'Não é possível realizar matrícula em uma modalidade inativa.',
      );

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when discount is below zero', async () => {
      const invalidDto = {
        ...dto,
        discountPercentage: -1,
      };

      await expect(
        service.create(invalidDto),
      ).rejects.toThrow(
        'O desconto deve estar entre 0% e 100%.',
      );

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when discount is above 100', async () => {
      const invalidDto = {
        ...dto,
        discountPercentage: 101,
      };

      await expect(
        service.create(invalidDto),
      ).rejects.toThrow(
        'O desconto deve estar entre 0% e 100%.',
      );

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when student already has an active enrollment in the modality', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.ACTIVE,
      });

      await expect(
        service.create(dto),
      ).rejects.toThrow(ConflictException);

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when end date is before start date', async () => {
      const invalidDto = {
        ...dto,
        endDate: '2026-08-01',
      };

      await expect(
        service.create(invalidDto),
      ).rejects.toThrow(
        'A data de término não pode ser anterior à data de início.',
      );

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should calculate discount and final price correctly', async () => {
      const discountedDto = {
        ...dto,
        discountPercentage: 10,
      };

      await service.create(discountedDto);

      expect(
        discountsService.calculate,
      ).toHaveBeenCalledWith(200, 10);

      expect(
        prisma.enrollment.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contractedPrice: '200',
            discountPercentage: '10',
            discountAmount: '20',
            finalPrice: '180',
          }),
        }),
      );
    });

    it('should create enrollment with class', async () => {
      prisma.class.findUnique.mockResolvedValue(
        mockClass,
      );

      const enrollmentWithClass = {
        ...dto,
        classId: 'class-1',
      };

      await service.create(enrollmentWithClass);

      expect(
        prisma.class.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'class-1',
        },
      });

      expect(
        prisma.enrollment.create,
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(
        null,
      );

      const enrollmentWithClass = {
        ...dto,
        classId: 'class-1',
      };

      await expect(
        service.create(enrollmentWithClass),
      ).rejects.toThrow(NotFoundException);

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when class belongs to another modality', async () => {
      prisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        modalityId: 'another-modality',
      });

      const enrollmentWithClass = {
        ...dto,
        classId: 'class-1',
      };

      await expect(
        service.create(enrollmentWithClass),
      ).rejects.toThrow(
        'A turma selecionada não pertence à modalidade da matrícula.',
      );

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when class is inactive', async () => {
      prisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        active: false,
      });

      const enrollmentWithClass = {
        ...dto,
        classId: 'class-1',
      };

      await expect(
        service.create(enrollmentWithClass),
      ).rejects.toThrow(
        'Não é possível matricular o aluno em uma turma inativa.',
      );

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });
    it('should throw BadRequestException when modality requires a class and classId is not provided', async () => {
      prisma.modality.findUnique.mockResolvedValue({
        ...mockModality,
        requiresClass: true,
      });

      await expect(
        service.create(dto),
      ).rejects.toThrow(
        'Esta modalidade exige a seleção de uma turma.',
      );

      expect(
        prisma.enrollment.create,
      ).not.toHaveBeenCalled();
    });
    it('should throw ConflictException when class is full', async () => {
  prisma.modality.findUnique.mockResolvedValue({
    ...mockModality,
    requiresClass: true,
  });

  prisma.class.findUnique.mockResolvedValue({
    ...mockClass,
    capacity: 1,
  });

  prisma.enrollment.count.mockResolvedValue(1);

  const enrollmentWithClass = {
    ...dto,
    classId: 'class-1',
  };

  await expect(
    service.create(enrollmentWithClass),
  ).rejects.toThrow(
    'A turma selecionada está lotada.',
  );

  expect(
    prisma.enrollment.create,
  ).not.toHaveBeenCalled();
});
  });

  describe('findAll', () => {
    it('should return all enrollments', async () => {
      const enrollments = [mockEnrollment];

      prisma.enrollment.findMany.mockResolvedValue(
        enrollments,
      );

      const result = await service.findAll();

      expect(result).toEqual(enrollments);

      expect(
        prisma.enrollment.findMany,
      ).toHaveBeenCalledWith({
        where: {
          studentId: undefined,
          modalityId: undefined,
          status: undefined,
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
    });

    it('should filter enrollments by studentId', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        mockEnrollment,
      ]);

      await service.findAll('student-1');

      expect(
        prisma.enrollment.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId: 'student-1',
            modalityId: undefined,
            status: undefined,
          },
        }),
      );
    });

    it('should filter enrollments by modalityId', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        mockEnrollment,
      ]);

      await service.findAll(
        undefined,
        'modality-1',
      );

      expect(
        prisma.enrollment.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId: undefined,
            modalityId: 'modality-1',
            status: undefined,
          },
        }),
      );
    });

    it('should filter enrollments by status', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        mockEnrollment,
      ]);

      await service.findAll(
        undefined,
        undefined,
        EnrollmentStatus.ACTIVE,
      );

      expect(
        prisma.enrollment.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId: undefined,
            modalityId: undefined,
            status: EnrollmentStatus.ACTIVE,
          },
        }),
      );
    });

    it('should filter enrollments by studentId, modalityId and status', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        mockEnrollment,
      ]);

      await service.findAll(
        'student-1',
        'modality-1',
        EnrollmentStatus.ACTIVE,
      );

      expect(
        prisma.enrollment.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId: 'student-1',
            modalityId: 'modality-1',
            status: EnrollmentStatus.ACTIVE,
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an enrollment', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );

      const result =
        await service.findOne('enrollment-1');

      expect(result).toEqual(mockEnrollment);

      expect(
        prisma.enrollment.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'enrollment-1',
        },
        include: {
          student: true,
          modality: true,
          class: true,
          payments: true,
          attendances: true,
        },
      });
    });

    it('should throw NotFoundException when enrollment does not exist', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.findOne('enrollment-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.enrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );

      prisma.enrollment.update.mockResolvedValue(
        mockEnrollment,
      );
    });

    it('should update an enrollment', async () => {
      const updatedEnrollment = {
        ...mockEnrollment,
        observation: 'Nova observação',
      };

      prisma.enrollment.update.mockResolvedValue(
        updatedEnrollment,
      );

      prisma.modality.findUnique.mockResolvedValue(mockModality);

      const result = await service.update(
        'enrollment-1',
        {
          observation: 'Nova observação',
        },
      );

      expect(result).toEqual(updatedEnrollment);

      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'enrollment-1',
          },
          include: {
            student: true,
            modality: true,
            class: true,
          },
        }),
      );
    });

    it('should throw NotFoundException when enrollment does not exist', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.update('enrollment-1', {
          observation: 'Teste',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when enrollment is cancelled', async () => {
      prisma.enrollment.findUnique.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.CANCELLED,
      });

      await expect(
        service.update('enrollment-1', {
          observation: 'Teste',
        }),
      ).rejects.toThrow(
        'Não é possível editar uma matrícula cancelada ou concluída.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when enrollment is completed', async () => {
      prisma.enrollment.findUnique.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.COMPLETED,
      });

      await expect(
        service.update('enrollment-1', {
          observation: 'Teste',
        }),
      ).rejects.toThrow(
        'Não é possível editar uma matrícula cancelada ou concluída.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should validate end date when updating', async () => {
      await expect(
        service.update('enrollment-1', {
          startDate: '2026-09-01',
          endDate: '2026-08-01',
        }),
      ).rejects.toThrow(
        'A data de término não pode ser anterior à data de início.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updated discount is below zero', async () => {
      await expect(
        service.update('enrollment-1', {
          discountPercentage: -1,
        }),
      ).rejects.toThrow(
        'O desconto deve estar entre 0% e 100%.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updated discount is above 100', async () => {
      await expect(
        service.update('enrollment-1', {
          discountPercentage: 101,
        }),
      ).rejects.toThrow(
        'O desconto deve estar entre 0% e 100%.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should update discount and final price', async () => {
      
      prisma.modality.findUnique.mockResolvedValue(mockModality);

      await service.update('enrollment-1', {
        discountPercentage: 10,
      });

      expect(
        discountsService.calculate,
      ).toHaveBeenCalledWith(200, 10);
      
      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contractedPrice: '200',
            discountPercentage: '10',
            discountAmount: '20',
            finalPrice: '180',
          }),
        }),
      );
    });

    it('should change modality and recalculate price', async () => {
      const newModality = {
        id: 'modality-2',
        name: 'Musculação',
        active: true,
        monthlyPrice: new Decimal('300'),
      };

      prisma.modality.findUnique.mockResolvedValue(
        newModality,
      );

      prisma.enrollment.findFirst.mockResolvedValue(
        null,
      );

      await service.update('enrollment-1', {
        modalityId: 'modality-2',
      });

      expect(
        discountsService.calculate,
      ).toHaveBeenCalledWith(300, 0);

      expect(
        prisma.modality.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'modality-2',
        },
      });

      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modalityId: 'modality-2',
            contractedPrice: '300',
            discountPercentage: '0',
            discountAmount: '0',
            finalPrice: '300',
          }),
        }),
      );
    });

    it('should throw NotFoundException when new modality does not exist', async () => {
      prisma.modality.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.update('enrollment-1', {
          modalityId: 'modality-2',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when new modality is inactive', async () => {
      prisma.modality.findUnique.mockResolvedValue({
        ...mockModality,
        id: 'modality-2',
        active: false,
      });

      await expect(
        service.update('enrollment-1', {
          modalityId: 'modality-2',
        }),
      ).rejects.toThrow(
        'Não é possível utilizar uma modalidade inativa.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when new modality already has an enrollment', async () => {
      prisma.modality.findUnique.mockResolvedValue({
        ...mockModality,
        id: 'modality-2',
      });

      prisma.enrollment.findFirst.mockResolvedValue({
        ...mockEnrollment,
        modalityId: 'modality-2',
      });

      await expect(
        service.update('enrollment-1', {
          modalityId: 'modality-2',
        }),
      ).rejects.toThrow(ConflictException);

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when new class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.update('enrollment-1', {
          classId: 'class-1',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when new class belongs to another modality', async () => {
      prisma.modality.findUnique.mockResolvedValue(mockModality);

      prisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        modalityId: 'another-modality',
      });

      await expect(
        service.update('enrollment-1', {
          classId: 'class-2',
        }),
      ).rejects.toThrow(
        'A turma selecionada não pertence à modalidade da matrícula.',
      );

      expect(prisma.enrollment.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when new class is inactive', async () => {
      prisma.modality.findUnique.mockResolvedValue(mockModality);

      prisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        active: false,
      });

      await expect(
        service.update('enrollment-1', {
          classId: 'class-1',
        }),
      ).rejects.toThrow(
        'Não é possível matricular o aluno em uma turma inativa.',
      );

      expect(prisma.enrollment.update).not.toHaveBeenCalled();
});
    it('should move enrollment to another class', async () => {
      prisma.modality.findUnique.mockResolvedValue(mockModality);

      const newClass = {
        ...mockClass,
        id: 'class-2',
      };

      prisma.class.findUnique.mockResolvedValue(newClass);
      prisma.enrollment.count.mockResolvedValue(0);

      const updatedEnrollment = {
        ...mockEnrollment,
        classId: 'class-2',
      };

      prisma.enrollment.update.mockResolvedValue(
        updatedEnrollment,
      );

      const result = await service.update(
        'enrollment-1',
        {
          classId: 'class-2',
        },
      );

      expect(result).toEqual(updatedEnrollment);

      expect(prisma.class.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'class-2',
        },
      });

      expect(prisma.enrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            classId: 'class-2',
          }),
        }),
      );
    });
      it('should throw ConflictException when moving enrollment to a full class', async () => {
      prisma.modality.findUnique.mockResolvedValue(mockModality);

      prisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        id: 'class-2',
        capacity: 1,
      });

      prisma.enrollment.count.mockResolvedValue(1);

      await expect(
        service.update('enrollment-1', {
          classId: 'class-2',
        }),
      ).rejects.toThrow(
        'A turma selecionada está lotada.',
      );

      expect(prisma.enrollment.update).not.toHaveBeenCalled();
    });
          it('should remove class when changing to another modality', async () => {
          const newModality = {
            id: 'modality-2',
            name: 'Musculação',
            active: true,
            requiresClass: false,
            monthlyPrice: new Decimal('300'),
          };

          prisma.modality.findUnique.mockResolvedValue(
            newModality,
          );

          prisma.enrollment.findFirst.mockResolvedValue(
            null,
          );

          prisma.enrollment.update.mockResolvedValue({
            ...mockEnrollment,
            modalityId: 'modality-2',
            classId: null,
          });

          await service.update('enrollment-1', {
            modalityId: 'modality-2',
          });

          expect(
            prisma.enrollment.update,
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                modalityId: 'modality-2',
                classId: null,
                }),
                }),
              );
            });
            it('should reject changing to a modality that requires a class without selecting one', async () => {
          const newModality = {
            id: 'modality-2',
            name: 'Natação Adulto',
            active: true,
            requiresClass: true,
            monthlyPrice: new Decimal('300'),
          };

          prisma.modality.findUnique.mockResolvedValue(
            newModality,
          );

          prisma.enrollment.findFirst.mockResolvedValue(
            null,
          );

          await expect(
            service.update('enrollment-1', {
              modalityId: 'modality-2',
            }),
          ).rejects.toThrow(
            'Esta modalidade exige a seleção de uma turma.',
          );

   expect(
         prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('requestApproval', () => {
    it('should move enrollment to AWAITING_APPROVAL', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status:
            EnrollmentStatus.PENDING_DOCUMENTATION,
        },
      );

      prisma.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status:
          EnrollmentStatus.AWAITING_APPROVAL,
      });

      const result =
        await service.requestApproval(
          'enrollment-1',
        );

      expect(result.status).toBe(
        EnrollmentStatus.AWAITING_APPROVAL,
      );

      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'enrollment-1',
        },
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
    });

    it('should throw when enrollment is not pending documentation', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status: EnrollmentStatus.ACTIVE,
        },
      );

      await expect(
        service.requestApproval(
          'enrollment-1',
        ),
      ).rejects.toThrow(
        'A matrícula precisa estar pendente de documentação.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should approve an enrollment', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status:
            EnrollmentStatus.AWAITING_APPROVAL,
        },
      );

      prisma.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.ACTIVE,
        approvedAt: new Date(),
      });

      const result =
        await service.approve('enrollment-1');

      expect(result.status).toBe(
        EnrollmentStatus.ACTIVE,
      );

      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'enrollment-1',
        },
        data: {
          status: EnrollmentStatus.ACTIVE,
          approvedAt: expect.any(Date),
        },
        include: {
          student: true,
          modality: true,
          class: true,
        },
      });
    });

    it('should throw when enrollment is not awaiting approval', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status:
            EnrollmentStatus.PENDING_DOCUMENTATION,
        },
      );

      await expect(
        service.approve('enrollment-1'),
      ).rejects.toThrow(
        'A matrícula precisa estar aguardando aprovação para ser homologada.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('suspend', () => {
    it('should suspend an active enrollment', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status: EnrollmentStatus.ACTIVE,
        },
      );

      prisma.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.SUSPENDED,
      });

      const result =
        await service.suspend('enrollment-1');

      expect(result.status).toBe(
        EnrollmentStatus.SUSPENDED,
      );

      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'enrollment-1',
        },
        data: {
          status: EnrollmentStatus.SUSPENDED,
        },
        include: {
          student: true,
          modality: true,
          class: true,
        },
      });
    });

    it('should throw when enrollment is not active', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status:
            EnrollmentStatus.SUSPENDED,
        },
      );

      await expect(
        service.suspend('enrollment-1'),
      ).rejects.toThrow(
        'Somente matrículas ativas podem ser suspensas.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('reactivate', () => {
    it('should reactivate a suspended enrollment', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status:
            EnrollmentStatus.SUSPENDED,
        },
      );

      prisma.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.ACTIVE,
      });

      const result =
        await service.reactivate(
          'enrollment-1',
        );

      expect(result.status).toBe(
        EnrollmentStatus.ACTIVE,
      );

      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'enrollment-1',
        },
        data: {
          status: EnrollmentStatus.ACTIVE,
        },
        include: {
          student: true,
          modality: true,
          class: true,
        },
      });
    });

    it('should throw when enrollment is not suspended', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status: EnrollmentStatus.ACTIVE,
        },
      );

      await expect(
        service.reactivate(
          'enrollment-1',
        ),
      ).rejects.toThrow(
        'Somente matrículas suspensas podem ser reativadas.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel an enrollment', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status: EnrollmentStatus.ACTIVE,
          endDate: null,
        },
      );

      prisma.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.CANCELLED,
        endDate: new Date(),
      });

      const result =
        await service.cancel('enrollment-1');

      expect(result.status).toBe(
        EnrollmentStatus.CANCELLED,
      );

      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'enrollment-1',
        },
        data: {
          status: EnrollmentStatus.CANCELLED,
          endDate: expect.any(Date),
        },
        include: {
          student: true,
          modality: true,
          class: true,
        },
      });
    });

    it('should preserve existing end date when cancelling', async () => {
      const existingEndDate = new Date(
        '2026-09-05',
      );

      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status: EnrollmentStatus.ACTIVE,
          endDate: existingEndDate,
        },
      );

      prisma.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.CANCELLED,
        endDate: existingEndDate,
      });

      await service.cancel('enrollment-1');

      expect(
        prisma.enrollment.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'enrollment-1',
        },
        data: {
          status: EnrollmentStatus.CANCELLED,
          endDate: existingEndDate,
        },
        include: {
          student: true,
          modality: true,
          class: true,
        },
      });
    });

    it('should throw when enrollment is already cancelled', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status:
            EnrollmentStatus.CANCELLED,
        },
      );

      await expect(
        service.cancel('enrollment-1'),
      ).rejects.toThrow(
        'A matrícula já está encerrada.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw when enrollment is completed', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(
        {
          ...mockEnrollment,
          status:
            EnrollmentStatus.COMPLETED,
        },
      );

      await expect(
        service.cancel('enrollment-1'),
      ).rejects.toThrow(
        'A matrícula já está encerrada.',
      );

      expect(
        prisma.enrollment.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft cancel the enrollment', async () => {
      const cancelSpy = jest
        .spyOn(service, 'cancel')
        .mockResolvedValue({
          ...mockEnrollment,
          status: EnrollmentStatus.CANCELLED,
        } as any);

      const result =
        await service.remove('enrollment-1');

      expect(cancelSpy).toHaveBeenCalledWith(
        'enrollment-1',
      );

      expect(result.status).toBe(
        EnrollmentStatus.CANCELLED,
      );
    });
  });
});