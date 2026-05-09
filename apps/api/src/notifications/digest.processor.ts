import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

@Processor('alerts')
export class DigestProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'daily-digest') {
      return this.handleDailyDigest();
    }
    return;
  }

  private async handleDailyDigest() {
    console.log('[DigestProcessor] Iniciando processamento do Digest Diário...');

    // 1. Buscar anúncios publicados nas últimas 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newListings = await this.prisma.listing.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: yesterday },
      },
      include: {
        vehicle: {
          include: {
            version: {
              include: {
                model: true,
              },
            },
            yearFab: true,
          },
        },
      },
    });

    if (newListings.length === 0) {
      console.log('[DigestProcessor] Nenhum anúncio novo nas últimas 24h. Digest cancelado.');
      return;
    }

    // 2. Buscar todas as buscas salvas ativas
    const savedSearches = await this.prisma.savedSearch.findMany({
      where: { alertActive: true },
    });

    // Agrupar matches por usuário para enviar uma única notificação consolidada
    const userMatches = new Map<string, string[]>();

    for (const search of savedSearches) {
      const filters = search.filters as any;
      if (!filters) continue;

      for (const listing of newListings) {
        const v = listing.vehicle;
        const version = v.version;
        const model = version.model;

        let isMatch = true;

        if (filters.brandId && model.brandId !== filters.brandId) isMatch = false;
        if (isMatch && filters.modelId && model.id !== filters.modelId) isMatch = false;
        if (isMatch && filters.versionId && version.id !== filters.versionId) isMatch = false;

        // Simplificando o match de ano para o digest
        if (isMatch && (filters.yearMin || filters.yearMax)) {
          const year = v.yearFab?.yearFab;
          if (year) {
            if (filters.yearMin && year < filters.yearMin) isMatch = false;
            if (filters.yearMax && year > filters.yearMax) isMatch = false;
          }
        }

        if (isMatch) {
          const listingTitle = `${model.name} ${version.name} (${v.yearFabId})`;
          const matches = userMatches.get(search.userId) || [];
          if (!matches.includes(listingTitle)) {
            matches.push(listingTitle);
            userMatches.set(search.userId, matches);
          }
        }
      }
    }

    // 3. Enviar notificações consolidadas
    const notifications = Array.from(userMatches.entries()).map(([userId, matches]) => {
      const count = matches.length;
      const title = `🔥 ${count} novos veículos para você!`;
      const body = `Encontramos ${count} anúncios que combinam com suas buscas salvas nas últimas 24h. Confira agora!`;

      return {
        userId,
        type: 'SAVED_SEARCH_ALERT' as const,
        title,
        body,
        data: {
          matchCount: count,
          matches: matches.slice(0, 3), // Enviar os 3 primeiros nomes como exemplo
          digestType: 'DAILY',
        },
      };
    });

    if (notifications.length > 0) {
      await this.notificationService.sendBatch(notifications);
      console.log(`[DigestProcessor] ${notifications.length} digests enviados em lote.`);
    }

    console.log('[DigestProcessor] Digest Diário concluído.');
  }
}
