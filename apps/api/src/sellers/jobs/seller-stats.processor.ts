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

    // 1. Calculate active listings (PUBLISHED)
    const activeListings = await this.prisma.listing.count({
      where: {
        sellerProfileId,
        status: 'PUBLISHED',
      },
    });

    // 2. Calculate total sold listings (SOLD)
    const totalSold = await this.prisma.listing.count({
      where: {
        sellerProfileId,
        status: 'SOLD',
      },
    });

    // 3. Calculate total listings
    const totalListings = await this.prisma.listing.count({
      where: {
        sellerProfileId,
      },
    });

    // 4. Update the seller stats
    await this.prisma.sellerStats.update({
      where: { sellerProfileId },
      data: {
        activeListings,
        totalSold,
        totalListings,
      },
    });

    return {
      sellerProfileId,
      activeListings,
      totalSold,
      totalListings,
      status: 'updated',
    };
  }
}

