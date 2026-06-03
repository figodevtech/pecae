import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { SellerStatsProcessor } from './jobs/seller-stats.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'seller-stats',
    }),
  ],
  controllers: [SellersController],
  providers: [SellersService, SellerStatsProcessor],
  exports: [SellersService],
})
export class SellersModule {}
