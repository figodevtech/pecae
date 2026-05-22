import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from './notification.processor';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { IPushProvider } from './providers/push-provider.interface';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let prisma: PrismaService;
  let pushProvider: IPushProvider;
  let mailService: MailService;
  let configService: ConfigService;

  const mockPrisma: any = {
    pushToken: {
      findMany: jest.fn(),
    },
    notificationLog: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockPushProvider = {
    sendPush: jest.fn(),
  };

  const mockMailService = {
    sendVerificationStatusEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: IPushProvider, useValue: mockPushProvider },
      ],
    }).compile();

    processor = module.get<NotificationProcessor>(NotificationProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    pushProvider = module.get<IPushProvider>(IPushProvider);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  describe('[NOTIF-U-01] send-push job processing', () => {
    it('should call IPushProvider for each token and log SENT', async () => {
      mockPrisma.pushToken.findMany.mockResolvedValue([
        { token: 'expo-token-1' },
        { token: 'expo-token-2' }
      ]);
      mockPushProvider.sendPush.mockResolvedValue(undefined);

      const job: any = {
        name: 'send-push',
        data: {
          userId: 'user-1',
          title: 'Hello',
          body: 'World',
          notificationId: 'notif-1',
          data: { foo: 'bar' }
        }
      };

      await processor.process(job);

      expect(mockPrisma.pushToken.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(mockPushProvider.sendPush).toHaveBeenCalledTimes(2);
      expect(mockPushProvider.sendPush).toHaveBeenCalledWith('expo-token-1', 'Hello', 'World', { foo: 'bar' });
      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SENT', channel: 'PUSH' })
        })
      );
    });

    it('should log FAILED if pushProvider throws', async () => {
      mockPrisma.pushToken.findMany.mockResolvedValue([{ token: 'expo-token-1' }]);
      mockPushProvider.sendPush.mockRejectedValue(new Error('Push error'));

      const job: any = {
        name: 'send-push',
        data: { userId: 'user-1', notificationId: 'notif-1' }
      };

      await expect(processor.process(job)).rejects.toThrow('Push error');

      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED', error: 'Push error' })
        })
      );
    });
  });

  describe('[NOTIF-U-02] send-email job processing (Sandbox mock)', () => {
    it('should NOT call mailService if not production or domain unverified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@pecae.com', name: 'Test' });
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'RESEND_DOMAIN_VERIFIED') return 'false';
        return null;
      });

      const job: any = {
        name: 'send-email',
        data: { userId: 'user-1', notificationId: 'notif-1', title: 'Hello' }
      };

      await processor.process(job);

      expect(mockMailService.sendVerificationStatusEmail).not.toHaveBeenCalled();
      expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SENT', channel: 'EMAIL' })
        })
      );
    });

    it('should call mailService if production AND domain verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@pecae.com', name: 'Test' });
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'RESEND_DOMAIN_VERIFIED') return 'true';
        return null;
      });

      const job: any = {
        name: 'send-email',
        data: { userId: 'user-1', notificationId: 'notif-1', title: 'Hello', body: 'World' }
      };

      await processor.process(job);

      expect(mockMailService.sendVerificationStatusEmail).toHaveBeenCalledWith(
        'test@pecae.com', 'Test', 'APPROVED', 'World'
      );
    });
  });
});
