import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { AdsProcessor } from './ads.processor';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ads',
    }),
    RedisModule,
  ],
  controllers: [AdsController],
  providers: [AdsService, AdsProcessor],
  exports: [AdsService],
})
export class AdsModule {}
