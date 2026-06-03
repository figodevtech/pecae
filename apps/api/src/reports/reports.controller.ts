import { Controller, Post, Get, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType, ReportStatus } from '@prisma/client';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cria uma nova denúncia' })
  async create(@Req() req: any, @Body() dto: CreateReportDto) {
    return this.reportsService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN) // Apenas admins/moderadores podem ver a lista
  @ApiOperation({ summary: 'Lista todas as denúncias (Apenas Admins)' })
  async findAll() {
    return this.reportsService.findAll();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Atualiza o status de uma denúncia (Apenas Admins)' })
  async updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body('status') status: ReportStatus,
    @Body('notes') notes?: string,
  ) {
    return this.reportsService.updateStatus(id, status, req.user.id, notes);
  }
}
