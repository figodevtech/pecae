import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: ReviewsService;

  const mockReviewsService = {
    create: jest.fn(),
    findAllBySeller: jest.fn(),
  };

  const mockPrisma = {}; // Para satisfazer as dependências do JwtAuthGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        { provide: ReviewsService, useValue: mockReviewsService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should pass userId and dto to service.create', async () => {
      const dto = { sellerProfileId: 's1', chatRoomId: 'c1', rating: 5, comment: 'Bom' };
      const req = { user: { id: 'u1' } };
      
      mockReviewsService.create.mockResolvedValue({ id: 'r1' });
      
      const result = await controller.create(req, dto);
      
      expect(service.create).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual({ id: 'r1' });
    });
  });

  describe('getSellerReviews', () => {
    it('should call service.findAllBySeller with params', async () => {
      mockReviewsService.findAllBySeller.mockResolvedValue({ data: [], meta: {} });
      
      const result = await controller.getSellerReviews('s1', 10, 'cursor1');
      
      expect(service.findAllBySeller).toHaveBeenCalledWith('s1', 10, 'cursor1');
      expect(result.data).toEqual([]);
    });
  });
});
