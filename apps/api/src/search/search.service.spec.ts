import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AdsService } from '../ads/ads.service';
import { ListingStatus } from '@prisma/client';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockPrisma = {
    listing: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockAdsService = {
    getPromotedAds: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: AdsService, useValue: mockAdsService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return results and total count', async () => {
      const filters = { q: 'motor', page: 1, limit: 10 };
      const mockListings = [{ id: '1', title: 'Motor V8' }];

      mockPrisma.listing.findMany.mockResolvedValue(mockListings);
      mockPrisma.listing.count.mockResolvedValue(1);

      const result = await service.search(filters);

      expect(result.data).toEqual(mockListings);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ListingStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('should apply price filters correctly', async () => {
      const filters = { priceMin: 100, priceMax: 500 };
      
      await service.search(filters);

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: {
              gte: 100,
              lte: 500,
            },
          }),
        }),
      );
    });
  });
});
