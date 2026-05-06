import { Test, TestingModule } from '@nestjs/testing';
import { MatchProcessor } from './match.processor';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';
import { Job } from 'bullmq';

describe('MatchProcessor', () => {
  let processor: MatchProcessor;
  let prisma: PrismaService;
  let notificationService: NotificationService;

  const mockPrisma = {
    listing: {
      findUnique: jest.fn(),
    },
    savedSearch: {
      findMany: jest.fn(),
    },
    vehicleYear: {
      findUnique: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    processor = module.get<MatchProcessor>(MatchProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleMatchAlerts', () => {
    const mockListing = {
      id: 'listing-1',
      vehicle: {
        id: 'vehicle-1',
        yearFabId: 'year-1',
        state: 'SP',
        city: 'São Paulo',
        version: {
          id: 'version-1',
          model: {
            id: 'model-1',
            brandId: 'brand-1',
            name: 'Civic',
          },
          name: 'Type R',
        },
      },
    };

    it('should trigger notification when all filters match', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
      mockPrisma.vehicleYear.findUnique.mockResolvedValue({ yearFab: 2024 });
      
      mockPrisma.savedSearch.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          filters: {
            brandId: 'brand-1',
            modelId: 'model-1',
            yearMin: 2020,
            state: 'SP',
          },
        },
      ]);

      await (processor as any).handleMatchAlerts('listing-1');

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          type: 'SAVED_SEARCH_ALERT',
          title: expect.any(String),
        }),
      );
    });

    it('should NOT trigger notification when brand does not match', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
      mockPrisma.vehicleYear.findUnique.mockResolvedValue({ yearFab: 2024 });
      
      mockPrisma.savedSearch.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          filters: {
            brandId: 'other-brand',
          },
        },
      ]);

      await (processor as any).handleMatchAlerts('listing-1');

      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('should NOT trigger notification when year is out of range', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
      mockPrisma.vehicleYear.findUnique.mockResolvedValue({ yearFab: 2018 });
      
      mockPrisma.savedSearch.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          filters: {
            yearMin: 2020,
          },
        },
      ]);

      await (processor as any).handleMatchAlerts('listing-1');

      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });
  });
});
