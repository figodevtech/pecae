import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    chatRoom: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    vehicle: {
      findUnique: jest.fn(),
    },
    listing: {
      findUnique: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    chatRead: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('[CHAT-U-01] Criação de ChatRoom vincula vehicleId corretamente', () => {
    it('should create a room with buyerId, sellerId, and vehicleId', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1', seller: { userId: 'seller-1' } });
      mockPrisma.chatRoom.findFirst.mockResolvedValue(null);
      mockPrisma.chatRoom.create.mockImplementation((args: any) => {
        return { id: 'room-1', ...args.data };
      });

      const result = await service.getOrCreateRoom('buyer-1', { vehicleId: 'vehicle-1' });

      expect(mockPrisma.chatRoom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            buyerId: 'buyer-1',
            sellerId: 'seller-1',
            listingId: null,
            vehicleId: 'vehicle-1',
          },
        })
      );
      expect(result.vehicleId).toBe('vehicle-1');
      expect(result.buyerId).toBe('buyer-1');
      expect(result.sellerId).toBe('seller-1');
    });
  });

  describe('[CHAT-U-02] Usuário não-participante não pode ler mensagens', () => {
    it('should throw ForbiddenException if user is not buyer or seller', async () => {
      mockPrisma.chatRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        buyerId: 'user-A',
        sellerId: 'user-B',
      });

      await expect(service.findMessages('room-1', 'user-C')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('[CHAT-U-03] Não duplica ChatRoom para mesmo vehicleId + buyerId', () => {
    it('should return existing room and not create a new one', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1', seller: { userId: 'seller-1' } });
      mockPrisma.chatRoom.findFirst.mockResolvedValue({ id: 'existing-room' });

      const result = await service.getOrCreateRoom('buyer-1', { vehicleId: 'vehicle-1' });

      expect(mockPrisma.chatRoom.create).not.toHaveBeenCalled();
      expect(result.id).toBe('existing-room');
    });
  });

  describe('[CHAT-U-04] Apenas participantes podem enviar mensagens', () => {
    it('should throw ForbiddenException when non-participant tries to send message', async () => {
      mockPrisma.chatRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        buyerId: 'user-A',
        sellerId: 'user-B',
      });

      await expect(service.sendMessage('room-1', 'user-C', 'Hello')).rejects.toThrow(ForbiddenException);
    });
  });
});
