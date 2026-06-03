import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from './dto/saved-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavedSearchDto) {
    return this.prisma.savedSearch.create({
      data: {
        userId,
        query: dto.query,
        filters: dto.filters,
        alertActive: dto.alertActive ?? false,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!savedSearch || savedSearch.userId !== userId) {
      throw new NotFoundException('Busca salva não encontrada');
    }

    return savedSearch;
  }

  async update(id: string, userId: string, dto: UpdateSavedSearchDto) {
    await this.findOne(id, userId);

    return this.prisma.savedSearch.update({
      where: { id },
      data: {
        query: dto.query,
        filters: dto.filters,
        alertActive: dto.alertActive,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.savedSearch.delete({
      where: { id },
    });
  }
}
