import { Controller, Post, Body, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { CreateSellerProfileDto } from './dto/create-seller-profile.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';

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

  @Get(':id')
  async getPublicProfile(@Param('id') id: string) {
    return this.sellersService.findPublicProfile(id);
  }
}
