import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    notification: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    notificationPreferences: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    notificationLog: {
      create: jest.fn(),
    }
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('notifications-queue'), useValue: mockQueue }
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('[NOTIF-U-01] Nova mensagem de chat dispara notificação para o destinatário', () => {
    it('should call send method with userId and create notification', async () => {
      mockPrisma.notificationPreferences.findUnique.mockResolvedValue({ userId: 'destinatario-1', inAppEnabled: true });
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      await service.send({ userId: 'destinatario-1', type: 'CHAT_NEW_MESSAGE', title: 'New message', body: 'Hello' });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'destinatario-1',
          type: 'CHAT_NEW_MESSAGE'
        })
      }));
    });
  });
});
