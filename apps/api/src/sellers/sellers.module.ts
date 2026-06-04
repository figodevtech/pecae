import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { SellerStatsProcessor } from './jobs/seller-stats.processor';
import { SellerVerificationController } from './verification.controller';
import { SellerMediaController } from './media.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'seller-stats',
    }),
  ],
  controllers: [
    SellersController,
    SellerVerificationController,
    SellerMediaController,
  ],
  providers: [SellersService, SellerStatsProcessor],
  exports: [SellersService],
})
export class SellersModule {}

