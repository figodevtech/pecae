import { Injectable, ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('seller-stats') private readonly statsQueue: Queue,
  ) {}

  async create(buyerId: string, dto: CreateReviewDto) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Avaliação deve ser entre 1 e 5.');
    }

    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: dto.chatRoomId },
      select: {
        buyerId: true,
        sellerId: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat não encontrado.');
    }

    if (chatRoom.buyerId !== buyerId) {
      throw new ForbiddenException('Você não é o comprador desta negociação.');
    }

    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { id: dto.sellerProfileId },
      select: { userId: true },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Perfil de vendedor não encontrado.');
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          sellerProfileId: dto.sellerProfileId,
          buyerId: buyerId,
          chatRoomId: dto.chatRoomId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      // Disparar job para recálculo de rating
      await this.statsQueue.add('recalc-seller-rating', {
        sellerProfileId: dto.sellerProfileId,
      });

      return review;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Você já avaliou este vendedor para esta negociação.');
      }
      throw error;
    }
  }

  async findAllBySeller(sellerProfileId: string, limit = 10, cursor?: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        sellerProfileId,
        isRemoved: false,
      },
      take: limit + 1, // Fetch one more to determine if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        buyer: {
          select: {
            name: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (reviews.length > limit) {
      const nextItem = reviews.pop();
      nextCursor = nextItem?.id;
    }

    const mappedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      buyerName: this.anonymizeName(review.buyer?.name),
    }));

    return {
      data: mappedReviews,
      meta: {
        nextCursor,
      },
    };
  }

  private anonymizeName(fullName: string): string {
    if (!fullName) return 'Usuário';
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0];
    if (parts.length > 1) {
      const initial = parts[1][0].toUpperCase();
      return `${firstName} ${initial}.`;
    }
    return firstName;
  }
}
