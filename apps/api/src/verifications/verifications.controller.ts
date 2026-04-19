import { Controller, Post, Body, Req, UseGuards, Param, Put, Get } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { ResolveVerificationDto } from './dto/resolve-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.MODERATOR, UserType.ADMIN)
  async getPendingVerifications() {
    return this.verificationsService.getPendingVerifications();
  }

  @Post('request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async requestVerification(@Req() req: any, @Body() dto: RequestVerificationDto) {
    return this.verificationsService.requestVerification(req.user.id, dto);
  }

  @Put(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.MODERATOR, UserType.ADMIN)
  async resolveVerification(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ResolveVerificationDto,
  ) {
    return this.verificationsService.resolveVerification(id, req.user.id, dto);
  }
}
