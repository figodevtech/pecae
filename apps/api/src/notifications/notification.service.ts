import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications-queue') private readonly notificationQueue: Queue,
  ) {}

  /**
   * Envia uma notificação e delega push/email para segundo plano via BullMQ.
   */
  async send(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: any;
  }) {
    // 1. Buscar preferências de notificação do usuário
    let prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId: data.userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreferences.create({
        data: { userId: data.userId },
      });
    }

    let notificationId: string | undefined;

    // 2. Persistir no app se habilitado
    if (prefs.inAppEnabled) {
      const createdNotification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data || null,
        },
      });
      notificationId = createdNotification.id;

      // Log imediato de sucesso no IN_APP
      await this.prisma.notificationLog.create({
        data: {
          notificationId,
          channel: 'IN_APP',
          status: 'SENT',
        },
      });
    }

    // 3. Enfileirar Push Notifications
    if (prefs.pushEnabled) {
      await this.notificationQueue.add('send-push', {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
        notificationId,
      });
    }

    // 4. Enfileirar E-mail Notifications
    if (prefs.emailEnabled) {
      await this.notificationQueue.add('send-email', {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
        notificationId,
      });
    }
  }

  async getUserNotifications(userId: string, limit: number = 20, cursor?: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const nextCursor = notifications.length === limit ? notifications[notifications.length - 1].id : null;

    return {
      items: notifications,
      nextCursor,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Ação não permitida para este usuário');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}
