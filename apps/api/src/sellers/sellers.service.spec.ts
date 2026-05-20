import { Test, TestingModule } from '@nestjs/testing';
import { SellersService } from './sellers.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Mock do Prisma
const mockPrisma = {
  sellerProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  sellerStats: {
    create: jest.fn(),
  },
  sellerVerification: {
    create: jest.fn(),
  },
  listing: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock do StorageService
const mockStorage = {
  createSignedUploadUrl: jest.fn(),
};

// Mock da Queue do BullMQ
const mockQueue = {
  add: jest.fn(),
};

describe('SellersService', () => {
  let service: SellersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
        { provide: getQueueToken('seller-stats'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<SellersService>(SellersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      storeName: 'Desmanche Alpha',
      whatsapp: '+5511999999999',
      address: 'Rua das Peças, 100',
      city: 'São Paulo',
      state: 'SP',
      type: 'PF' as any,
    };

    it('deve criar perfil de vendedor com stats em transaction', async () => {
      const mockProfile = { id: 'sp-1', ...dto, userId: 'user-1' };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null); // sem perfil existente
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.sellerProfile.create.mockResolvedValue(mockProfile);
      mockPrisma.sellerStats.create.mockResolvedValue({ sellerProfileId: 'sp-1' });

      const result = await service.create('user-1', dto);

      expect(result).toHaveProperty('id', 'sp-1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando usuário já tiver perfil de vendedor', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ id: 'sp-existente' });

      await expect(service.create('user-1', dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findPublicProfile', () => {
    it('deve retornar dados públicos do vendedor sem dados sensíveis', async () => {
      const mockProfile = {
        id: 'sp-1',
        storeName: 'Desmanche Alpha',
        city: 'São Paulo',
        state: 'SP',
        cnpj: '12345678000195',
        address: 'Rua das Peças, 100 — dado privado',
        lat: -23.55,
        lng: -46.63,
        whatsapp: '+5511999999999',
        phone: '11999999999',
        showWhatsapp: false,
        userId: 'user-1',
        isVerified: true,
        user: { status: 'ACTIVE' },
        stats: { activeListings: 5, avgResponseTimeMinutes: 15, rating: 4.8, totalReviews: 42 },
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findPublicProfile('sp-1');

      // Deve ocultar dados sensíveis
      expect(result).not.toHaveProperty('address');
      expect(result).not.toHaveProperty('lat');
      expect(result).not.toHaveProperty('lng');
      expect(result).not.toHaveProperty('userId');
      // whatsapp deve ser undefined pois showWhatsapp=false
      expect(result.whatsapp).toBeUndefined();
      // CNPJ mascarado
      expect(result.cnpj).toMatch(/\*\*/);
      // Stats incluídos
      expect(result.stats?.rating).toBe(4.8);
    });

    it('deve lançar NotFoundException para vendedor suspenso', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-2',
        user: { status: 'SUSPENDED' },
      });

      await expect(service.findPublicProfile('sp-2')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException para vendedor banido', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-3',
        user: { status: 'BANNED' },
      });

      await expect(service.findPublicProfile('sp-3')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException quando perfil não existir', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.findPublicProfile('sp-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestVerification', () => {
    it('deve gerar 5 slots de upload para verificação', async () => {
      const mockProfile = {
        id: 'sp-1',
        isVerified: false,
        verifications: [], // nenhuma pendente
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      mockStorage.createSignedUploadUrl.mockResolvedValue({
        uploadUrl: 'https://storage.example.com/signed',
        token: 'token-123',
        path: 'verifications/sp-1/doc_0',
        publicUrl: 'https://cdn.example.com/doc_0',
      });

      const result = await service.requestVerification('user-1');

      expect(result).toHaveLength(5);
      expect(mockStorage.createSignedUploadUrl).toHaveBeenCalledTimes(5);
    });

    it('deve lançar ConflictException quando já existir verificação pendente', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        isVerified: false,
        verifications: [{ id: 'v-1', status: 'PENDING' }], // já pendente
      });

      await expect(service.requestVerification('user-1')).rejects.toThrow(ConflictException);
      expect(mockStorage.createSignedUploadUrl).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando vendedor já estiver verificado', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        isVerified: true, // já verificado
        verifications: [],
      });

      await expect(service.requestVerification('user-1')).rejects.toThrow(ConflictException);
    });

    it('deve lançar NotFoundException quando perfil não existir', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.requestVerification('user-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('confirmVerificationRequest', () => {
    it('deve criar registro de verificação com status PENDING e as URLs dos documentos', async () => {
      const mockProfile = { id: 'sp-1' };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.sellerVerification.create.mockResolvedValue({
        id: 'v-1',
        status: 'PENDING',
        documentUrls: ['url-1', 'url-2'],
        sellerProfileId: 'sp-1',
      });

      const result = await service.confirmVerificationRequest('user-1', ['url-1', 'url-2']);

      expect(result.status).toBe('PENDING');
      expect(mockPrisma.sellerVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sellerProfileId: 'sp-1',
            documentUrls: ['url-1', 'url-2'],
            status: 'PENDING',
          }),
        }),
      );
    });
  });
});
