import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AdsService } from '../ads/ads.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    vehicle: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    vehicleBrand: {
      findFirst: jest.fn(),
    },
    vehicleModel: {
      findFirst: jest.fn(),
    },
    partCategory: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
  };

  const mockAdsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedisService },
        { provide: AdsService, useValue: mockAdsService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('[SEARCH-U-01] Busca full-text em título e descrição retorna resultados relevantes', () => {
    it('should search with q parameter', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([{ id: 'vehicle-1', version: { model: { brand: { name: 'b' }, name: 'm' }, name: 'v' }, yearFab: { yearFab: 2020 }, photos: [], seller: {} }]);
      mockPrisma.vehicle.count.mockResolvedValue(1);

      await service.search({ q: 'Motor' });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                observations: expect.any(Object),
              })
            ])
          })
        })
      );
    });
  });

  describe('[SEARCH-U-02] Busca com filtros combinados (marca + cidade + estado) aplica todos os filtros com AND lógico', () => {
    it('should apply multiple filters properly', async () => {
      mockPrisma.vehicleBrand.findFirst.mockResolvedValue({ name: 'Fiat' });
      mockPrisma.vehicle.findMany.mockResolvedValue([{ id: 'vehicle-1', version: { model: { brand: { name: 'b' }, name: 'm' }, name: 'v' }, yearFab: { yearFab: 2020 }, photos: [], seller: {} }]);
      mockPrisma.vehicle.count.mockResolvedValue(1);

      await service.search({ brandId: 'fiat-id', city: 'São Paulo', state: 'SP' });

      // O SearchService mapeia filtros no 'where' da consulta prisma. Ele os agrupa por default usando lógica AND implícita pelo prisma.
      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: expect.objectContaining({ contains: 'São Paulo', mode: 'insensitive' }),
            state: 'SP',
          })
        })
      );
    });
  });
});
