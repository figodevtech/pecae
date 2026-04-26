import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { Logger } from '@nestjs/common';

@Processor('listings')
export class ListingsProcessor extends WorkerHost {
  private readonly logger = new Logger(ListingsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async process(job: Job<{ listingId: string; ip: string }, any, string>): Promise<any> {
    const { listingId, ip } = job.data;
    
    if (!listingId) {
      this.logger.warn(`Job ${job.id} skipped: listingId is missing.`);
      return;
    }

    const cacheKey = `view:${listingId}:${ip || 'unknown'}`;
    
    try {
      // Check if this IP viewed this listing in the last hour
      const alreadyViewed = await this.redis.get<string>(cacheKey);
      
      if (alreadyViewed) {
        this.logger.debug(`View from IP ${ip} for listing ${listingId} already counted recently.`);
        return;
      }

      // Increment views in database
      await this.prisma.listing.update({
        where: { id: listingId },
        data: { views: { increment: 1 } },
      });

      // Mark as viewed with 1 hour TTL
      await this.redis.set(cacheKey, '1', 3600);
      
      this.logger.log(`View incremented for listing ${listingId} from IP ${ip}`);
    } catch (error) {
      this.logger.error(`Failed to process view increment for listing ${listingId}:`, error);
      throw error; // Let BullMQ retry
    }
  }
}
