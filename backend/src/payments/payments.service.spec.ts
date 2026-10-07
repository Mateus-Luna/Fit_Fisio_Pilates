import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BillingFrequency,
  EnrollmentStatus,
  PaymentPeriod,
  PaymentStatus,
} from 'generated/prisma/enums';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      payment: {
        create: jest.fn<(...args: any[]) => any>(),
        findMany: jest.fn<(...args: any[]) => any>(),
        findFirst: jest.fn<(...args: any[]) => any>(),
        findUnique: jest.fn<(...args: any[]) => any>(),
        update: jest.fn<(...args: any[]) => any>(),
      },
      student: {
        findUnique: jest.fn<(...args: any[]) => any>(),
      },
      enrollment: {
        findUnique: jest.fn<(...args: any[]) => any>(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMonthlyPaymentsForStudent (Alteração 1 & 2)', () => {
    it('deve usar o preço atual da modalidade como fonte da verdade e aplicar desconto da matrícula para cobrança MENSAL', async () => {
      const student = {
        id: 'student-1',
        name: 'João Silva',
        enrollments: [
          {
            id: 'enr-1',
            studentId: 'student-1',
            status: EnrollmentStatus.ACTIVE,
            billingFrequency: BillingFrequency.MONTHLY,
            discountPercentage: 10,
            modality: {
              id: 'mod-1',
              name: 'Academia',
              monthlyPrice: 120, // Preço atualizado da modalidade
            },
          },
        ],
      };

      prisma.student.findUnique.mockResolvedValue(student);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.create.mockImplementation((args: any) =>
        Promise.resolve({ id: 'pay-1', ...args.data }),
      );

      const result = await service.createMonthlyPaymentsForStudent(
        'student-1',
        1,
        2026,
        '2026-01-10T00:00:00.000Z',
      );

      // 120 - 10% (12.00) = 108.00
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 120,
            discountAmount: 12,
            finalAmount: 108,
            period: PaymentPeriod.MONTHLY,
            referenceMonth: 1,
            referenceYear: 2026,
          }),
        }),
      );
      expect(result.payments).toHaveLength(1);
      expect(result.totalAmount).toBe(108);
    });

    it('deve gerar 2 cobranças (1ª e 2ª quinzena) para matrícula QUINZENAL com divisão e arredondamento exato de centavos', async () => {
      const student = {
        id: 'student-2',
        name: 'Maria Souza',
        enrollments: [
          {
            id: 'enr-2',
            studentId: 'student-2',
            status: EnrollmentStatus.ACTIVE,
            billingFrequency: BillingFrequency.BIWEEKLY,
            discountPercentage: 0,
            modality: {
              id: 'mod-2',
              name: 'Pilates',
              monthlyPrice: 99.99, // Centavos ímpares para testar arredondamento
            },
          },
        ],
      };

      prisma.student.findUnique.mockResolvedValue(student);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.create.mockImplementation((args: any) =>
        Promise.resolve({ id: `pay-${Math.random()}`, ...args.data }),
      );

      const result = await service.createMonthlyPaymentsForStudent(
        'student-2',
        2,
        2026,
        '2026-02-10T00:00:00.000Z',
      );

      expect(prisma.payment.create).toHaveBeenCalledTimes(2);

      // Primeira chamada: 1ª quinzena = 50.00
      expect(prisma.payment.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: expect.objectContaining({
            period: PaymentPeriod.FIRST_FORTNIGHT,
            finalAmount: 50.00,
          }),
        }),
      );

      // Segunda chamada: 2ª quinzena = 49.99
      expect(prisma.payment.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            period: PaymentPeriod.SECOND_FORTNIGHT,
            finalAmount: 49.99,
          }),
        }),
      );

      // Soma total das duas quinzenas deve ser exatamente 99.99 sem perda de centavos
      expect(result.totalAmount).toBe(99.99);
    });

    it('deve ser idempotente e não duplicar cobranças já existentes', async () => {
      const existingFirst = {
        id: 'existing-first',
        period: PaymentPeriod.FIRST_FORTNIGHT,
        finalAmount: 50,
      };
      const existingSecond = {
        id: 'existing-second',
        period: PaymentPeriod.SECOND_FORTNIGHT,
        finalAmount: 50,
      };

      const student = {
        id: 'student-3',
        name: 'Carlos Oliveira',
        enrollments: [
          {
            id: 'enr-3',
            studentId: 'student-3',
            status: EnrollmentStatus.ACTIVE,
            billingFrequency: BillingFrequency.BIWEEKLY,
            discountPercentage: 0,
            modality: {
              id: 'mod-3',
              name: 'Funcional',
              monthlyPrice: 100,
            },
          },
        ],
      };

      prisma.student.findUnique.mockResolvedValue(student);
      prisma.payment.findFirst
        .mockResolvedValueOnce(existingFirst)
        .mockResolvedValueOnce(existingSecond);

      const result = await service.createMonthlyPaymentsForStudent(
        'student-3',
        3,
        2026,
        '2026-03-10T00:00:00.000Z',
      );

      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(result.payments).toHaveLength(2);
      expect(result.totalAmount).toBe(100);
    });
  });
});
