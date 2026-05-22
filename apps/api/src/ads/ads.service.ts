import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from '../common/redis/redis.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { TrackAdDto } from './dto/track-ad.dto';
import { AdCampaignStatus, BudgetType } from '@prisma/client';

export interface SponsoredFilterDto {
  brandId?: string;
  modelId?: string;
  year?: number;
  city?: string;
  state?: string;
  limit?: number;
}

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('ads') private readonly adsQueue: Queue,
  ) {}

  async createCampaign(dto: CreateCampaignDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });

    if (!listing) {
      throw new NotFoundException(`Anúncio com ID ${dto.listingId} não encontrado.`);
    }

    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException('Apenas anúncios publicados podem ser patrocinados.');
    }

    // Verifica se já existe uma campanha ativa para este anúncio
    const existingCampaign = await this.prisma.adCampaign.findFirst({
      where: {
        listingId: dto.listingId,
        status: AdCampaignStatus.ACTIVE,
      },
    });

    if (existingCampaign) {
      throw new BadRequestException('Já existe uma campanha ativa para este anúncio.');
    }

    const campaign = await this.prisma.adCampaign.create({
      data: {
        listingId: dto.listingId,
        budget: dto.budget,
        spent: 0.00,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: AdCampaignStatus.ACTIVE,
        targetBrandId: dto.targetBrandId || null,
        targetModelId: dto.targetModelId || null,
        targetYear: dto.targetYear || null,
        targetCity: dto.targetCity || null,
        targetState: dto.targetState || null,
        maxImpressions: dto.maxImpressions || null,
        budgetType: dto.budgetType || BudgetType.CPC,
        notes: dto.notes || null,
        externalPaymentId: dto.externalPaymentId || null,
      },
    });

    await this.prisma.listing.update({
      where: { id: dto.listingId },
      data: { isSponsoredActive: true },
    });

    // Invalida cache de anúncios sponsored
    await this.invalidateSponsoredCache();

    return campaign;
  }

  async pauseCampaign(id: string) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campanha com ID ${id} não encontrada.`);
    }

    const updated = await this.prisma.adCampaign.update({
      where: { id },
      data: { status: AdCampaignStatus.PAUSED },
    });

    await this.prisma.listing.update({
      where: { id: campaign.listingId },
      data: { isSponsoredActive: false },
    });

    await this.invalidateSponsoredCache();

    return updated;
  }

  async resumeCampaign(id: string) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campanha com ID ${id} não encontrada.`);
    }

    const updated = await this.prisma.adCampaign.update({
      where: { id },
      data: { status: AdCampaignStatus.ACTIVE },
    });

    await this.prisma.listing.update({
      where: { id: campaign.listingId },
      data: { isSponsoredActive: true },
    });

    await this.invalidateSponsoredCache();

    return updated;
  }

  async cancelCampaign(id: string) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campanha com ID ${id} não encontrada.`);
    }

    const updated = await this.prisma.adCampaign.update({
      where: { id },
      data: { status: AdCampaignStatus.CANCELLED },
    });

    await this.prisma.listing.update({
      where: { id: campaign.listingId },
      data: { isSponsoredActive: false },
    });

    await this.invalidateSponsoredCache();

    return updated;
  }

  async trackImpression(dto: TrackAdDto, ip: string) {
    try {
      await this.adsQueue.add(
        'track-impression',
        { ...dto, ip },
        { removeOnComplete: true }
      );
    } catch (error) {
      console.error('Failed to add track-impression job:', error);
    }
    return { success: true };
  }

  async trackClick(dto: TrackAdDto, ip: string) {
    try {
      await this.adsQueue.add(
        'track-click',
        { ...dto, ip },
        { removeOnComplete: true }
      );
    } catch (error) {
      console.error('Failed to add track-click job:', error);
    }
    return { success: true };
  }

  async checkInterstitialCapping(userId: string): Promise<{ allowed: boolean }> {
    const key = `admob:interstitial:${userId}`;
    const exists = await this.redis.get(key);

    if (exists) {
      return { allowed: false };
    }

    // Bloqueia por 1 hora (3600 segundos) de acordo com o capping solicitado
    await this.redis.set(key, true, 3600);
    return { allowed: true };
  }

  async getSponsoredListings(filters: SponsoredFilterDto = {}) {
    const limit = filters.limit || 2;
    const brandId = filters.brandId;
    const modelId = filters.modelId;
    const year = filters.year;
    const city = filters.city;
    const state = filters.state;

    // Chave de cache baseada nos filtros de busca passados
    const cacheKey = `sponsored:cache:${brandId || 'any'}:${modelId || 'any'}:${year || 'any'}:${city || 'any'}:${state || 'any'}:${limit}`;

    try {
      const cached = await this.redis.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.error('Falha ao obter anúncios patrocinados do Redis Cache:', err);
    }

    const now = new Date();

    // Query robusta para buscar campanhas candidatas ativas
    const activeCampaigns = await this.prisma.adCampaign.findMany({
      where: {
        status: AdCampaignStatus.ACTIVE,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ],
        listing: {
          status: 'PUBLISHED',
        },
      },
      include: {
        listing: {
          include: {
            vehicle: {
              include: {
                photos: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
                version: {
                  include: {
                    model: {
                      include: {
                        brand: true,
                      },
                    },
                  },
                },
                yearFab: true,
              },
            },
            sellerProfile: true,
          },
        },
      },
    });

    // Filtra campanhas saudáveis (dentro do budget e impressões máximas) e aplica matching do targeting refinado
    const qualifiedCampaigns = activeCampaigns
      .filter((c) => {
        // Valida se atingiu orçamento
        if (Number(c.spent) >= Number(c.budget)) {
          return false;
        }

        // Valida se atingiu limite máximo de impressões (capping)
        if (c.maxImpressions !== null && c.impressions >= c.maxImpressions) {
          return false;
        }

        // Aplica regras de matching de targeting refinado com fallbacks
        // 1. Marca
        if (c.targetBrandId && c.targetBrandId !== brandId) {
          return false;
        }

        // 2. Modelo
        if (c.targetModelId && c.targetModelId !== modelId) {
          return false;
        }

        // 3. Ano do veículo
        if (c.targetYear && c.targetYear !== year) {
          return false;
        }

        // 4. Estado
        if (c.targetState && state && c.targetState.toUpperCase() !== state.toUpperCase()) {
          return false;
        }

        // 5. Cidade
        if (c.targetCity && city && c.targetCity.toLowerCase() !== city.toLowerCase()) {
          return false;
        }

        return true;
      })
      .map((c) => {
        // Calcula pontuação de match de relevância (score)
        let score = 0;

        if (c.targetModelId && c.targetModelId === modelId) score += 10;
        if (c.targetYear && c.targetYear === year) score += 5;
        if (c.targetBrandId && c.targetBrandId === brandId) score += 3;
        if (c.targetCity && city && c.targetCity.toLowerCase() === city.toLowerCase()) score += 4;
        if (c.targetState && state && c.targetState.toUpperCase() === state.toUpperCase()) score += 2;

        return {
          campaign: c,
          score,
        };
      });

    // Ordenação final: 1º maior pontuação de match (especificidade), 2º menor número de impressões (Pacing Uniforme)
    qualifiedCampaigns.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.campaign.impressions - b.campaign.impressions;
    });

    // Seleciona até o limite e mapeia para retorno estruturado com metadata da campanha
    const result = qualifiedCampaigns.slice(0, limit).map((item) => ({
      ...item.campaign.listing,
      campaignId: item.campaign.id,
      isSponsored: true,
    }));

    try {
      // Salva no cache com TTL de 60 segundos
      await this.redis.set(cacheKey, JSON.stringify(result), 60);
    } catch (err) {
      console.error('Falha ao salvar anúncios patrocinados no Redis Cache:', err);
    }

    return result;
  }

  async getAllCampaigns() {
    return this.prisma.adCampaign.findMany({
      include: {
        listing: {
          include: {
            vehicle: {
              include: {
                photos: true,
                version: {
                  include: {
                    model: {
                      include: {
                        brand: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async expireCampaigns() {
    const now = new Date();

    // Busca campanhas ativas cuja data final passou
    const expiredCampaigns = await this.prisma.adCampaign.findMany({
      where: {
        status: AdCampaignStatus.ACTIVE,
        endDate: { lt: now },
      },
    });

    if (expiredCampaigns.length === 0) {
      return { count: 0 };
    }

    const campaignIds = expiredCampaigns.map((c) => c.id);
    const listingIds = expiredCampaigns.map((c) => c.listingId);

    // Executa expiração atômica em transação
    await this.prisma.$transaction([
      this.prisma.adCampaign.updateMany({
        where: { id: { in: campaignIds } },
        data: { status: AdCampaignStatus.EXPIRED },
      }),
      this.prisma.listing.updateMany({
        where: { id: { in: listingIds } },
        data: { isSponsoredActive: false },
      }),
    ]);

    await this.invalidateSponsoredCache();

    return { count: expiredCampaigns.length };
  }

  private async invalidateSponsoredCache() {
    try {
      await this.redis.delByPrefix('sponsored:cache:');
    } catch (err) {
      console.error('Falha ao invalidar cache de anúncios no Redis:', err);
    }
  }
}
