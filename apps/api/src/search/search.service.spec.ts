import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AdsService } from '../ads/ads.service';

describe('SearchService', () => {
  let service: SearchService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockPrisma = {
      vehicleBrand: {
        findMany: jest.fn(),
      },
      vehicleModel: {
        findMany: jest.fn(),
      },
      vehicle: {
        findMany: jest.fn(),
      },
      partCategory: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const mockAdsService = {
      getPromotedAds: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: AdsService, useValue: mockAdsService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return paginated results for vehicles', async () => {
      const filters = { q: 'motor', limit: 10 };
      const mockVehicles = [
        {
          id: 'v1',
          createdAt: new Date(),
          availableParts: ['p1'],
          color: 'Black',
          city: 'São Paulo',
          state: 'SP',
          photos: [{ url: 'photo1.jpg' }],
          version: {
            name: '1.0 Turbo',
            model: {
              name: 'HB20',
              brand: { name: 'Hyundai' },
            },
          },
          yearFab: { yearFab: 2022 },
          seller: {
            id: 's1',
            storeName: 'Loja 1',
            city: 'São Paulo',
            state: 'SP',
            isVerified: true,
          },
        },
      ];

      mockPrisma.partCategory.findMany.mockResolvedValue([{ id: 'p1', name: 'Motor' }]);
      mockPrisma.vehicle.findMany.mockResolvedValue(mockVehicles);

      const result = await service.search(filters);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].brand).toBe('Hyundai');
      expect(result.data[0].availableParts).toContain('Motor');
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should return cached results if available', async () => {
      const cachedResult = { data: [], nextCursor: null, hasMore: false };
      mockRedis.get.mockResolvedValue(cachedResult);

      const result = await service.search({});

      expect(result).toEqual(cachedResult);
      expect(mockPrisma.vehicle.findMany).not.toHaveBeenCalled();
    });

    it('should filter by brandId correctly', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);
      
      await service.search({ brandId: 'b1' });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            version: expect.objectContaining({
              model: { brandId: 'b1' }
            }),
          }),
        }),
      );
    });
  });

  describe('getSuggestions', () => {
    it('should return empty array if query is empty string', async () => {
      const result = await service.getSuggestions('');
      expect(result).toEqual([]);
    });

    it('should return empty array if query is undefined', async () => {
      const result = await service.getSuggestions(undefined as any);
      expect(result).toEqual([]);
    });

    it('should return empty array if query is null', async () => {
      const result = await service.getSuggestions(null as any);
      expect(result).toEqual([]);
    });

    it('should return empty array if query is whitespace', async () => {
      const result = await service.getSuggestions('   ');
      expect(result).toEqual([]);
    });

    it('should return suggestions from brands and models', async () => {
      const query = 'test';
      const mockBrands = [{ id: '1', name: 'Brand Test' }];
      const mockModels = [{ id: '2', name: 'Model Test' }];

      mockPrisma.vehicleBrand.findMany.mockResolvedValue(mockBrands);
      mockPrisma.vehicleModel.findMany.mockResolvedValue(mockModels);

      const result = await service.getSuggestions(query);

      expect(result).toEqual([
        { text: 'Brand Test', type: 'BRAND', id: '1' },
        { text: 'Model Test', type: 'MODEL', id: '2' },
      ]);
      expect(mockPrisma.vehicleBrand.findMany).toHaveBeenCalledWith({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 5,
      });
      expect(mockPrisma.vehicleModel.findMany).toHaveBeenCalledWith({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 5,
      });
    });

    it('should trim the query', async () => {
      const query = '  trimmed  ';
      mockPrisma.vehicleBrand.findMany.mockResolvedValue([]);
      mockPrisma.vehicleModel.findMany.mockResolvedValue([]);

      await service.getSuggestions(query);

      expect(mockPrisma.vehicleBrand.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'trimmed', mode: 'insensitive' } },
        take: 5,
      });
    });

    it('should handle no results from both brands and models', async () => {
      mockPrisma.vehicleBrand.findMany.mockResolvedValue([]);
      mockPrisma.vehicleModel.findMany.mockResolvedValue([]);

      const result = await service.getSuggestions('unknown');

      expect(result).toEqual([]);
    });
  });
});
