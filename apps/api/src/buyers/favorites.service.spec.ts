import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  listing: {
    findUnique: jest.fn(),
  },
  favorite: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    jest.clearAllMocks();
  });

  describe('toggleFavorite', () => {
    it('deve adicionar favorito quando não existir', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1' });
      mockPrisma.favorite.findUnique.mockResolvedValue(null);
      mockPrisma.favorite.create.mockResolvedValue({ id: 'fav-1' });

      const result = await service.toggleFavorite('user-1', 'listing-1');

      expect(result).toEqual({ favorited: true });
      expect(mockPrisma.favorite.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: 'user-1', listingId: 'listing-1' },
        }),
      );
    });

    it('deve remover favorito quando já existir (idempotência)', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1' });
      mockPrisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' });
      mockPrisma.favorite.delete.mockResolvedValue({ id: 'fav-1' });

      const result = await service.toggleFavorite('user-1', 'listing-1');

      expect(result).toEqual({ favorited: false });
      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'fav-1' } }),
      );
      expect(mockPrisma.favorite.create).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando o anúncio não existir', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleFavorite('user-1', 'listing-inexistente'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.favorite.create).not.toHaveBeenCalled();
    });
  });

  describe('getFavorites', () => {
    it('deve retornar a lista de favoritos com vehicle e sellerProfile incluídos', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          listing: {
            id: 'listing-1',
            title: 'Motor 1.0',
            sellerProfile: { storeName: 'Desmanche Alpha' },
            vehicle: { city: 'São Paulo', state: 'SP', version: null },
          },
        },
      ];
      mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites);

      const result = await service.getFavorites('user-1');

      expect(result).toEqual(mockFavorites);
      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          include: expect.objectContaining({
            listing: expect.objectContaining({
              include: expect.objectContaining({ vehicle: expect.anything() }),
            }),
          }),
        }),
      );
    });

    it('deve retornar lista vazia quando usuário não tiver favoritos', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([]);

      const result = await service.getFavorites('user-1');

      expect(result).toEqual([]);
    });
  });
});
