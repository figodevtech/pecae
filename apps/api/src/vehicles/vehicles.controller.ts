import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Put, 
  Req, 
  UseGuards, 
  Patch,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType, PhotoType } from '@prisma/client';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateAvailablePartsDto } from './dto/update-available-parts.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Helper to get seller profile ID from user ID.
   */
  private async getSellerId(userId: string): Promise<string> {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Perfil de vendedor não encontrado');
    return profile.id;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiOperation({ summary: 'Cadastra uma nova sucata e cria o anúncio (PENDING)' })
  async create(@Req() req: any, @Body() dto: CreateVehicleDto) {
    const sellerId = await this.getSellerId(req.user.id);
    return this.vehiclesService.create(sellerId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiOperation({ summary: 'Lista os veículos/anúncios do vendedor autenticado' })
  async getMyVehicles(@Req() req: any) {
    const sellerId = await this.getSellerId(req.user.id);
    return this.vehiclesService.findBySeller(sellerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de um veículo específico' })
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Put(':id')
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiOperation({ summary: 'Atualiza dados do veículo (Força re-moderação)' })
  async update(
    @Param('id') id: string, 
    @Req() req: any, 
    @Body() dto: UpdateVehicleDto
  ) {
    const sellerId = await this.getSellerId(req.user.id);
    return this.vehiclesService.update(id, sellerId, dto);
  }

  @Patch(':id/parts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiOperation({ summary: 'Atualiza apenas as peças disponíveis (Sem re-moderação)' })
  async updateParts(
    @Param('id') id: string, 
    @Req() req: any, 
    @Body() dto: UpdateAvailablePartsDto
  ) {
    const sellerId = await this.getSellerId(req.user.id);
    return this.vehiclesService.updateAvailableParts(id, sellerId, dto);
  }

  @Patch(':id/sold')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiOperation({ summary: 'Marca o veículo como VENDIDO' })
  async markAsSold(@Param('id') id: string, @Req() req: any) {
    const sellerId = await this.getSellerId(req.user.id);
    return this.vehiclesService.markAsSold(id, sellerId);
  }

  @Patch(':id/removed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiOperation({ summary: 'Marca o veículo como RETIRADO (Inativo)' })
  async markAsRemoved(@Param('id') id: string, @Req() req: any) {
    const sellerId = await this.getSellerId(req.user.id);
    return this.vehiclesService.markAsRemoved(id, sellerId);
  }

  @Post(':id/photos/upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiOperation({ summary: 'Gera URLs para upload de fotos' })
  async getUploadUrls(
    @Param('id') id: string,
    @Req() req: any,
    @Body('count') count: number
  ) {
    const sellerId = await this.getSellerId(req.user.id);
    return this.vehiclesService.generateUploadUrls(id, sellerId, count || 5);
  }

  @Post(':id/photos/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  @ApiOperation({ summary: 'Confirma o upload das fotos' })
  async confirmPhotos(
    @Param('id') id: string,
    @Req() req: any,
    @Body('photos') photos: { url: string; type: PhotoType; order: number }[]
  ) {
    const sellerId = await this.getSellerId(req.user.id);
    return this.vehiclesService.confirmPhotos(id, sellerId, photos);
  }
}
