import { Test, TestingModule } from '@nestjs/testing';
import { SavedSearchesService } from './saved-searches.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnprocessableEntityException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  savedSearch: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

describe('SavedSearchesService', () => {
  let service: SavedSearchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedSearchesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SavedSearchesService>(SavedSearchesService);
    jest.clearAllMocks();
  });

  describe('createSavedSearch', () => {
    const dto = { query: 'motor 1.0 corsa', filters: { state: 'SP' }, alertActive: true };

    it('deve criar uma busca salva com sucesso', async () => {
      mockPrisma.savedSearch.count.mockResolvedValue(3); // abaixo do limite
      mockPrisma.savedSearch.create.mockResolvedValue({ id: 'ss-1', ...dto, userId: 'user-1' });

      const result = await service.createSavedSearch('user-1', dto);

      expect(result).toHaveProperty('id', 'ss-1');
      expect(mockPrisma.savedSearch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', query: dto.query }),
        }),
      );
    });

    it('deve lançar UnprocessableEntityException quando atingir limite de 10 buscas (RN-M02-03)', async () => {
      mockPrisma.savedSearch.count.mockResolvedValue(10); // limite atingido

      await expect(service.createSavedSearch('user-1', dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(mockPrisma.savedSearch.create).not.toHaveBeenCalled();
    });

    it('deve criar busca com alertActive false quando não informado', async () => {
      mockPrisma.savedSearch.count.mockResolvedValue(0);
      mockPrisma.savedSearch.create.mockResolvedValue({ id: 'ss-2' });

      await service.createSavedSearch('user-1', { query: 'câmbio automático' });

      expect(mockPrisma.savedSearch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ alertActive: false }),
        }),
      );
    });
  });

  describe('getSavedSearches', () => {
    it('deve retornar todas as buscas salvas do usuário ordenadas por data', async () => {
      const mockSearches = [
        { id: 'ss-1', query: 'motor 1.0', createdAt: new Date() },
        { id: 'ss-2', query: 'câmbio', createdAt: new Date() },
      ];
      mockPrisma.savedSearch.findMany.mockResolvedValue(mockSearches);

      const result = await service.getSavedSearches('user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.savedSearch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('deve retornar lista vazia quando não houver buscas', async () => {
      mockPrisma.savedSearch.findMany.mockResolvedValue([]);

      const result = await service.getSavedSearches('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('deleteSavedSearch', () => {
    it('deve excluir a busca salva com sucesso', async () => {
      mockPrisma.savedSearch.findFirst.mockResolvedValue({ id: 'ss-1', userId: 'user-1' });
      mockPrisma.savedSearch.delete.mockResolvedValue({ id: 'ss-1' });

      await service.deleteSavedSearch('user-1', 'ss-1');

      expect(mockPrisma.savedSearch.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ss-1' } }),
      );
    });

    it('deve lançar NotFoundException quando busca não existir ou não pertencer ao usuário', async () => {
      mockPrisma.savedSearch.findFirst.mockResolvedValue(null);

      await expect(service.deleteSavedSearch('user-1', 'ss-outro')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.savedSearch.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleAlert', () => {
    it('deve ativar o alerta da busca salva', async () => {
      mockPrisma.savedSearch.findFirst.mockResolvedValue({ id: 'ss-1', userId: 'user-1', alertActive: false });
      mockPrisma.savedSearch.update.mockResolvedValue({ id: 'ss-1', alertActive: true });

      const result = await service.toggleAlert('user-1', 'ss-1', true);

      expect(result.alertActive).toBe(true);
      expect(mockPrisma.savedSearch.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { alertActive: true } }),
      );
    });

    it('deve desativar o alerta da busca salva', async () => {
      mockPrisma.savedSearch.findFirst.mockResolvedValue({ id: 'ss-1', userId: 'user-1', alertActive: true });
      mockPrisma.savedSearch.update.mockResolvedValue({ id: 'ss-1', alertActive: false });

      const result = await service.toggleAlert('user-1', 'ss-1', false);

      expect(result.alertActive).toBe(false);
    });

    it('deve lançar NotFoundException quando busca não existir', async () => {
      mockPrisma.savedSearch.findFirst.mockResolvedValue(null);

      await expect(service.toggleAlert('user-1', 'ss-inexistente', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
