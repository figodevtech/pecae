import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from './dto/saved-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('buyers/saved-searches')
@UseGuards(JwtAuthGuard)
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() createSavedSearchDto: CreateSavedSearchDto) {
    return this.savedSearchesService.create(userId, createSavedSearchDto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.savedSearchesService.findAll(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savedSearchesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateSavedSearchDto: UpdateSavedSearchDto,
  ) {
    return this.savedSearchesService.update(id, userId, updateSavedSearchDto);
  }

  @Patch(':id/alert')
  toggleAlert(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('alertActive') alertActive: boolean,
  ) {
    return this.savedSearchesService.update(id, userId, { alertActive });
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savedSearchesService.remove(id, userId);
  }
}
