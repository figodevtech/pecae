import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { CatalogService } from './catalog.service';

@ApiTags('Admin Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('cache/invalidate')
  @ApiOperation({ summary: 'Invalidate all catalog cache' })
  @ApiResponse({ status: 200, description: 'Cache invalidated successfully' })
  async invalidateCache() {
    await this.catalogService.invalidateCatalogCache();
    return { message: 'Catalog cache invalidated successfully' };
  }
}
