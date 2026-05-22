import { Test, TestingModule } from '@nestjs/testing';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';
import { CaslAbilityFactory } from '../auth/casl/casl-ability.factory';

describe('ModerationController', () => {
  let controller: ModerationController;
  let service: ModerationService;

  const mockModerationService = {
    findAllPendingListings: jest.fn(),
    findOneListing: jest.fn(),
    approveListing: jest.fn(),
    rejectListing: jest.fn(),
    findAllPendingVerifications: jest.fn(),
    approveVerification: jest.fn(),
    rejectVerification: jest.fn(),
  };

  const mockPrisma = {};
  const mockCaslFactory = { createForUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModerationController],
      providers: [
        { provide: ModerationService, useValue: mockModerationService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CaslAbilityFactory, useValue: mockCaslFactory },
      ],
    }).compile();

    controller = module.get<ModerationController>(ModerationController);
    service = module.get<ModerationService>(ModerationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Listings', () => {
    it('findAllListings should call service', async () => {
      mockModerationService.findAllPendingListings.mockResolvedValue({ items: [] });
      await controller.findAllListings({});
      expect(service.findAllPendingListings).toHaveBeenCalledWith({});
    });

    it('approveListing should pass user to service', async () => {
      mockModerationService.approveListing.mockResolvedValue({ message: 'OK' });
      await controller.approveListing('L1', { moderatorNote: 'OK' }, { user: { id: 'admin1' } });
      expect(service.approveListing).toHaveBeenCalledWith('L1', { moderatorNote: 'OK' }, { id: 'admin1' });
    });
  });

  describe('Verifications', () => {
    it('approveVerification should pass user to service', async () => {
      mockModerationService.approveVerification.mockResolvedValue({ id: 'V1' });
      await controller.approveVerification('V1', { user: { id: 'admin1' } });
      expect(service.approveVerification).toHaveBeenCalledWith('V1', { id: 'admin1' });
    });
  });
});
