import { Test, TestingModule } from '@nestjs/testing';
import { SellersService } from './sellers.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

// Mock do Prisma
const mockPrisma = {
  sellerProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  sellerStats: {
    create: jest.fn(),
  },
  sellerVerification: {
    create: jest.fn(),
    update: jest.fn(),
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
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockPrisma));
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
        showContactInfo: false,
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
      // whatsapp e phone devem ser undefined pois showContactInfo=false
      expect(result.whatsapp).toBeUndefined();
      expect(result.phone).toBeUndefined();
      // CNPJ mascarado
      expect(result.cnpj).toMatch(/\*\*/);
      // Stats incluídos
      expect(result.stats?.rating).toBe(4.8);
    });

    it('deve retornar whatsapp e phone quando showContactInfo for true', async () => {
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
        showContactInfo: true,
        userId: 'user-1',
        isVerified: true,
        user: { status: 'ACTIVE' },
        stats: { activeListings: 5, avgResponseTimeMinutes: 15, rating: 4.8, totalReviews: 42 },
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findPublicProfile('sp-1');

      expect(result.whatsapp).toBe('+5511999999999');
      expect(result.phone).toBe('11999999999');
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

  describe('getSellerListings', () => {
    it('deve retornar anuncios publicados se o perfil do vendedor estiver ativo e nao deletado', async () => {
      const mockProfile = {
        id: 'sp-1',
        deletedAt: null,
        user: { status: 'ACTIVE' },
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.listing.findMany.mockResolvedValue([
        { id: 'list-1', title: 'Peca A', status: 'PUBLISHED' },
      ]);

      const result = await service.getSellerListings('sp-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('list-1');
      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith({
        where: {
          sellerProfileId: 'sp-1',
          status: 'PUBLISHED',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('deve lancar NotFoundException se o perfil nao for encontrado', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.getSellerListings('sp-inexistente')).rejects.toThrow(NotFoundException);
    });

    it('deve lancar NotFoundException se o vendedor estiver deletado via soft-delete', async () => {
      const mockProfile = {
        id: 'sp-1',
        deletedAt: new Date(),
        user: { status: 'ACTIVE' },
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);

      await expect(service.getSellerListings('sp-1')).rejects.toThrow(NotFoundException);
    });

    it('deve lancar NotFoundException se o vendedor estiver suspenso ou banido', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        deletedAt: null,
        user: { status: 'SUSPENDED' },
      });

      await expect(service.getSellerListings('sp-1')).rejects.toThrow(NotFoundException);

      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        deletedAt: null,
        user: { status: 'BANNED' },
      });

      await expect(service.getSellerListings('sp-1')).rejects.toThrow(NotFoundException);
    });

    it('deve aplicar skip e take na paginação de getSellerListings se page e limit forem informados', async () => {
      const mockProfile = {
        id: 'sp-1',
        deletedAt: null,
        user: { status: 'ACTIVE' },
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.listing.findMany.mockResolvedValue([]);

      await service.getSellerListings('sp-1', { page: 2, limit: 5 });

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith({
        where: {
          sellerProfileId: 'sp-1',
          status: 'PUBLISHED',
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 5,
        take: 5,
      });
    });
  });

  describe('requestVerification', () => {
    it('deve gerar 5 slots de upload para verificação e criar solicitação PENDING no banco', async () => {
      const mockProfile = {
        id: 'sp-1',
        isVerified: false,
        verifications: [],
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      mockStorage.createSignedUploadUrl.mockResolvedValue({
        uploadUrl: 'https://storage.example.com/signed',
        token: 'token-123',
        path: 'verifications/sp-1/doc_0',
        publicUrl: 'https://cdn.example.com/doc_0',
      });
      mockPrisma.sellerVerification.create.mockResolvedValue({
        id: 'v-1',
        status: 'PENDING',
        documentUrls: [],
        sellerProfileId: 'sp-1',
      });

      const result = await service.requestVerification('user-1');

      expect(result).toHaveLength(5);
      expect(mockStorage.createSignedUploadUrl).toHaveBeenCalledTimes(5);
      expect(mockPrisma.sellerVerification.create).toHaveBeenCalledWith({
        data: {
          sellerProfileId: 'sp-1',
          documentUrls: [],
          status: 'PENDING',
        },
      });
    });

    it('deve lançar ConflictException quando já existir verificação pendente', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        isVerified: false,
        verifications: [{ id: 'v-1', status: 'PENDING' }],
      });

      await expect(service.requestVerification('user-1')).rejects.toThrow(ConflictException);
      expect(mockStorage.createSignedUploadUrl).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando vendedor já estiver verificado', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        isVerified: true,
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
    it('deve atualizar registro de verificação existente com status PENDING e as URLs dos documentos', async () => {
      const mockProfile = {
        id: 'sp-1',
        verifications: [
          { id: 'v-1', status: 'PENDING', documentUrls: [] }
        ]
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.sellerVerification.update.mockResolvedValue({
        id: 'v-1',
        status: 'PENDING',
        documentUrls: ['url-1', 'url-2'],
        sellerProfileId: 'sp-1',
      });

      const result = await service.confirmVerificationRequest('user-1', ['url-1', 'url-2']);

      expect(result.status).toBe('PENDING');
      expect(mockPrisma.sellerVerification.update).toHaveBeenCalledWith({
        where: { id: 'v-1' },
        data: {
          documentUrls: ['url-1', 'url-2'],
        },
      });
    });

    it('deve lançar BadRequestException se não houver verificação pendente para atualizar', async () => {
      const mockProfile = {
        id: 'sp-1',
        verifications: []
      };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);

      await expect(
        service.confirmVerificationRequest('user-1', ['url-1', 'url-2'])
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = { storeName: 'Novo Nome', openHours: { mon: '09-18' } };

    it('deve atualizar o perfil de vendedor com sucesso', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ id: 'sp-1', userId: 'user-1' });
      mockPrisma.sellerProfile.update.mockResolvedValue({ id: 'sp-1', ...updateDto });

      const result = await service.update('user-1', updateDto);

      expect(result).toHaveProperty('storeName', 'Novo Nome');
      expect(mockPrisma.sellerProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: {
          ...updateDto,
          openHours: updateDto.openHours,
        },
      });
    });

    it('deve lançar NotFoundException se o vendedor não for encontrado', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.update('user-1', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmLogoUpload', () => {
    it('deve atualizar o logo do vendedor com sucesso', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ id: 'sp-1', userId: 'user-1' });
      mockPrisma.sellerProfile.update.mockResolvedValue({ id: 'sp-1', logo: 'https://new-logo.png' });

      const result = await service.confirmLogoUpload('user-1', 'https://new-logo.png');

      expect(result.logo).toBe('https://new-logo.png');
      expect(mockPrisma.sellerProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { logo: 'https://new-logo.png' },
      });
    });

    it('deve lançar NotFoundException se o vendedor não for encontrado', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.confirmLogoUpload('user-1', 'https://logo.png')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('deve retornar as estatísticas do vendedor com sucesso', async () => {
      const stats = { activeListings: 10, rating: 4.5 };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-1',
        stats,
      });

      const result = await service.getStats('user-1');

      expect(result).toEqual(stats);
    });

    it('deve lançar NotFoundException se o vendedor não for encontrado', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.getStats('user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
