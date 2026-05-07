import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('seller-stats')
export class SellerStatsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ sellerProfileId: string }>): Promise<any> {
    const { sellerProfileId } = job.data;

    // 1. Recalcular Médias de Avaliação
    const aggregate = await this.prisma.review.aggregate({
      where: {
        sellerProfileId,
        isRemoved: false,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    // 2. Recalcular Tempo Médio de Resposta
    // Consideramos apenas as primeiras interações de cada chat para medir a prontidão
    const chatRooms = await this.prisma.chatRoom.findMany({
      where: { sellerId: (await this.prisma.sellerProfile.findUnique({ where: { id: sellerProfileId }, select: { userId: true } })).userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 5, // Pegamos as primeiras mensagens para encontrar o par pergunta/resposta
        },
      },
    });

    let totalResponseTime = 0;
    let countedRooms = 0;

    for (const room of chatRooms) {
      const firstBuyerMsg = room.messages.find(m => m.senderId === room.buyerId);
      if (!firstBuyerMsg) continue;

      const firstSellerMsg = room.messages.find(m => m.senderId === room.sellerId && m.createdAt > firstBuyerMsg.createdAt);
      if (!firstSellerMsg) continue;

      const diffMinutes = Math.floor((firstSellerMsg.createdAt.getTime() - firstBuyerMsg.createdAt.getTime()) / 60000);
      totalResponseTime += diffMinutes;
      countedRooms++;
    }

    const avgResponseTimeMinutes = countedRooms > 0 ? Math.floor(totalResponseTime / countedRooms) : null;

    // 3. Recalcular Contagens de Anúncios
    const [activeListings, totalSold, totalListings] = await Promise.all([
      this.prisma.listing.count({
        where: { sellerProfileId, status: 'PUBLISHED' },
      }),
      this.prisma.listing.count({
        where: { sellerProfileId, status: 'SOLD' },
      }),
      this.prisma.listing.count({
        where: { sellerProfileId },
      }),
    ]);

    // 3. Atualizar SellerStats
    const updatedStats = await this.prisma.sellerStats.update({
      where: { sellerProfileId },
      data: {
        rating: aggregate._avg.rating || null,
        totalReviews: aggregate._count.id || 0,
        activeListings,
        totalSold,
        totalListings,
        avgResponseTimeMinutes,
      },
    });

    // 4. Lógica de Atribuição Automática de Selos (Badges)
    const badges: string[] = [];
    const rating = aggregate._avg.rating || 0;
    const totalReviews = aggregate._count.id || 0;

    // Selo: Vendedor Ouro (Rating >= 4.5 e pelo menos 5 avaliações)
    if (rating >= 4.5 && totalReviews >= 5) {
      badges.push('TOP_SELLER');
    }

    // Selo: Especialista (Mais de 10 vendas concluídas)
    if (totalSold >= 10) {
      badges.push('SPECIALIST');
    }

    // Selo: Resposta Rápida (Média de resposta inferior a 30 minutos)
    if (updatedStats.avgResponseTimeMinutes && updatedStats.avgResponseTimeMinutes <= 30) {
      badges.push('FAST_RESPONDER');
    }

    // 5. Atualizar Perfil do Vendedor com os novos selos
    await this.prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: { badges },
    });

    return {
      sellerProfileId,
      rating: aggregate._avg.rating,
      totalReviews: aggregate._count.id,
      activeListings,
      totalSold,
      badges,
      status: 'recalculated_and_badged',
    };
  }

}

