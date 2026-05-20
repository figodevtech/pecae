import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggleFavorite(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false };
    } else {
      await this.prisma.favorite.create({
        data: {
          userId,
          listingId,
        },
      });
      return { favorited: true };
    }
  }

  async getFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            sellerProfile: {
              select: { storeName: true, city: true, state: true },
            },
            vehicle: {
              select: {
                city: true,
                state: true,
                version: {
                  select: {
                    name: true,
                    model: {
                      select: {
                        name: true,
                        brand: { select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
