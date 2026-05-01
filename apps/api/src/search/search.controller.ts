import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchFiltersDto } from './dto/search-filters.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  async search(@Query() filters: SearchFiltersDto) {
    return this.searchService.search(filters);
  }

  @Public()
  @Get('suggestions')
  async getSuggestions(@Query('q') q?: string) {
    return this.searchService.getSuggestions(q || '');
  }
}
