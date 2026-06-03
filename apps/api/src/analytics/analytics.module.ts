import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from './analytics.processor';
import { AnalyticsController } from './analytics.controller';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'analytics-queue',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsProcessor],
  exports: [AnalyticsService, BullModule],
})
export class AnalyticsModule {}
