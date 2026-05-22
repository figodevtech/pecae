import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { CaslAbilityFactory } from '../auth/casl/casl-ability.factory';
import { StorageService } from '../common/storage/storage.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: PrismaService;
  let caslFactory: CaslAbilityFactory;
  let queue: any;

  const mockPrisma: any = {
    listing: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    sellerVerification: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    sellerProfile: {
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      return callback(mockPrisma);
    }),
  };

  const mockCaslFactory = {
    createForUser: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockStorageService = {
    getSignedUrls: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CaslAbilityFactory, useValue: mockCaslFactory },
        { provide: getQueueToken('alerts'), useValue: mockQueue },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    prisma = module.get<PrismaService>(PrismaService);
    caslFactory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
    queue = module.get(getQueueToken('alerts'));
    jest.clearAllMocks();
  });

  describe('[MOD-U-01] approveListing updates status and queues notification', () => {
    it('should update listing, create audit log, and queue match-alerts', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerProfile: { userId: 'seller-2' } });

      const abilityMock = { cannot: jest.fn().mockReturnValue(false) };
      mockCaslFactory.createForUser.mockReturnValue(abilityMock);

      const user = { id: 'admin-1', type: 'ADMIN' } as any;
      
      await service.approveListing('listing-1', { moderatorNote: 'OK' }, user);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'listing-1' },
          data: expect.objectContaining({ status: 'PUBLISHED' }),
        })
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'APPROVE', entity: 'Listing' }),
        })
      );
      expect(queue.add).toHaveBeenCalledWith('match-alerts', { listingId: 'listing-1' }, { removeOnComplete: true });
    });
  });

  describe('[MOD-U-02] rejectListing updates status', () => {
    it('should update listing status to REJECTED and create audit log', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerProfile: { userId: 'seller-2' } });

      const abilityMock = { cannot: jest.fn().mockReturnValue(false) };
      mockCaslFactory.createForUser.mockReturnValue(abilityMock);

      const user = { id: 'admin-1', type: 'ADMIN' } as any;
      await service.rejectListing('listing-1', { rejectionReason: 'Reason' }, user);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'listing-1' },
          data: expect.objectContaining({ status: 'REJECTED' }),
        })
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'REJECT' }),
        })
      );
    });
  });

  describe('[MOD-U-03] approveVerification transaction', () => {
    it('should update verification to APPROVED, update sellerProfile, and queue notification', async () => {
      mockPrisma.sellerVerification.findUnique.mockResolvedValue({
        id: 'ver-1',
        status: 'PENDING',
        sellerProfileId: 'profile-1',
        sellerProfile: { userId: 'seller-2' },
      });

      const user = { id: 'admin-1', type: 'ADMIN' } as any;
      await service.approveVerification('ver-1', user);

      expect(mockPrisma.sellerVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ver-1' },
          data: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
      expect(mockPrisma.sellerProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'profile-1' },
          data: { isVerified: true },
        })
      );
      expect(queue.add).toHaveBeenCalledWith('send-notification', expect.objectContaining({
        type: 'SELLER_VERIFIED',
      }));
    });

    it('should throw ForbiddenException if user tries to moderate their own verification', async () => {
      mockPrisma.sellerVerification.findUnique.mockResolvedValue({
        id: 'ver-1',
        status: 'PENDING',
        sellerProfileId: 'profile-1',
        sellerProfile: { userId: 'admin-1' }, // Same ID
      });

      const user = { id: 'admin-1', type: 'ADMIN' } as any;
      await expect(service.approveVerification('ver-1', user)).rejects.toThrow(ForbiddenException);
    });
  });
});
