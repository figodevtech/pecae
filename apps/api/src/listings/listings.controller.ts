import { Controller, Get, Param, Ip } from '@nestjs/common';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get(':id')
  async findOne(@Param('id') id: string, @Ip() ip: string) {
    return this.listingsService.findOne(id, ip);
  }
}
