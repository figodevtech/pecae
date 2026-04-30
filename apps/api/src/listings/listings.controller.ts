import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todos os anúncios ativos' })
  async findAll(@Query() query: any) {
    return this.listingsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um anúncio' })
  async findOne(@Param('id') id: string, @Ip() ip: string) {
    return this.listingsService.findOne(id, ip);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo anúncio (Requer perfil de vendedor)' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateListingDto) {
    return this.listingsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um anúncio existente' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um anúncio (Soft Delete)' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listingsService.softDelete(id, userId);
  }
}
