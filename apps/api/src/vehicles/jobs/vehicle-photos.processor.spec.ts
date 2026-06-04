import { Test, TestingModule } from '@nestjs/testing';
import { VehiclePhotosProcessor } from './vehicle-photos.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { VehicleStatus, ListingStatus, PhotoType } from '@prisma/client';

// Mock do sharp
jest.mock('sharp', () => {
  const sharpMock = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image-buffer')),
  }));
  return sharpMock;
});

describe('VehiclePhotosProcessor', () => {
  let processor: VehiclePhotosProcessor;
  let prisma: PrismaService;
  let storageService: StorageService;

  const mockPrisma: any = {
    vehicle: {
      update: jest.fn(),
    },
    listing: {
      updateMany: jest.fn(),
    },
    vehiclePhoto: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      const tx = {
        vehicle: mockPrisma.vehicle,
        listing: mockPrisma.listing,
        vehiclePhoto: mockPrisma.vehiclePhoto,
      };
      return callback(tx);
    }),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclePhotosProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    processor = module.get<VehiclePhotosProcessor>(VehiclePhotosProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
    jest.clearAllMocks();
    delete process.env.SKIP_IMAGE_PROCESSING;
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('[PROC-01] Processamento bem-sucedido', () => {
    it('deve processar as fotos, subir para o storage e atualizar o status para PENDING', async () => {
      const vehicleId = 'vehicle-1';
      const photos = [
        { url: 'https://cdn.example.com/raw-photo.jpg', type: PhotoType.EXTERIOR, order: 0 }
      ];

      // Mock da resposta de fetch global para imagem bruta
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });
      global.fetch = fetchMock;

      mockStorageService.uploadFile.mockResolvedValue('https://supabase.com/processed-photo.jpg');
      mockStorageService.deleteFile.mockResolvedValue(null);

      mockPrisma.vehiclePhoto.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.vehiclePhoto.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.vehicle.update.mockResolvedValue({ id: vehicleId, status: VehicleStatus.PENDING });
      mockPrisma.listing.updateMany.mockResolvedValue({ count: 1 });

      const result = await processor.process({
        data: { vehicleId, photos },
      } as any);

      expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/raw-photo.jpg');
      expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(2); // 1 principal + 1 thumb
      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: vehicleId },
        data: { status: VehicleStatus.PENDING },
      });
      expect(result.status).toBe('success');
    });
  });

  describe('[PROC-02] Bypass local/teste', () => {
    it('deve manter a URL original sem processar caso a URL seja mock/local', async () => {
      const vehicleId = 'vehicle-1';
      const photos = [
        { url: 'http://localhost:3000/mock.jpg', type: PhotoType.EXTERIOR, order: 0 }
      ];

      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      mockPrisma.vehiclePhoto.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.vehiclePhoto.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.vehicle.update.mockResolvedValue({ id: vehicleId, status: VehicleStatus.PENDING });

      await processor.process({
        data: { vehicleId, photos },
      } as any);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
      expect(mockPrisma.vehiclePhoto.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            url: 'http://localhost:3000/mock.jpg',
          })
        ]
      });
    });

    it('deve manter a URL original se SKIP_IMAGE_PROCESSING for true', async () => {
      process.env.SKIP_IMAGE_PROCESSING = 'true';
      const vehicleId = 'vehicle-1';
      const photos = [
        { url: 'https://example.com/real.jpg', type: PhotoType.EXTERIOR, order: 0 }
      ];

      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      mockPrisma.vehicle.update.mockResolvedValue({ id: vehicleId });

      await processor.process({
        data: { vehicleId, photos },
      } as any);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockPrisma.vehiclePhoto.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            url: 'https://example.com/real.jpg',
          })
        ]
      });
    });
  });

  describe('[PROC-03] Falha no processamento e resiliência (Rollback)', () => {
    it('deve fazer limpeza do storage e reverter status para DRAFT em caso de erro', async () => {
      const vehicleId = 'vehicle-1';
      const photos = [
        { url: 'https://cdn.example.com/corrupted.jpg', type: PhotoType.EXTERIOR, order: 0 }
      ];

      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });
      global.fetch = fetchMock;

      mockPrisma.vehicle.update.mockResolvedValue({ id: vehicleId, status: VehicleStatus.DRAFT });
      mockPrisma.listing.updateMany.mockResolvedValue({ count: 1 });

      await expect(processor.process({
        data: { vehicleId, photos },
      } as any)).rejects.toThrow();

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled(); // nenhum arquivo subiu
      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: vehicleId },
        data: { status: VehicleStatus.DRAFT },
      });
    });
  });
});
