import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const prismaMock = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new NotificationsService(
      prismaMock as any,
    );
  });

  describe('create', () => {
    it('deve criar uma notificação SYSTEM', async () => {
      const notification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'SYSTEM',
        channel: 'SYSTEM',
        title: 'Teste',
        message: 'Mensagem',
      };

      prismaMock.notification.create.mockResolvedValue(
        notification,
      );

      const result = await service.create({
        userId: 'user-1',
        type: 'SYSTEM' as any,
        title: 'Teste',
        message: 'Mensagem',
      });

      expect(
        prismaMock.notification.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'SYSTEM',
          channel: 'SYSTEM',
          title: 'Teste',
          message: 'Mensagem',
          studentId: undefined,
          status: 'PENDING',
        },
      });

      expect(result).toEqual(notification);
    });
  });

  describe('findAll', () => {
    it('deve listar notificações do usuário', async () => {
      const notifications = [
        { id: 'notification-1' },
        { id: 'notification-2' },
      ];

      prismaMock.notification.findMany.mockResolvedValue(
        notifications,
      );

      const result = await service.findAll('user-1');

      expect(
        prismaMock.notification.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(notifications);
    });
  });

  describe('findUnread', () => {
    it('deve retornar apenas notificações não lidas', async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);

      await service.findUnread('user-1');

      expect(
        prismaMock.notification.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          readAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('markAsRead', () => {
    it('deve marcar uma notificação como lida', async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'notification-1',
      });

      prismaMock.notification.update.mockResolvedValue({
        id: 'notification-1',
        status: 'READ',
      });

      const result = await service.markAsRead(
        'notification-1',
      );

      expect(
        prismaMock.notification.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'notification-1',
        },
        data: {
          status: 'READ',
          readAt: expect.any(Date),
        },
      });

      expect(result.status).toBe('READ');
    });

    it('deve lançar erro se a notificação não existir', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.markAsRead('invalid-id'),
      ).rejects.toThrow(
        'Notificação não encontrada.',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({
        count: 3,
      });

      const result =
        await service.markAllAsRead('user-1');

      expect(
        prismaMock.notification.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          readAt: null,
        },
        data: {
          status: 'READ',
          readAt: expect.any(Date),
        },
      });

      expect(result.count).toBe(3);
    });
  });

  describe('hasOverdueNotification', () => {
    it('deve retornar true quando existir notificação', async () => {
      prismaMock.notification.findFirst.mockResolvedValue({
        id: 'notification-1',
      });

      const result =
        await service.hasOverdueNotification(
          'user-1',
          'student-1',
          9,
          2026,
        );

      expect(result).toBe(true);
    });

    it('deve retornar false quando não existir notificação', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(
        null,
      );

      const result =
        await service.hasOverdueNotification(
          'user-1',
          'student-1',
          9,
          2026,
        );

      expect(result).toBe(false);
    });
  });

  describe('createOverdueNotification', () => {
    it('deve criar notificação de inadimplência', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(
        null,
      );

      prismaMock.notification.create.mockResolvedValue({
        id: 'notification-1',
      });

      const result =
        await service.createOverdueNotification({
          userId: 'user-1',
          studentId: 'student-1',
          studentName: 'João',
          overdueMonths: 2,
        });

      expect(
        prismaMock.notification.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          studentId: 'student-1',
          type: 'PAYMENT_OVERDUE',
          channel: 'SYSTEM',
          title: 'Aluno inadimplente',
          message:
            'João possui 2 mensalidade(s) em aberto. ' +
            'É necessário verificar a situação financeira.',
          status: 'PENDING',
        },
      });

      expect(result.id).toBe('notification-1');
    });

    it('não deve criar notificação duplicada', async () => {
      const existing = {
        id: 'notification-existing',
      };

      prismaMock.notification.findFirst.mockResolvedValue(
        existing,
      );

      const result =
        await service.createOverdueNotification({
          userId: 'user-1',
          studentId: 'student-1',
          studentName: 'João',
          overdueMonths: 2,
        });

      expect(
        prismaMock.notification.create,
      ).not.toHaveBeenCalled();

      expect(result).toEqual(existing);
    });
  });
});