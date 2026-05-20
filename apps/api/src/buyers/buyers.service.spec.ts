import { Test, TestingModule } from '@nestjs/testing';
import { BuyersService } from './buyers.service';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';

// Mock do Prisma
const mockPrisma: any = {
  $transaction: jest.fn((cb) => cb(mockPrisma)),
  buyerProfile: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  chatRoom: {
    findMany: jest.fn(),
  },
  refreshToken: {
    updateMany: jest.fn(),
  },
};

// Mock da Queue do BullMQ
const mockQueue = {
  add: jest.fn(),
};

describe('BuyersService', () => {
  let service: BuyersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('user-management'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<BuyersService>(BuyersService);
    jest.clearAllMocks();
  });

  describe('getMyProfile', () => {
    it('deve retornar o perfil do comprador quando existir', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'comprador@test.com',
        name: 'João',
        buyerProfile: { id: 'bp-1', avatar: null },
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMyProfile('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });

    it('deve lançar NotFoundException quando usuário não existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('user-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMyProfile', () => {
    it('deve atualizar o perfil do comprador com os campos enviados', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'comprador@test.com',
        name: 'João Atualizado',
        buyerProfile: { id: 'bp-1', avatar: 'https://cdn.example.com/avatar.jpg' },
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.updateMyProfile('user-1', {
        name: 'João Atualizado',
        avatar: 'https://cdn.example.com/avatar.jpg',
      });

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });
  });

  describe('deleteAccount', () => {
    it('deve marcar conta como pendente de exclusão e agendar job de anonimização', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'comprador@test.com',
        status: 'ACTIVE',
        deletedAt: null,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        status: 'DELETED',
        deletedAt: new Date(),
      });
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.deleteAccount('user-1', { currentPassword: 'password123' });

      // Deve agendar o job de anonimização no BullMQ com delay de 30 dias
      expect(mockQueue.add).toHaveBeenCalledWith(
        'anonymize-user',
        expect.objectContaining({ userId: 'user-1' }),
        expect.objectContaining({ delay: expect.any(Number) }),
      );
    });

    it('deve lançar UnauthorizedException se conta já estiver marcada para exclusão', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'comprador@test.com',
        status: 'DELETED',
        deletedAt: new Date(), // já marcado
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.deleteAccount('user-1', { currentPassword: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getNegotiations', () => {
    it('deve retornar os chat rooms do comprador como negociações', async () => {
      const mockChats = [
        {
          id: 'room-1',
          listing: { title: 'Sucata Motor' },
          seller: { storeName: 'Desmanche X' },
          messages: [],
          updatedAt: new Date(),
        },
      ];
      mockPrisma.chatRoom.findMany.mockResolvedValue(mockChats);

      const result = await service.getNegotiations('user-1');

      expect(result).toEqual([
        {
          id: 'room-1',
          vehicle: null,
          listing: {
            id: undefined,
            title: 'Sucata Motor',
            status: undefined,
          },
          seller: null,
          lastInteraction: mockChats[0].updatedAt,
          lastMessage: null,
        },
      ]);
      expect(mockPrisma.chatRoom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { buyerId: 'user-1' } }),
      );
    });

    it('deve retornar lista vazia quando comprador não tiver negociações', async () => {
      mockPrisma.chatRoom.findMany.mockResolvedValue([]);

      const result = await service.getNegotiations('user-1');

      expect(result).toEqual([]);
    });
  });
});

