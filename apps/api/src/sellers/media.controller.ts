import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@Controller('sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.SELLER, UserType.BOTH)
export class SellerMediaController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('me/logo')
  async generateLogoUrl(@Req() req: any, @Body('filename') filename: string) {
    return this.sellersService.generateLogoUploadUrl(req.user.id, filename);
  }

  @Post('me/logo/confirm')
  async confirmLogo(@Req() req: any, @Body('publicUrl') publicUrl: string) {
    return this.sellersService.confirmLogoUpload(req.user.id, publicUrl);
  }
}
