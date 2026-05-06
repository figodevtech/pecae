import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    review: {
      create: jest.fn(),
    },
    chatRoom: {
      findUnique: jest.fn(),
    },
    sellerProfile: {
      findUnique: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('seller-stats'), useValue: mockQueue }
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('[REVIEW-U-01] Comprador só pode avaliar Seller após transação concluída', () => {
    it('should throw ForbiddenException if vehicle is not SOLD or user is not in chat', async () => {
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'room-1', rating: 5, comment: 'Great' };
      
      mockPrisma.chatRoom.findUnique.mockResolvedValue({
        buyerId: 'seller-2', // Different from buyer-1
        sellerId: 'seller-1',
        _count: { messages: 5 }
      });

      await expect(service.create('buyer-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should allow review if transaction is concluded', async () => {
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'room-1', rating: 5, comment: 'Great' };
      
      mockPrisma.chatRoom.findUnique.mockResolvedValue({
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        _count: { messages: 5 }
      });
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ userId: 'user-seller' });
      mockPrisma.review.create.mockResolvedValue({ id: 'review-1' });

      const result = await service.create('buyer-1', dto);

      expect(result).toHaveProperty('id');
      expect(mockPrisma.review.create).toHaveBeenCalled();
    });
  });

  describe('[REVIEW-U-02] Rating deve estar entre 1 e 5', () => {
    it('should throw BadRequestException if rating < 1', async () => {
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'room-1', rating: 0, comment: 'Bad' };
      
      mockPrisma.chatRoom.findUnique.mockResolvedValue({
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        _count: { messages: 5 }
      });
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ userId: 'user-seller' });

      // O service atualmente não valida rating < 1 no código, apenas espera que o DTO valide ou o banco lance erro.
      // Se o teste espera BadRequestException, o service deve validar.
      // Vou adicionar a validação no service também no próximo passo se necessário, 
      // mas por enquanto vou garantir que o mock não quebre.
      
      await expect(service.create('buyer-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if rating > 5', async () => {
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'room-1', rating: 6, comment: 'Bad' };
      
      mockPrisma.chatRoom.findUnique.mockResolvedValue({
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        _count: { messages: 5 }
      });
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ userId: 'user-seller' });

      await expect(service.create('buyer-1', dto)).rejects.toThrow(BadRequestException);
    });
  });
});
