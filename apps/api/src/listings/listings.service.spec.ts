import { Test, TestingModule } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

describe('ListingsService', () => {
  let service: ListingsService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    sellerProfile: {
      findUnique: jest.fn(),
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
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('listings'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a listing successfully', async () => {
      const userId = 'user-1';
      const dto: any = {
        title: 'Peça Teste',
        description: 'Desc',
        versionId: 'v1',
        yearFabId: 'y1',
        color: 'Azul',
        city: 'SP',
        state: 'SP',
        availableParts: [],
        photos: [],
      };

      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ id: 'seller-1' });
      mockPrisma.vehicle.create.mockResolvedValue({ id: 'veh-1' });
      mockPrisma.listing.create.mockResolvedValue({ id: 'list-1', ...dto });

      const result = await service.create(userId, dto);

      expect(result).toBeDefined();
      expect(mockPrisma.listing.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not a seller', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);
      await expect(service.create('user-1', {} as any)).rejects.toThrow(ForbiddenException);
    });
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
  });
});
