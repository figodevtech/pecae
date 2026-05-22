import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: PrismaService;
  let notifQueue: any;

  const mockPrisma: any = {
    notification: {
      createManyAndReturn: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    notificationPreferences: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    notificationLog: {
      createMany: jest.fn(),
    },
    favorite: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => {
      return cb(mockPrisma);
    }),
  };

  const mockQueue = {
    add: jest.fn(),
    addBulk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('notifications-queue'), useValue: mockQueue },
        { provide: getQueueToken('alerts'), useValue: mockQueue }
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
    notifQueue = module.get(getQueueToken('notifications-queue'));
    jest.clearAllMocks();
  });

  describe('[NOTIF-S-01] sendBatch logic', () => {
    it('should create preferences if missing, create notifications, and add to BullMQ queues', async () => {
      // Setup missing preference for user-2
      mockPrisma.notificationPreferences.findMany
        .mockResolvedValueOnce([
          { userId: 'user-1', inAppEnabled: true, pushEnabled: true, emailEnabled: false }
        ])
        .mockResolvedValueOnce([
          { userId: 'user-2', inAppEnabled: true, pushEnabled: false, emailEnabled: true }
        ]);

      mockPrisma.notification.createManyAndReturn.mockResolvedValue([
        { id: 'notif-1', userId: 'user-1', title: 'T1' },
        { id: 'notif-2', userId: 'user-2', title: 'T2' }
      ]);

      await service.sendBatch([
        { userId: 'user-1', type: 'CHAT_NEW_MESSAGE', title: 'T1', body: 'B1' },
        { userId: 'user-2', type: 'CHAT_NEW_MESSAGE', title: 'T2', body: 'B2' }
      ]);

      // Check createMany preferences
      expect(mockPrisma.notificationPreferences.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-2' }],
        skipDuplicates: true
      });

      // Check transaction and inApp creations
      expect(mockPrisma.notification.createManyAndReturn).toHaveBeenCalled();
      expect(mockPrisma.notificationLog.createMany).toHaveBeenCalled();

      // Check BullMQ queues
      expect(mockQueue.addBulk).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'send-push', data: expect.objectContaining({ userId: 'user-1' }) })
      ]);
      expect(mockQueue.addBulk).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'send-email', data: expect.objectContaining({ userId: 'user-2' }) })
      ]);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read if it belongs to user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1', userId: 'user-1' });
      
      await service.markAsRead('user-1', 'notif-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true }
      });
    });
  });

  describe('notifySoldListing', () => {
    it('should notify all users who favorited the listing', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);
      mockPrisma.notificationPreferences.findMany.mockResolvedValue([
        { userId: 'user-1', inAppEnabled: true },
        { userId: 'user-2', inAppEnabled: true }
      ]);
      mockPrisma.notification.createManyAndReturn.mockResolvedValue([]);

      await service.notifySoldListing('listing-1', 'Carro X');

      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({ where: { listingId: 'listing-1' }, select: { userId: true } });
      expect(mockPrisma.notification.createManyAndReturn).toHaveBeenCalled();
    });
  });
});
