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
      // Current implementation in codebase uses mockValidateChatInteraction('empty-chat') to simulate false.
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'empty-chat', rating: 5, comment: 'Great' };
      await expect(service.create('buyer-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should allow review if transaction is concluded', async () => {
      const dto = { sellerProfileId: 'seller-1', chatRoomId: 'room-1', rating: 5, comment: 'Great' };
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
});
