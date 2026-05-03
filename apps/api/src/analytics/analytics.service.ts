import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class AnalyticsService {
  private readonly hashSalt: string;

  constructor(
    @InjectQueue("analytics-queue") private readonly analyticsQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.hashSalt = this.configService.get<string>(
      "ANALYTICS_HASH_SALT",
      "pecae_local_hash_fallback_salt",
    );
  }

  /**
   * Envia uma tarefa em background para registrar uma visualização de anúncio com dedup.
   */
  async registerView(listingId: string, clientIp: string): Promise<void> {
    const cleanIp = clientIp || "127.0.0.1";

    // Hash do IP com Salt
    const ipHash = crypto
      .createHmac("sha256", this.hashSalt)
      .update(cleanIp)
      .digest("hex");

    await this.analyticsQueue.add("register-view", {
      listingId,
      ipHash,
    });
  }

  /**
   * Coleta métricas de um vendedor para o dashboard mobile.
   */
  async getSellerAnalytics(userId: string, periodDays: number = 30) {
    // 1. Encontrar Perfil do Vendedor
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException("Perfil de vendedor não encontrado.");
    }

    const now = new Date();
    const startDate = new Date(
      now.getTime() - periodDays * 24 * 60 * 60 * 1000,
    );

    // 2. Coletar Anúncios do Vendedor
    const listings = await this.prisma.listing.findMany({
      where: { sellerProfileId: seller.id },
      select: { id: true, title: true, status: true, views: true },
    });

    const listingIds = listings.map((l) => l.id);

    // 3. Agregar Visualizações Diárias
    const views = await this.prisma.listingView.findMany({
      where: {
        listingId: { in: listingIds },
        viewedAt: { gte: startDate },
      },
      select: { viewedAt: true },
    });

    const viewsTimelineMap: Record<string, number> = {};

    // Inicializar o mapa com 0 para todos os dias do período
    for (let i = periodDays; i >= 0; i--) {
      const dateStr = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      viewsTimelineMap[dateStr] = 0;
    }

    views.forEach((v) => {
      const dateStr = v.viewedAt.toISOString().split("T")[0];
      if (viewsTimelineMap[dateStr] !== undefined) {
        viewsTimelineMap[dateStr]++;
      }
    });

    const viewsTimeline = Object.entries(viewsTimelineMap)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Métricas Gerais Consolidadas
    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
    const activeListings = listings.filter(
      (l) => l.status === "PUBLISHED",
    ).length;

    // Engajamento (Chats abertos)
    const totalChats = await this.prisma.chatRoom.count({
      where: {
        listingId: { in: listingIds },
        createdAt: { gte: startDate },
      },
    });

    // Anúncios com melhor performance (Top 5 por views)
    const topListings = [...listings]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        title: l.title,
        views: l.views,
      }));

    return {
      summary: {
        totalViews,
        activeListings,
        totalChats,
        periodDays,
      },
      viewsTimeline,
      topListings,
    };
  }

  /**
   * Coleta métricas para o Dashboard do Administrador Geral.
   */
  async getAdminAnalytics() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      dau,
      totalUsers,
      newUsers24h,
      listingStatusAggregation,
      pendingListings,
      pendingVerifications,
    ] = await Promise.all([
      // DAU (Daily Active Users): Autenticados ou que realizaram ações em 24h
      this.prisma.user.count({
        where: {
          lastActiveAt: { gte: twentyFourHoursAgo },
        },
      }),

      // Total de usuários cadastrados
      this.prisma.user.count(),

      // Novas contas criadas nas últimas 24h
      this.prisma.user.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),

      // Total de anúncios por estado
      this.prisma.listing.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      // Total de itens aguardando moderação (anúncios pendentes e verificações)
      this.prisma.listing.count({
        where: { status: "PENDING" },
      }),

      this.prisma.sellerVerification.count({
        where: { status: "PENDING" },
      }),
    ]);

    const listingsByStatus = listingStatusAggregation.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );

    const pendingModerations = pendingListings + pendingVerifications;

    return {
      dau,
      totalUsers,
      newUsers24h,
      listingsByStatus,
      pendingModerations,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Dispara o cálculo imediato de estatísticas (para testes ou atualização sob demanda)
   */
  async triggerRecalc(): Promise<{ message: string }> {
    await this.analyticsQueue.add("recalc-metrics", {});
    return { message: "Recálculo de métricas agendado com sucesso!" };
  }
}
