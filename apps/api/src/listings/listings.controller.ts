import { Controller, Get, Patch, Delete, Param, Body, Query, Ip, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';

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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um anúncio (Soft Delete)' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listingsService.softDelete(id, userId);
  }

  @Patch(':id/sold')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar um anúncio como vendido' })
  async markAsSold(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listingsService.markAsSold(id, userId);
  }
}
