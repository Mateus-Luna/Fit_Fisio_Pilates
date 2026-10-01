import { PaymentOverdueService } from './payment-overdue.service';

describe('PaymentOverdueService', () => {
  let service: PaymentOverdueService;

  const prismaMock = {
    payment: {
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  const notificationsMock = {
    hasOverdueNotification: jest.fn(),
    createOverdueNotification: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PaymentOverdueService(
      prismaMock as any,
      notificationsMock as any,
    );
  });

  it('deve marcar mensalidades vencidas como OVERDUE', async () => {
    prismaMock.payment.findMany.mockResolvedValue([
      {
        id: 'payment-1',
        studentId: 'student-1',
        referenceMonth: 9,
        referenceYear: 2026,
        student: {
          id: 'student-1',
          name: 'João',
        },
        enrollment: null,
      },
    ]);

    prismaMock.payment.update.mockResolvedValue({
      id: 'payment-1',
      status: 'OVERDUE',
    });

    prismaMock.payment.count.mockResolvedValue(1);

    const result =
      await service.checkOverduePayments();

    expect(
      prismaMock.payment.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'payment-1',
      },
      data: {
        status: 'OVERDUE',
      },
    });

    expect(result.updatedPayments).toBe(1);
    expect(result.notificationsCreated).toBe(0);
  });

  it('não deve notificar quando existe apenas uma mensalidade atrasada', async () => {
    prismaMock.payment.findMany.mockResolvedValue([
      {
        id: 'payment-1',
        studentId: 'student-1',
        referenceMonth: 9,
        referenceYear: 2026,
        student: {
          name: 'João',
        },
      },
    ]);

    prismaMock.payment.update.mockResolvedValue({});
    prismaMock.payment.count.mockResolvedValue(1);

    await service.checkOverduePayments();

    expect(
      prismaMock.user.findMany,
    ).not.toHaveBeenCalled();

    expect(
      notificationsMock.createOverdueNotification,
    ).not.toHaveBeenCalled();
  });

  it('deve criar notificação quando existem mais de uma mensalidade atrasada', async () => {
    prismaMock.payment.findMany.mockResolvedValue([
      {
        id: 'payment-2',
        studentId: 'student-1',
        referenceMonth: 9,
        referenceYear: 2026,
        student: {
          name: 'João',
        },
      },
    ]);

    prismaMock.payment.update.mockResolvedValue({});
    prismaMock.payment.count.mockResolvedValue(2);

    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Aline',
      },
    ]);

    notificationsMock.hasOverdueNotification.mockResolvedValue(
      false,
    );

    notificationsMock.createOverdueNotification.mockResolvedValue(
      {
        id: 'notification-1',
      },
    );

    const result =
      await service.checkOverduePayments();

    expect(
      notificationsMock.createOverdueNotification,
    ).toHaveBeenCalledWith({
      userId: 'user-1',
      studentId: 'student-1',
      studentName: 'João',
      overdueMonths: 2,
    });

    expect(result.notificationsCreated).toBe(1);
  });

  it('não deve criar notificação duplicada', async () => {
    prismaMock.payment.findMany.mockResolvedValue([
      {
        id: 'payment-2',
        studentId: 'student-1',
        referenceMonth: 9,
        referenceYear: 2026,
        student: {
          name: 'João',
        },
      },
    ]);

    prismaMock.payment.update.mockResolvedValue({});
    prismaMock.payment.count.mockResolvedValue(2);

    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
      },
    ]);

    notificationsMock.hasOverdueNotification.mockResolvedValue(
      true,
    );

    await service.checkOverduePayments();

    expect(
      notificationsMock.createOverdueNotification,
    ).not.toHaveBeenCalled();
  });

  it('deve retornar zero quando não existem pagamentos vencidos', async () => {
    prismaMock.payment.findMany.mockResolvedValue([]);

    const result =
      await service.checkOverduePayments();

    expect(result).toEqual({
      updatedPayments: 0,
      notificationsCreated: 0,
    });
  });
});