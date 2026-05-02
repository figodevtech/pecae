import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('analytics-queue')
export class AnalyticsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'register-view': {
        const { listingId, ipHash } = job.data;

        // Dedup: Verificar se já houve acesso desse IP no anúncio nas últimas 24h
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const existingView = await this.prisma.listingView.findFirst({
          where: {
            listingId,
            ipHash,
            viewedAt: { gte: twentyFourHoursAgo },
          },
        });

        if (existingView) {
          // Ignorado por dedup
          return { status: 'SKIPPED_DEDUP' };
        }

        // Criar registro da visualização
        await this.prisma.listingView.create({
          data: {
            listingId,
            ipHash,
          },
        });

        // Incrementar o contador estático na tabela de anúncios
        await this.prisma.listing.update({
          where: { id: listingId },
          data: {
            views: { increment: 1 },
          },
        });

        return { status: 'RECORDED' };
      }

      case 'recalc-metrics': {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // 1. Bulk aggregate views by period
        const views7dGroups = await this.prisma.listingView.groupBy({
          by: ['listingId'],
          where: { viewedAt: { gte: sevenDaysAgo } },
          _count: { listingId: true },
        });

        const views30dGroups = await this.prisma.listingView.groupBy({
          by: ['listingId'],
          where: { viewedAt: { gte: thirtyDaysAgo } },
          _count: { listingId: true },
        });

        const views90dGroups = await this.prisma.listingView.groupBy({
          by: ['listingId'],
          where: { viewedAt: { gte: ninetyDaysAgo } },
          _count: { listingId: true },
        });

        // Chats initiated (ChatRoom)
        const chatsInitiated30dGroups = await this.prisma.chatRoom.groupBy({
          by: ['listingId'],
          where: {
            createdAt: { gte: thirtyDaysAgo },
            listingId: { not: null }
          },
          _count: { listingId: true },
        });

        const mapViews7d = new Map(views7dGroups.map(g => [g.listingId, g._count.listingId]));
        const mapViews30d = new Map(views30dGroups.map(g => [g.listingId, g._count.listingId]));
        const mapViews90d = new Map(views90dGroups.map(g => [g.listingId, g._count.listingId]));
        const mapChats30d = new Map(chatsInitiated30dGroups.map(g => [g.listingId, g._count.listingId]));

        // Fetch all listings to ensure we upsert stats for everyone
        const listings = await this.prisma.listing.findMany({ select: { id: true } });

        const listingUpsertOps = listings.map(listing => {
          const views7d = mapViews7d.get(listing.id) || 0;
          const views30d = mapViews30d.get(listing.id) || 0;
          const views90d = mapViews90d.get(listing.id) || 0;
          const chatsInitiated30d = mapChats30d.get(listing.id) || 0;

          const conversionRate = views30d > 0 ? (chatsInitiated30d / views30d) * 100 : 0;

          return this.prisma.listingStats.upsert({
            where: { listingId: listing.id },
            create: {
              listingId: listing.id,
              views7d,
              views30d,
              views90d,
              chatsInitiated30d,
              conversionRate,
              calculatedAt: now,
            },
            update: {
              views7d,
              views30d,
              views90d,
              chatsInitiated30d,
              conversionRate,
              calculatedAt: now,
            },
          });
        });

        // Batch upserts to avoid overloading memory/db in a single transaction
        const chunkSize = 500;
        for (let i = 0; i < listingUpsertOps.length; i += chunkSize) {
          await this.prisma.$transaction(listingUpsertOps.slice(i, i + chunkSize));
        }

        // 2. Consolidate SellerStats
        const sellers = await this.prisma.sellerProfile.findMany();

        // Prepare operations chunk by chunk to avoid memory issues
        for (let i = 0; i < sellers.length; i += chunkSize) {
          const sellersChunk = sellers.slice(i, i + chunkSize);
          const sellerUpsertOps = [];

          for (const seller of sellersChunk) {
            // Total de chats iniciados para todos os anúncios do vendedor
            const sellerListings = await this.prisma.listing.findMany({
              where: { sellerProfileId: seller.id },
              select: { id: true },
            });

            const listingIds = sellerListings.map(l => l.id);

            const totalChatsInitiated = await this.prisma.chatRoom.count({
              where: {
                listingId: { in: listingIds },
              },
            });

            sellerUpsertOps.push(this.prisma.sellerStats.upsert({
              where: { sellerProfileId: seller.id },
              create: {
                sellerProfileId: seller.id,
                totalChatsInitiated,
              },
              update: {
                totalChatsInitiated,
              },
            }));
          }

          if (sellerUpsertOps.length > 0) {
            await this.prisma.$transaction(sellerUpsertOps);
          }
        }

        return { status: 'RECALCULATED' };
      }

      default:
        console.warn(`Job desconhecido na fila analytics: ${job.name}`);
    }
  }
}
