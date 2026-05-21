import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { ListingsController } from './listings.controller';
import { VehiclePhotosProcessor } from './jobs/vehicle-photos.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'vehicle-photos',
    }),
  ],
  controllers: [VehiclesController, ListingsController],
  providers: [VehiclesService, VehiclePhotosProcessor],
  exports: [VehiclesService, BullModule],
})
export class VehiclesModule {}

