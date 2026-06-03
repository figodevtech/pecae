import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Query, 
  Req, 
  UseGuards, 
  Ip, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { Request } from 'express';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Registra uma visualização de anúncio (dedup 24h por IP).
   * Endpoint público disparado quando um comprador abre os detalhes de uma peça/sucata.
   */
  @Post('listings/:id/view')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Registra visualização de anúncio (assíncrono + dedup)' })
  async registerView(
    @Param('id') id: string,
    @Ip() clientIp: string,
  ) {
    await this.analyticsService.registerView(id, clientIp);
    return { queued: true };
  }

  /**
   * Dashboard do Vendedor: Métricas dos seus próprios anúncios.
   */
  @Get('seller/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH, UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna estatísticas dos anúncios do vendedor autenticado' })
  async getSellerAnalytics(
    @Req() req: any,
    @Query('periodDays') periodDays?: number,
  ) {
    const days = periodDays ? Number(periodDays) : 30;
    return this.analyticsService.getSellerAnalytics(req.user.id, days);
  }

  /**
   * Dashboard do Administrador: Métricas agregadas da plataforma.
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna estatísticas globais para o administrador' })
  async getAdminAnalytics() {
    return this.analyticsService.getAdminAnalytics();
  }

  /**
   * Força o recálculo de estatísticas (Cache aggregates de ListingStats e SellerStats).
   */
  @Post('trigger-recalc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agenda execução do worker para consolidar métricas agregadas' })
  async triggerRecalc() {
    return this.analyticsService.triggerRecalc();
  }
}
