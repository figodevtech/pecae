import { Controller, Post, Get, Delete, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SavedSearchesService } from './saved-searches.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@UseGuards(JwtAuthGuard)
@Controller('buyers/saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Post()
  create(@Request() req: any, @Body() data: CreateSavedSearchDto) {
    return this.savedSearchesService.createSavedSearch(req.user.sub, data);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.savedSearchesService.getSavedSearches(req.user.sub);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.savedSearchesService.deleteSavedSearch(req.user.sub, id);
  }

  @Patch(':id/alert')
  toggleAlert(@Request() req: any, @Param('id') id: string, @Body('alertActive') alertActive: boolean) {
    return this.savedSearchesService.toggleAlert(req.user.sub, id, alertActive);
  }
}

