import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
  Ip,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdsService } from './ads.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { TrackAdDto } from './dto/track-ad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @ApiOperation({ summary: 'Criar uma nova campanha de anúncio patrocinado (Admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Post('campaigns')
  async createCampaign(@Body() dto: CreateCampaignDto) {
    return this.adsService.createCampaign(dto);
  }

  @ApiOperation({ summary: 'Listar todas as campanhas de anúncios (Admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Get('campaigns')
  async getAllCampaigns() {
    return this.adsService.getAllCampaigns();
  }


  @ApiOperation({ summary: 'Pausar uma campanha (Admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Patch('campaigns/:id/pause')
  async pauseCampaign(@Param('id') id: string) {
    return this.adsService.pauseCampaign(id);
  }

  @ApiOperation({ summary: 'Retomar uma campanha pausada (Admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Patch('campaigns/:id/resume')
  async resumeCampaign(@Param('id') id: string) {
    return this.adsService.resumeCampaign(id);
  }

  @ApiOperation({ summary: 'Cancelar uma campanha (Admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Patch('campaigns/:id/cancel')
  async cancelCampaign(@Param('id') id: string) {
    return this.adsService.cancelCampaign(id);
  }

  @ApiOperation({ summary: 'Rastrear impressão de anúncio patrocinado' })
  @Post('track/impression')
  async trackImpression(@Body() dto: TrackAdDto, @Ip() ip: string) {
    return this.adsService.trackImpression(dto, ip);
  }

  @ApiOperation({ summary: 'Rastrear clique em anúncio patrocinado' })
  @Post('track/click')
  async trackClick(@Body() dto: TrackAdDto, @Ip() ip: string) {
    return this.adsService.trackClick(dto, ip);
  }

  @ApiOperation({ summary: 'Verificar se usuário pode ver anúncio intersticial (Capping)' })
  @Get('interstitial/status/:userId')
  async checkInterstitialCapping(@Param('userId') userId: string) {
    return this.adsService.checkInterstitialCapping(userId);
  }

  @ApiOperation({ summary: 'Executar expiração de campanhas ativas que passaram da data final (Admin/Cron)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Post('campaigns/expire')
  async expireCampaigns() {
    return this.adsService.expireCampaigns();
  }

  @ApiOperation({ summary: 'Obter anúncios patrocinados com targeting refinado' })
  @Get('sponsored')
  async getSponsoredListings(
    @Query('brandId') brandId?: string,
    @Query('modelId') modelId?: string,
    @Query('year') year?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adsService.getSponsoredListings({
      brandId,
      modelId,
      year: year ? parseInt(year, 10) : undefined,
      city,
      state,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
