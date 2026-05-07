import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { SearchListingsDto } from './dto/search-listings.dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os anúncios ativos (Público para Compradores)' })
  async findAll(@Query() dto: SearchListingsDto) {
    return this.vehiclesService.findAllPublished(dto);
  }
}
