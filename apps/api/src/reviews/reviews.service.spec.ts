import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Prisma } from '@prisma/client';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;
  let queue: any;

  const mockPrisma: any = {
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
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
    queue = module.get(getQueueToken('seller-stats'));
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
      await expect(service.create('buyer-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if rating > 5', async () => {
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'room-1', rating: 6, comment: 'Bad' };
      await expect(service.create('buyer-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('[REVIEW-U-03] Unique Review per ChatRoom', () => {
    it('should throw ConflictException on P2002 Prisma error', async () => {
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'room-1', rating: 5 };
      
      mockPrisma.chatRoom.findUnique.mockResolvedValue({
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        _count: { messages: 5 }
      });
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ userId: 'user-seller' });
      
      const error = new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '5.x',
      });
      mockPrisma.review.create.mockRejectedValue(error);

      await expect(service.create('buyer-1', dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('[REVIEW-U-04] BullMQ integration', () => {
    it('should enqueue recalc-seller-rating job after creating review', async () => {
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'room-1', rating: 5 };
      
      mockPrisma.chatRoom.findUnique.mockResolvedValue({
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        _count: { messages: 5 }
      });
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ userId: 'user-seller' });
      mockPrisma.review.create.mockResolvedValue({ id: 'review-1' });

      await service.create('buyer-1', dto as any);

      expect(queue.add).toHaveBeenCalledWith('recalc-seller-rating', {
        sellerProfileId: 'seller-1',
      });
    });
  });

  describe('[REVIEW-U-05] findAllBySeller with anonymized names', () => {
    it('should map reviews and anonymize buyer name', async () => {
      mockPrisma.review.findMany.mockResolvedValue([
        {
          id: 'r1',
          rating: 5,
          comment: 'Good',
          createdAt: new Date(),
          buyer: { name: 'João Carlos da Silva' }
        },
        {
          id: 'r2',
          rating: 4,
          comment: null,
          createdAt: new Date(),
          buyer: { name: 'Maria' }
        }
      ]);

      const result = await service.findAllBySeller('seller-1', 10);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].buyerName).toBe('João C.');
      expect(result.data[1].buyerName).toBe('Maria');
    });
  });
});
