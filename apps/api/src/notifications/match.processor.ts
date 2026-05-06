import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

@Processor('alerts')
export class MatchProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { listingId } = job.data;

    if (job.name === 'match-alerts') {
      return this.handleMatchAlerts(listingId);
    }

    return;
  }

  private async handleMatchAlerts(listingId: string) {
    // 1. Buscar detalhes do anúncio publicado
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        vehicle: {
          include: {
            version: {
              include: {
                model: true,
              },
            },
          },
        },
      },
    });

    if (!listing || !listing.vehicle) return;

    const v = listing.vehicle;
    const version = v.version;
    const model = version.model;

    // 2. Buscar buscas salvas que podem dar match
    // Filtramos primeiro por modelo ou marca para reduzir o conjunto de dados
    const savedSearches = await this.prisma.savedSearch.findMany({
      where: {
        alertActive: true,
      },
    });

    for (const search of savedSearches) {
      const filters = search.filters as any;
      if (!filters) continue;

      let isMatch = true;

      // Brand match
      if (filters.brandId && model.brandId !== filters.brandId) isMatch = false;

      // Model match
      if (isMatch && filters.modelId && model.id !== filters.modelId) isMatch = false;

      // Version match
      if (isMatch && filters.versionId && version.id !== filters.versionId) isMatch = false;

      // Year match
      const vehicleYear = v.yearFabId; // Assuming yearFabId is used or we fetch the year value
      // Let's fetch the actual year value
      const yearRecord = await this.prisma.vehicleYear.findUnique({ where: { id: v.yearFabId } });
      const year = yearRecord?.yearFab;

      if (isMatch && year) {
        if (filters.yearMin && year < filters.yearMin) isMatch = false;
        if (filters.yearMax && year > filters.yearMax) isMatch = false;
      }

      // Location match (if provided)
      if (isMatch && filters.state && v.state !== filters.state) isMatch = false;
      if (isMatch && filters.city && v.city !== filters.city) isMatch = false;

      // 3. Se deu match, disparar notificação
      if (isMatch) {
        const title = '🚀 Novo Match na Forja!';
        const body = `Um ${model.name} ${version.name} acaba de ser aprovado e coincide com sua busca salva.`;
        
        await this.notificationService.send({
          userId: search.userId,
          type: 'SAVED_SEARCH_ALERT',
          title,
          body,
          data: {
            listingId: listing.id,
            vehicleId: v.id,
            matchType: 'SAVED_SEARCH',
          },
        });
        
        console.log(`[MatchProcessor] Match encontrado para o usuário ${search.userId} no anúncio ${listing.id}`);
      }
    }
  }
}
