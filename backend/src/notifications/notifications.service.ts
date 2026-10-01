import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Cria uma nova notificação.
   */
  async create(createNotificationDto: CreateNotificationDto) {
    const {
      userId,
      type,
      channel,
      title,
      message,
      studentId,
    } = createNotificationDto;

    return this.prisma.notification.create({
      data: {
        userId,
        type,
        channel: channel ?? 'SYSTEM',
        title,
        message,
        studentId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Lista todas as notificações de uma usuária.
   */
  async findAll(userId?: string) {
    return this.prisma.notification.findMany({
      where: userId
        ? { userId }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Lista apenas notificações não lidas.
   */
  async findUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        readAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Busca uma notificação específica.
   */
  async findOne(id: string) {
    const notification =
      await this.prisma.notification.findUnique({
        where: { id },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notificação não encontrada.',
      );
    }

    return notification;
  }

  /**
   * Marca uma notificação como lida.
   */
  async markAsRead(id: string) {
    const notification =
      await this.prisma.notification.findUnique({
        where: { id },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notificação não encontrada.',
      );
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  /**
   * Marca todas as notificações de uma usuária como lidas.
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  /**
   * Atualiza o status de envio da notificação.
   */
  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    const notification =
      await this.prisma.notification.findUnique({
        where: { id },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notificação não encontrada.',
      );
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        status: updateNotificationDto.status,
        sentAt:
          updateNotificationDto.status === 'SENT'
            ? new Date()
            : undefined,
      },
    });
  }

  /**
   * Verifica se já existe uma notificação de inadimplência
   * para uma determinada mensalidade.
   *
   * Isso evita que a rotina automática crie notificações
   * duplicadas todos os dias.
   */
  async hasOverdueNotification(
    userId: string,
    studentId: string,
    referenceMonth: number,
    referenceYear: number,
  ): Promise<boolean> {
    const startDate = new Date(
      referenceYear,
      referenceMonth - 1,
      1,
    );

    const endDate = new Date(
      referenceYear,
      referenceMonth,
      1,
    );

    const notification =
      await this.prisma.notification.findFirst({
        where: {
          userId,
          studentId,
          type: 'PAYMENT_OVERDUE',
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

    return !!notification;
  }

  /**
   * Cria uma notificação de inadimplência somente
   * se ainda não existir uma para aquele período.
   */
  async createOverdueNotification(params: {
    userId: string;
    studentId: string;
    studentName: string;
    overdueMonths: number;
  }) {
    const {
      userId,
      studentId,
      studentName,
      overdueMonths,
    } = params;

    const alreadyExists =
      await this.prisma.notification.findFirst({
        where: {
          userId,
          studentId,
          type: 'PAYMENT_OVERDUE',
          status: {
            in: ['PENDING', 'SENT', 'READ'],
          },
          createdAt: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1,
            ),
          },
        },
      });

    if (alreadyExists) {
      return alreadyExists;
    }

    return this.prisma.notification.create({
      data: {
        userId,
        studentId,
        type: 'PAYMENT_OVERDUE',
        channel: 'SYSTEM',
        title: 'Aluno inadimplente',
        message:
          `${studentName} possui ${overdueMonths} ` +
          `mensalidade(s) em aberto. ` +
          `É necessário verificar a situação financeira.`,
        status: 'PENDING',
      },
    });
  }
}