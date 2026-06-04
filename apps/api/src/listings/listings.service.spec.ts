import { Test, TestingModule } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

describe('ListingsService', () => {
  let service: ListingsService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    sellerProfile: {
      findUnique: jest.fn(),
    },
    sellerStats: {
      create: jest.fn(),
      update: jest.fn(),
    },
    vehicle: {
      create: jest.fn(),
    },
    listing: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    partCategory: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    chatRoom: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockNotificationService = {
    notifySoldListing: jest.fn().mockResolvedValue(undefined),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: getQueueToken('listings'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDelete', () => {
    it('should mark listing as expired/deleted', async () => {
      const listingId = 'list-1';
      const userId = 'user-1';

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        sellerProfile: { userId },
      });

      await service.softDelete(listingId, userId);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: listingId },
        data: expect.objectContaining({
          status: 'EXPIRED',
          deletedAt: expect.any(Date),
        }),
      });
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'list-1',
        sellerProfile: { userId: 'other-user' },
      });

      await expect(service.softDelete('list-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if listing does not exist or is already soft deleted', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(service.softDelete('list-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update listing and vehicle details successfully without photos', async () => {
      const listingId = 'list-1';
      const userId = 'user-1';
      const dto = {
        title: 'Novo Titulo',
        description: 'Nova Desc',
        color: 'Vermelho',
      };

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        sellerProfile: { userId },
      });

      await service.update(listingId, userId, dto);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: listingId },
        data: expect.objectContaining({
          title: 'Novo Titulo',
          description: 'Nova Desc',
          status: 'PENDING',
          vehicle: {
            update: expect.objectContaining({
              color: 'Vermelho',
            }),
          },
        }),
      });
    });

    it('should update listing and vehicle details with photos successfully', async () => {
      const listingId = 'list-1';
      const userId = 'user-1';
      const dto = {
        title: 'Novo Titulo',
        description: 'Nova Desc',
        color: 'Vermelho',
        photos: [
          { url: 'http://img.png', order: 0, type: 'EXTERIOR' as any },
        ],
      };

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        sellerProfile: { userId },
      });

      await service.update(listingId, userId, dto);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: listingId },
        data: expect.objectContaining({
          title: 'Novo Titulo',
          description: 'Nova Desc',
          status: 'PENDING',
          vehicle: {
            update: expect.objectContaining({
              color: 'Vermelho',
              photos: {
                deleteMany: {},
                create: [
                  { url: 'http://img.png', order: 0, type: 'EXTERIOR' },
                ],
              },
            }),
          },
        }),
      });
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'list-1',
        sellerProfile: { userId: 'other-user' },
      });

      await expect(service.update('list-1', 'user-1', {} as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAsSold', () => {
    it('deve marcar anuncio publicado como vendido com sucesso', async () => {
      const listingId = 'list-1';
      const userId = 'user-1';

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 3600000), // 1 hora atras
        createdAt: new Date(),
        sellerProfile: {
          userId,
          stats: {
            id: 'stats-1',
            totalSalesCount: 10,
            avgSoldTimeMinutes: 100,
          },
        },
      });

      mockPrisma.listing.update.mockResolvedValue({
        id: listingId,
        status: 'SOLD',
      });

      const result = await service.markAsSold(listingId, userId);

      expect(result).toBeDefined();
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: listingId },
        data: expect.objectContaining({
          status: 'SOLD',
          soldAt: expect.any(Date),
        }),
      });
      expect(mockNotificationService.notifySoldListing).toHaveBeenCalled();
    });

    it('deve retornar imediatamente se o status do anuncio ja for SOLD', async () => {
      const listingId = 'list-1';
      const userId = 'user-1';

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        status: 'SOLD',
        sellerProfile: { userId },
      });

      const result = await service.markAsSold(listingId, userId);

      expect(result.status).toBe('SOLD');
      expect(mockPrisma.listing.update).not.toHaveBeenCalled();
    });

    it('deve lancar BadRequestException para transicao de status invalida', async () => {
      const listingId = 'list-1';
      const userId = 'user-1';

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        status: 'EXPIRED',
        sellerProfile: { userId },
      });

      await expect(service.markAsSold(listingId, userId)).rejects.toThrow(BadRequestException);
    });

    it('deve lancar ForbiddenException se o usuario nao for dono do anuncio', async () => {
      const listingId = 'list-1';

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        status: 'PUBLISHED',
        sellerProfile: { userId: 'other-user' },
      });

      await expect(service.markAsSold(listingId, 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('deve lancar NotFoundException se o anuncio nao existir', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(service.markAsSold('list-invalido', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
