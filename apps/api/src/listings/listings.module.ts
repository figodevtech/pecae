import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsProcessor } from './listings.processor';
import { RedisModule } from '../common/redis/redis.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'listings',
    }),
    RedisModule,
    NotificationModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService, ListingsProcessor],
  exports: [ListingsService],
})
export class ListingsModule {}
