import { Module } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { BuyersController } from './buyers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';
import { AnonymizeUserProcessor } from './anonymize-user.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'user-management',
    }),
  ],
  controllers: [BuyersController, FavoritesController, SavedSearchesController],
  providers: [BuyersService, FavoritesService, SavedSearchesService, AnonymizeUserProcessor],
  exports: [BuyersService],
})
export class BuyersModule {}
