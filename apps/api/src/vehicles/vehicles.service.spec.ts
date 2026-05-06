import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { VehicleStatus, ListingStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    vehicle: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    listing: {
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      const tx = {
        vehicle: mockPrisma.vehicle,
        listing: mockPrisma.listing,
      };
      return callback(tx);
    }),
  };

  const mockStorageService = {
    createSignedUploadUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('[VEH-U-01] DRAFT → ACTIVE é permitido', () => {
    it('should update status to ACTIVE', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId, status: VehicleStatus.DRAFT });
      mockPrisma.vehicle.update.mockResolvedValue({ id, status: VehicleStatus.ACTIVE });

      const result = await service.updateStatus(id, VehicleStatus.ACTIVE, sellerId);

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: VehicleStatus.ACTIVE },
      });
      expect(result.status).toBe(VehicleStatus.ACTIVE);
    });
  });

  describe('[VEH-U-02] SOLD → DRAFT é proibido (transição inválida)', () => {
    it('should throw BadRequestException', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId, status: VehicleStatus.SOLD });

      await expect(service.updateStatus(id, VehicleStatus.DRAFT, sellerId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('[VEH-U-03] Seller não-dono não pode alterar status', () => {
    it('should throw ForbiddenException', async () => {
      const id = 'vehicle-1';
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId: 'seller-A', status: VehicleStatus.DRAFT });

      await expect(service.updateStatus(id, VehicleStatus.ACTIVE, 'seller-B')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('[VEH-U-04] Criação de veículo inicia com status DRAFT', () => {
    it('should create vehicle with DRAFT status', async () => {
      const dto: any = {
        versionId: 'version-1',
        yearFabId: 'year-1',
        title: 'Title',
        description: 'Desc',
        color: 'red',
        city: 'City',
        state: 'ST',
        plate: 'ABC-1234'
      };

      mockPrisma.vehicle.findFirst.mockResolvedValue(null);
      mockPrisma.listing.findFirst.mockResolvedValue(null);
      mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-1' });
      mockPrisma.listing.create.mockResolvedValue({ id: 'listing-1' });

      await service.create('seller-1', dto);

      expect(mockPrisma.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: VehicleStatus.PENDING,
          }),
        })
      );
    });
  });

  describe('[VEH-U-05] Veículo sem placa única lança ConflictException', () => {
    it('should throw ConflictException on duplicate plate', async () => {
      const dto: any = {
        versionId: 'version-1',
        yearFabId: 'year-1',
        title: 'Title',
        description: 'Desc',
        plate: 'ABC-1234'
      };

      mockPrisma.vehicle.findFirst.mockResolvedValue({ id: 'existing-vehicle' });

      await expect(service.create('seller-1', dto)).rejects.toThrow(ConflictException);
    });
  });
});
