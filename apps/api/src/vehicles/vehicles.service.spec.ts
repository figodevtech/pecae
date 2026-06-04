import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { CatalogService } from '../catalog/catalog.service';
import { VehicleStatus, ListingStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    vehicle: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    listing: {
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    vehicleBrand: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    vehicleModel: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    vehicleVersion: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    vehicleYear: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    vehiclePhoto: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      const tx = {
        vehicle: mockPrisma.vehicle,
        listing: mockPrisma.listing,
        vehicleBrand: mockPrisma.vehicleBrand,
        vehicleModel: mockPrisma.vehicleModel,
        vehicleVersion: mockPrisma.vehicleVersion,
        vehicleYear: mockPrisma.vehicleYear,
        vehiclePhoto: mockPrisma.vehiclePhoto,
      };
      return callback(tx);
    }),
  };

  const mockStorageService = {
    createSignedUploadUrl: jest.fn(),
  };

  const mockCatalogService = {
    invalidateCatalogCache: jest.fn(),
  };

  const mockQueue = {
    getJobs: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: CatalogService, useValue: mockCatalogService },
        { provide: getQueueToken('vehicle-photos'), useValue: mockQueue },
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
            status: VehicleStatus.DRAFT,
          }),
        })
      );
    });
  });

  describe('[VEH-U-05] update() remove campos undefined', () => {
    it('should clean undefined fields and update successfully', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';
      const dto: any = {
        color: 'azul',
        plate: undefined, // deve ser omitido
        title: 'New Title',
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId });
      mockPrisma.vehicle.update.mockResolvedValue({ id, color: 'azul' });
      mockPrisma.listing.findMany.mockResolvedValue([{ id: 'listing-1' }]);
      mockPrisma.listing.update.mockResolvedValue({ id: 'listing-1' });

      const result = await service.update(id, sellerId, dto);

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id },
        data: { color: 'azul', status: VehicleStatus.PENDING },
      });
      expect(result.vehicle.color).toBe('azul');
    });
  });

  describe('[VEH-U-06] markAsSold() e markAsRemoved() retornam o veiculo atualizado', () => {
    it('should update and return updated vehicle in markAsSold', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';

      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId });
      mockPrisma.vehicle.update.mockResolvedValue({ id, status: VehicleStatus.SOLD });

      const result = await service.markAsSold(id, sellerId);

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: VehicleStatus.SOLD },
      });
      expect(result).toEqual({ id, status: VehicleStatus.SOLD });
    });

    it('should update and return updated vehicle in markAsRemoved', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';

      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId });
      mockPrisma.vehicle.update.mockResolvedValue({ id, status: VehicleStatus.INACTIVE });

      const result = await service.markAsRemoved(id, sellerId);

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: VehicleStatus.INACTIVE },
      });
      expect(result).toEqual({ id, status: VehicleStatus.INACTIVE });
    });
  });

  describe('[VEH-U-07] reactivate() impede reativacao com duplicidade ativa', () => {
    it('should reactivate successfully if no duplicate is found', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';

      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId, status: VehicleStatus.INACTIVE, versionId: 'version-1', yearFabId: 'year-1' });
      mockPrisma.listing.findFirst.mockResolvedValue(null);
      mockPrisma.vehicle.update.mockResolvedValue({ id, status: VehicleStatus.PENDING });

      const result = await service.reactivate(id, sellerId);

      expect(result.vehicle.status).toBe(VehicleStatus.PENDING);
    });

    it('should throw ConflictException if duplicate listing exists', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';

      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId, status: VehicleStatus.INACTIVE, versionId: 'version-1', yearFabId: 'year-1' });
      mockPrisma.listing.findFirst.mockResolvedValue({ id: 'duplicate-listing-id' });

      await expect(service.reactivate(id, sellerId)).rejects.toThrow(ConflictException);
    });
  });

  describe('[VEH-U-08] findBySeller() retorna metadados de paginacao', () => {
    it('should return paginated listings and metadata', async () => {
      const sellerId = 'seller-1';
      mockPrisma.vehicle.count.mockResolvedValue(10);
      mockPrisma.vehicle.findMany.mockResolvedValue([
        {
          id: 'v-1',
          listings: [{ title: 'Title' }],
          version: { name: 'Uno', model: { name: 'Uno', brand: { name: 'Fiat' } } },
          yearFab: { yearFab: 2010 },
          color: 'red',
          city: 'SP',
          state: 'SP',
          status: VehicleStatus.DRAFT,
          createdAt: new Date(),
          photos: [],
          availableParts: [],
        }
      ]);

      const result = await service.findBySeller(sellerId, 1, 2);

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 10,
        page: 1,
        limit: 2,
        totalPages: 5,
      });
    });
  });

  describe('[VEH-U-09] generateUploadUrls() valida count de fotos', () => {
    it('should throw BadRequestException if count is less than 1 or greater than 20', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId });

      await expect(service.generateUploadUrls(id, sellerId, 0)).rejects.toThrow(BadRequestException);
      await expect(service.generateUploadUrls(id, sellerId, 21)).rejects.toThrow(BadRequestException);
    });
  });

  describe('[VEH-U-10] confirmPhotos() enfileira de forma segura', () => {
    it('should process photos and enqueue job successfully', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';
      const photos: any = [{ url: 'http://test.com/photo.jpg', type: 'EXTERIOR', order: 0 }];

      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId });
      mockQueue.remove.mockResolvedValue(null);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await service.confirmPhotos(id, sellerId, photos);

      expect(mockQueue.remove).toHaveBeenCalledWith(`vehicle-photos-${id}`);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-vehicle-photo',
        { vehicleId: id, photos },
        { jobId: `vehicle-photos-${id}` }
      );
      expect(result.message).toContain('Fotos recebidas com sucesso');
    });

    it('should throw BadRequestException if count exceeds 20', async () => {
      const id = 'vehicle-1';
      const sellerId = 'seller-1';
      const photos: any = Array.from({ length: 21 }, () => ({ url: 'a', type: 'EXTERIOR', order: 0 }));

      mockPrisma.vehicle.findUnique.mockResolvedValue({ id, sellerId });

      await expect(service.confirmPhotos(id, sellerId, photos)).rejects.toThrow(BadRequestException);
    });
  });
});
