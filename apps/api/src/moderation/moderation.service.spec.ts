import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserType, ListingStatus } from '@prisma/client';
import { CaslAbilityFactory } from '../auth/casl/casl-ability.factory';
import { StorageService } from '../common/storage/storage.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Action } from '../auth/casl/action.enum';

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    listing: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      const tx = {
        listing: mockPrisma.listing,
        auditLog: mockPrisma.auditLog,
      };
      return callback(tx);
    }),
  };

  const mockCaslFactory = {
    createForUser: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockStorageService = {
    getSignedUrl: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('[MOD-U-01] Admin pode suspender listagem (ACTIVE → INACTIVE / REJECTED)', () => {
    it('should update listing status to REJECTED', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerProfile: { userId: 'seller-2' } });

      const abilityMock = { cannot: jest.fn().mockReturnValue(false) };
      mockCaslFactory.createForUser.mockReturnValue(abilityMock);

      const user = { id: 'admin-1', role: 'ADMIN', type: UserType.ADMIN } as any;
      const result = await service.rejectListing('listing-1', { rejectionReason: 'Reason' }, user);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'listing-1' },
          data: expect.objectContaining({ status: 'REJECTED' }),
        })
      );
    });
  });

  describe('[MOD-U-02] Não-admin não pode suspender listagem', () => {
    it('should throw ForbiddenException for non-admins due to CASL restrictions', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerProfile: { userId: 'seller-2' } });

      const abilityMock = { cannot: jest.fn().mockReturnValue(true) };
      mockCaslFactory.createForUser.mockReturnValue(abilityMock);

      const user = { id: 'user-1', type: UserType.BUYER } as any;

      await expect(service.rejectListing('listing-1', { rejectionReason: 'Reason' }, user)).rejects.toThrow(ForbiddenException);
    });
  });
});
