import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { VerificationRequestDto } from './dto/verification-request.dto';

@Controller('sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.SELLER, UserType.BOTH)
export class SellerVerificationController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('verification/status')
  async getVerificationStatus(@Req() req: any) {
    return this.sellersService.getVerificationStatus(req.user.id);
  }

  @Post('verification/request')
  async requestVerification(@Req() req: any) {
    return this.sellersService.requestVerification(req.user.id);
  }

  @Post('verification/confirm')
  async confirmVerification(@Req() req: any, @Body() dto: VerificationRequestDto) {
    return this.sellersService.confirmVerificationRequest(req.user.id, dto.documentUrls);
  }
}
