import { Controller, Post, Body, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { CreateSellerProfileDto } from './dto/create-seller-profile.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { VerificationRequestDto } from './dto/verification-request.dto';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async create(@Req() req: any, @Body() dto: CreateSellerProfileDto) {
    return this.sellersService.create(req.user.id, dto);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async update(@Req() req: any, @Body() dto: UpdateSellerProfileDto) {
    return this.sellersService.update(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async getMyProfile(@Req() req: any) {
    return this.sellersService.findByUserId(req.user.id);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async getMyStats(@Req() req: any) {
    return this.sellersService.getStats(req.user.id);
  }

  @Post('me/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async generateLogoUrl(@Req() req: any, @Body('filename') filename: string) {
    return this.sellersService.generateLogoUploadUrl(req.user.id, filename);
  }

  @Post('me/logo/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async confirmLogo(@Req() req: any, @Body('publicUrl') publicUrl: string) {
    return this.sellersService.confirmLogoUpload(req.user.id, publicUrl);
  }

  @Get('verification/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async getVerificationStatus(@Req() req: any) {
    return this.sellersService.getVerificationStatus(req.user.id);
  }

  @Post('verification/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async requestVerification(@Req() req: any) {
    return this.sellersService.requestVerification(req.user.id);
  }

  @Post('verification/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SELLER, UserType.BOTH)
  async confirmVerification(@Req() req: any, @Body() dto: VerificationRequestDto) {
    return this.sellersService.confirmVerificationRequest(req.user.id, dto.documentUrls);
  }

  @Get(':id')
  async getPublicProfile(@Param('id') id: string) {
    return this.sellersService.findPublicProfile(id);
  }

  @Get(':id/listings')
  async getSellerListings(@Param('id') id: string) {
    return this.sellersService.getSellerListings(id);
  }
}
