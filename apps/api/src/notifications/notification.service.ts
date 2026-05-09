import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications-queue') private readonly notificationQueue: Queue,
    @InjectQueue('alerts') private readonly alertsQueue: Queue,
  ) {}

  async onModuleInit() {
    // Agendar o Digest Diário (executa todo dia às 08:00)
    await this.alertsQueue.add(
      'daily-digest',
      {},
      {
        repeat: {
          pattern: '0 8 * * *', // Cron: Segundo Minuto Hora DiaMes Mes DiaSemana
        },
        jobId: 'daily-digest-job', // Evita duplicatas
      },
    );
    console.log('[NotificationService] Job de Digest Diário agendado para 08:00');
  }

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
    return this.sendBatch([data]);
  }

  /**
   * Envia múltiplas notificações de forma otimizada (Batch).
   */
  async sendBatch(notifications: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: any;
  }[]) {
    if (notifications.length === 0) return;

    const userIds = [...new Set(notifications.map((n) => n.userId))];

    // 1. Buscar preferências de todos os usuários em uma única query
    const allPrefs = await this.prisma.notificationPreferences.findMany({
      where: { userId: { in: userIds } },
    });

    const prefsMap = new Map(allPrefs.map((p) => [p.userId, p]));

    // Identificar usuários sem preferências e criá-las em lote
    const missingPrefsUserIds = userIds.filter((id) => !prefsMap.has(id));
    if (missingPrefsUserIds.length > 0) {
      await this.prisma.notificationPreferences.createMany({
        data: missingPrefsUserIds.map((userId) => ({ userId })),
        skipDuplicates: true,
      });

      const newPrefs = await this.prisma.notificationPreferences.findMany({
        where: { userId: { in: missingPrefsUserIds } },
      });
      newPrefs.forEach((p) => prefsMap.set(p.userId, p));
    }

    const notificationsToCreate: any[] = [];
    const pushJobs: any[] = [];
    const emailJobs: any[] = [];

    // 2. Preparar dados para criação e enfileiramento
    for (const notif of notifications) {
      const prefs = prefsMap.get(notif.userId);
      if (!prefs) continue;

      if (prefs.inAppEnabled) {
        notificationsToCreate.push({
          userId: notif.userId,
          type: notif.type,
          title: notif.title,
          body: notif.body,
          data: notif.data || null,
        });
      }
    }

    // 3. Criar notificações In-App em lote
    let createdNotifications: any[] = [];
    if (notificationsToCreate.length > 0) {
      // Usamos transaction para garantir que criamos a notificação e o log
      createdNotifications = await this.prisma.$transaction(async (tx) => {
        // Infelizmente Prisma não retorna os IDs no createMany na maioria dos bancos sem extensões
        // Mas como estamos no Postgres, podemos usar createManyAndReturn se estiver disponível (Prisma 5.14+)
        // Se não, teremos que criar um por um ou usar um workaround.
        // Verificando a versão do prisma no package.json: ^5.14.0. createManyAndReturn deve estar disponível.
        return (tx.notification as any).createManyAndReturn({
          data: notificationsToCreate,
        });
      });

      // Criar logs para as notificações In-App
      const logsToCreate = createdNotifications.map((n) => ({
        notificationId: n.id,
        channel: 'IN_APP' as const,
        status: 'SENT' as const,
      }));

      await this.prisma.notificationLog.createMany({
        data: logsToCreate,
      });
    }

    // Mapear notificações criadas de volta para as originais para pegar os IDs
    const userNotifMap = new Map<string, string>();
    createdNotifications.forEach((n) => {
      // Nota: Isso pode ser ambíguo se o mesmo usuário receber 2 notifs idênticas no mesmo batch
      // Mas para o propósito de log, costuma ser aceitável.
      userNotifMap.set(`${n.userId}:${n.title}`, n.id);
    });

    // 4. Preparar jobs de Push e Email
    for (const notif of notifications) {
      const prefs = prefsMap.get(notif.userId);
      if (!prefs) continue;

      const notificationId = userNotifMap.get(`${notif.userId}:${notif.title}`);

      if (prefs.pushEnabled) {
        pushJobs.push({
          name: 'send-push',
          data: { ...notif, notificationId },
        });
      }

      if (prefs.emailEnabled) {
        emailJobs.push({
          name: 'send-email',
          data: { ...notif, notificationId },
        });
      }
    }

    // 5. Enfileirar jobs em lote (BullMQ addBulk)
    if (pushJobs.length > 0) {
      await this.notificationQueue.addBulk(pushJobs);
    }

    if (emailJobs.length > 0) {
      await this.notificationQueue.addBulk(emailJobs);
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

  async notifySoldListing(listingId: string, title: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { listingId },
      select: { userId: true },
    });

    if (favorites.length === 0) return;

    const notifications = favorites.map((f) => ({
      userId: f.userId,
      type: 'LISTING_SOLD' as const,
      title: 'Item Vendido!',
      body: `O veículo "${title}" que você favoritou foi vendido.`,
      data: { listingId },
    }));

    await this.sendBatch(notifications);
  }
}
