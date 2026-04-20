import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@UseGuards(JwtAuthGuard)
@Controller('buyers/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('favorites')
  getFavorites(@Request() req: any) {
    return this.favoritesService.getFavorites(req.user.sub);
  }

  @Post(':listingId')
  toggleFavorite(@Request() req: any, @Param('listingId') listingId: string) {
    return this.favoritesService.toggleFavorite(req.user.sub, listingId);
  }
}
