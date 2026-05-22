import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  const mockPrisma = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserNotifications', () => {
    it('should call service with pagination params', async () => {
      mockNotificationService.getUserNotifications.mockResolvedValue({ items: [] });
      await controller.getUserNotifications({ user: { id: 'u1' } }, '10', 'cursor1');
      expect(service.getUserNotifications).toHaveBeenCalledWith('u1', 10, 'cursor1');
    });
  });

  describe('getUnreadCount', () => {
    it('should return count', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(5);
      const res = await controller.getUnreadCount({ user: { id: 'u1' } });
      expect(res).toEqual(5);
    });
  });

  describe('markAsRead', () => {
    it('should pass id and user to service', async () => {
      mockNotificationService.markAsRead.mockResolvedValue(undefined);
      const res = await controller.markAsRead({ user: { id: 'u1' } }, 'notif1');
      expect(service.markAsRead).toHaveBeenCalledWith('u1', 'notif1');
    });
  });

  describe('markAllAsRead', () => {
    it('should call service', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue(undefined);
      await controller.markAllAsRead({ user: { id: 'u1' } });
      expect(service.markAllAsRead).toHaveBeenCalledWith('u1');
    });
  });
});
