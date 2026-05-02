import { Test, TestingModule } from '@nestjs/testing';
import { AdsService } from './ads.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdCampaignStatus } from '@prisma/client';

describe('AdsService', () => {
  let service: AdsService;
  let prisma: PrismaService;
  let redis: RedisService;
  let queue: any;

  const mockPrisma = {
    listing: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adCampaign: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: getQueueToken('ads'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AdsService>(AdsService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    queue = module.get(getQueueToken('ads'));

    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    const dto = {
      listingId: 'listing-1',
      budget: 100,
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2023-01-31T23:59:59Z',
    };

    it('should throw NotFoundException if listing not found', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);
      await expect(service.createCampaign(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if listing is not PUBLISHED', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', status: 'DRAFT' });
      await expect(service.createCampaign(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if active campaign already exists', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', status: 'PUBLISHED' });
      mockPrisma.adCampaign.findFirst.mockResolvedValue({ id: 'campaign-1' });

      await expect(service.createCampaign(dto)).rejects.toThrow(BadRequestException);
    });

    it('should create campaign and update listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', status: 'PUBLISHED' });
      mockPrisma.adCampaign.findFirst.mockResolvedValue(null);
      mockPrisma.adCampaign.create.mockResolvedValue({ id: 'new-campaign' });

      const result = await service.createCampaign(dto);

      expect(mockPrisma.adCampaign.create).toHaveBeenCalledWith({
        data: {
          listingId: dto.listingId,
          budget: dto.budget,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          status: AdCampaignStatus.ACTIVE,
        },
      });
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: dto.listingId },
        data: { isSponsoredActive: true },
      });
      expect(result).toEqual({ id: 'new-campaign' });
    });
  });

  describe('pauseCampaign', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.adCampaign.findUnique.mockResolvedValue(null);
      await expect(service.pauseCampaign('campaign-1')).rejects.toThrow(NotFoundException);
    });

    it('should update campaign status and listing', async () => {
      mockPrisma.adCampaign.findUnique.mockResolvedValue({ id: 'campaign-1', listingId: 'listing-1' });
      mockPrisma.adCampaign.update.mockResolvedValue({ id: 'campaign-1', status: AdCampaignStatus.PAUSED });

      const result = await service.pauseCampaign('campaign-1');

      expect(mockPrisma.adCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { status: AdCampaignStatus.PAUSED },
      });
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { isSponsoredActive: false },
      });
      expect(result).toEqual({ id: 'campaign-1', status: AdCampaignStatus.PAUSED });
    });
  });

  describe('resumeCampaign', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.adCampaign.findUnique.mockResolvedValue(null);
      await expect(service.resumeCampaign('campaign-1')).rejects.toThrow(NotFoundException);
    });

    it('should update campaign status and listing', async () => {
      mockPrisma.adCampaign.findUnique.mockResolvedValue({ id: 'campaign-1', listingId: 'listing-1' });
      mockPrisma.adCampaign.update.mockResolvedValue({ id: 'campaign-1', status: AdCampaignStatus.ACTIVE });

      const result = await service.resumeCampaign('campaign-1');

      expect(mockPrisma.adCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { status: AdCampaignStatus.ACTIVE },
      });
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { isSponsoredActive: true },
      });
      expect(result).toEqual({ id: 'campaign-1', status: AdCampaignStatus.ACTIVE });
    });
  });

  describe('cancelCampaign', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.adCampaign.findUnique.mockResolvedValue(null);
      await expect(service.cancelCampaign('campaign-1')).rejects.toThrow(NotFoundException);
    });

    it('should update campaign status and listing', async () => {
      mockPrisma.adCampaign.findUnique.mockResolvedValue({ id: 'campaign-1', listingId: 'listing-1' });
      mockPrisma.adCampaign.update.mockResolvedValue({ id: 'campaign-1', status: AdCampaignStatus.CANCELLED });

      const result = await service.cancelCampaign('campaign-1');

      expect(mockPrisma.adCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { status: AdCampaignStatus.CANCELLED },
      });
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { isSponsoredActive: false },
      });
      expect(result).toEqual({ id: 'campaign-1', status: AdCampaignStatus.CANCELLED });
    });
  });

  describe('trackImpression', () => {
    it('should add track-impression job to queue', async () => {
      const dto: any = { campaignId: 'c1' };
      const ip = '127.0.0.1';

      const result = await service.trackImpression(dto, ip);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'track-impression',
        { ...dto, ip },
        { removeOnComplete: true }
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle queue errors silently', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.trackImpression({ campaignId: 'c1' } as any, '127.0.0.1');

      expect(result).toEqual({ success: true });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackClick', () => {
    it('should add track-click job to queue', async () => {
      const dto: any = { campaignId: 'c1' };
      const ip = '127.0.0.1';

      const result = await service.trackClick(dto, ip);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'track-click',
        { ...dto, ip },
        { removeOnComplete: true }
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle queue errors silently', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.trackClick({ campaignId: 'c1' } as any, '127.0.0.1');

      expect(result).toEqual({ success: true });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('checkInterstitialCapping', () => {
    it('should return allowed false if key exists', async () => {
      mockRedis.get.mockResolvedValue(true);
      const result = await service.checkInterstitialCapping('user-1');
      expect(result).toEqual({ allowed: false });
    });

    it('should return allowed true and set key if not exists', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await service.checkInterstitialCapping('user-1');
      expect(mockRedis.set).toHaveBeenCalledWith('admob:interstitial:user-1', true, 1800);
      expect(result).toEqual({ allowed: true });
    });
  });

  describe('getSponsoredListings', () => {
    it('should fetch active campaigns and map to listings', async () => {
      const campaigns = [
        {
          id: 'camp-1',
          listing: { id: 'listing-1', title: 'Car 1' },
        },
        {
          id: 'camp-2',
          listing: { id: 'listing-2', title: 'Car 2' },
        },
      ];
      mockPrisma.adCampaign.findMany.mockResolvedValue(campaigns);

      const result = await service.getSponsoredListings(2);

      expect(mockPrisma.adCampaign.findMany).toHaveBeenCalled();
      expect(result).toEqual([
        { id: 'listing-1', title: 'Car 1', campaignId: 'camp-1', isSponsored: true },
        { id: 'listing-2', title: 'Car 2', campaignId: 'camp-2', isSponsored: true },
      ]);
    });
  });

  describe('getAllCampaigns', () => {
    it('should fetch all campaigns', async () => {
      mockPrisma.adCampaign.findMany.mockResolvedValue([{ id: 'camp-1' }]);

      const result = await service.getAllCampaigns();

      expect(mockPrisma.adCampaign.findMany).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'camp-1' }]);
    });
  });
});
