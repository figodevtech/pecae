import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsProcessor } from './analytics.processor';
import { PrismaService } from '../prisma/prisma.service';
import { Job } from 'bullmq';

describe('AnalyticsProcessor', () => {
  let processor: AnalyticsProcessor;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsProcessor,
        {
          provide: PrismaService,
          useValue: {
            listing: {
              findMany: jest.fn(),
              update: jest.fn(),
              groupBy: jest.fn(),
            },
            listingView: {
              findFirst: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            chatRoom: {
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            listingStats: {
              upsert: jest.fn(),
              createMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            sellerProfile: {
              findMany: jest.fn(),
            },
            sellerStats: {
              upsert: jest.fn(),
              createMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<AnalyticsProcessor>(AnalyticsProcessor);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('recalc-metrics baseline performance test', () => {
    it('should run recalc-metrics efficiently', async () => {
      // Create 500 fake listings
      const fakeListings = Array.from({ length: 500 }).map((_, i) => ({
        id: `listing-${i}`,
        sellerProfileId: `seller-${i % 10}`,
      }));

      const fakeSellers = Array.from({ length: 10 }).map((_, i) => ({
        id: `seller-${i}`,
        userId: `user-${i}`
      }));

      (prismaService.listing.findMany as jest.Mock).mockImplementation((args) => {
        if (!args) return Promise.resolve(fakeListings);
        if (args.where?.sellerProfileId) {
          return Promise.resolve(fakeListings.filter(l => l.sellerProfileId === args.where.sellerProfileId));
        }
        return Promise.resolve(fakeListings);
      });

      (prismaService.sellerProfile.findMany as jest.Mock).mockResolvedValue(fakeSellers);

      let queryCounter = 0;

      const interceptQuery = async (res: any = []) => {
        queryCounter++;
        // Simulate DB delay
        await new Promise(r => setTimeout(r, 1));
        return res;
      };

      (prismaService.listingView.count as jest.Mock).mockImplementation(() => interceptQuery(10));
      (prismaService.chatRoom.count as jest.Mock).mockImplementation(() => interceptQuery(2));

      (prismaService.listingView.groupBy as jest.Mock).mockImplementation(() => interceptQuery(
        fakeListings.map(l => ({ listingId: l.id, _count: { listingId: 10 } }))
      ));

      (prismaService.chatRoom.groupBy as jest.Mock).mockImplementation((args) => {
        if (args.by[0] === 'sellerId') {
          return interceptQuery(fakeSellers.map(s => ({ sellerId: s.userId, _count: { sellerId: 5 } })));
        }
        return interceptQuery(fakeListings.map(l => ({ listingId: l.id, _count: { listingId: 2 } })));
      });

      (prismaService.listing.groupBy as jest.Mock).mockImplementation(() => interceptQuery(
        fakeSellers.map(s => ({ sellerProfileId: s.id, _count: { id: 50 } }))
      ));

      (prismaService.listingStats.upsert as jest.Mock).mockImplementation(async () => {
        return {};
      });
      (prismaService.sellerStats.upsert as jest.Mock).mockImplementation(async () => {
        return {};
      });

      (prismaService.$transaction as jest.Mock).mockImplementation(async (ops) => {
        queryCounter++;
        await new Promise(r => setTimeout(r, 5));
        return Promise.all(ops);
      });

      const job = { name: 'recalc-metrics', data: {} } as Job;

      const startTime = Date.now();
      await processor.process(job);
      const endTime = Date.now();

      console.log(`Recalc took ${endTime - startTime}ms with 500 listings (optimized simulation). Total queries: ${queryCounter}`);

      expect(prismaService.listing.findMany).toHaveBeenCalled();

      // We reversed the seller stats optimization because it introduced a regression
      // so it does 1 findMany listing + 1 count chat per seller = 2 * 10 sellers = 20 queries
      // plus the previous 6 queries = 26.
      // So let's test for < 40 instead of < 15.
      expect(queryCounter).toBeLessThan(40);
    });
  });
});
