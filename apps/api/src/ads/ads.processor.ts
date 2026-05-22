import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Processor('ads')
export class AdsProcessor extends WorkerHost {
  private readonly logger = new Logger(AdsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { campaignId, listingId, ip } = job.data;

    switch (job.name) {
      case 'track-impression':
        return this.handleImpression(campaignId, listingId, ip);
      case 'track-click':
        return this.handleClick(campaignId, listingId, ip);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  private async handleImpression(campaignId: string, listingId: string, ip: string) {
    const ipHash = this.hashIp(ip || '127.0.0.1');
    const key = `ad:imp:${campaignId}:${ipHash}`;
    const exists = await this.redis.get(key);

    if (exists) {
      this.logger.log(`Duplicate impression ignored for campaign ${campaignId} and IP ${ip}`);
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.adImpression.create({
          data: {
            campaignId,
            listingId,
            ipHash,
          },
        });

        const campaign = await tx.adCampaign.findUnique({
          where: { id: campaignId },
        });

        if (!campaign) return;

        let spentIncrement = 0;
        if (campaign.budgetType === 'CPM') {
          spentIncrement = 0.005; // Equivalente a R$ 5,00 por CPM (1000 impressões)
        }

        const newImpressions = campaign.impressions + 1;
        const newSpent = Number(campaign.spent) + spentIncrement;

        let status = campaign.status;
        let isSponsoredActive = true;

        if (
          (campaign.maxImpressions !== null && newImpressions >= campaign.maxImpressions) ||
          newSpent >= Number(campaign.budget)
        ) {
          status = 'EXPIRED';
          isSponsoredActive = false;
        }

        await tx.adCampaign.update({
          where: { id: campaignId },
          data: {
            impressions: { increment: 1 },
            spent: { increment: spentIncrement },
            status,
          },
        });

        if (!isSponsoredActive) {
          await tx.listing.update({
            where: { id: listingId },
            data: { isSponsoredActive: false },
          });
          
          // Invalida cache de anúncios patrocinados
          await this.redis.delByPrefix('sponsored:cache:');
        }
      });

      // Set TTL of 1 hour (3600 seconds)
      await this.redis.set(key, true, 3600);
      this.logger.log(`Impression tracked for campaign ${campaignId}`);
    } catch (error) {
      this.logger.error(`Failed to track impression for campaign ${campaignId}`, error);
    }
  }

  private async handleClick(campaignId: string, listingId: string, ip: string) {
    const ipHash = this.hashIp(ip || '127.0.0.1');
    const key = `ad:clk:${campaignId}:${ipHash}`;
    const exists = await this.redis.get(key);

    if (exists) {
      this.logger.log(`Duplicate click ignored for campaign ${campaignId} and IP ${ip}`);
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.adClick.create({
          data: {
            campaignId,
            listingId,
            ipHash,
          },
        });

        const campaign = await tx.adCampaign.findUnique({
          where: { id: campaignId },
        });

        if (!campaign) return;

        let spentIncrement = 0;
        if (campaign.budgetType === 'CPC') {
          spentIncrement = 0.50; // R$ 0,50 por clique
        }

        const newSpent = Number(campaign.spent) + spentIncrement;

        let status = campaign.status;
        let isSponsoredActive = true;

        if (newSpent >= Number(campaign.budget)) {
          status = 'EXPIRED';
          isSponsoredActive = false;
        }

        await tx.adCampaign.update({
          where: { id: campaignId },
          data: {
            clicks: { increment: 1 },
            spent: { increment: spentIncrement },
            status,
          },
        });

        if (!isSponsoredActive) {
          await tx.listing.update({
            where: { id: listingId },
            data: { isSponsoredActive: false },
          });

          // Invalida cache de anúncios patrocinados
          await this.redis.delByPrefix('sponsored:cache:');
        }
      });

      // Set TTL of 24 hours (86400 seconds)
      await this.redis.set(key, true, 86400);
      this.logger.log(`Click tracked for campaign ${campaignId}`);
    } catch (error) {
      this.logger.error(`Failed to track click for campaign ${campaignId}`, error);
    }
  }
}
