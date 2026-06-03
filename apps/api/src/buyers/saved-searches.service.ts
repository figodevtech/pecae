import { Injectable, UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private prisma: PrismaService) {}

  async createSavedSearch(userId: string, data: CreateSavedSearchDto) {
    const count = await this.prisma.savedSearch.count({
      where: { userId },
    });

    if (count >= 10) {
      throw new UnprocessableEntityException('Limite de 10 buscas salvas atingido.');
    }

    return this.prisma.savedSearch.create({
      data: {
        userId,
        query: data.query,
        filters: data.filters || {},
        alertActive: data.alertActive ?? false,
      },
    });
  }

  async getSavedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSavedSearch(userId: string, searchId: string) {
    const search = await this.prisma.savedSearch.findFirst({
      where: { id: searchId, userId },
    });

    if (!search) {
      throw new NotFoundException('Busca salva não encontrada');
    }

    return this.prisma.savedSearch.delete({
      where: { id: searchId },
    });
  }

  async toggleAlert(userId: string, searchId: string, alertActive: boolean) {
    const search = await this.prisma.savedSearch.findFirst({
      where: { id: searchId, userId },
    });

    if (!search) {
      throw new NotFoundException('Busca salva não encontrada');
    }

    return this.prisma.savedSearch.update({
      where: { id: searchId },
      data: { alertActive },
    });
  }
}
