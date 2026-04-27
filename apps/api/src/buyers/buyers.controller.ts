import { Controller, Get, Put, Delete, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { UpdateBuyerDto } from './dto/update-buyer.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('buyers')
@UseGuards(JwtAuthGuard)
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Get('me')
  async getMyProfile(@Request() req: any) {
    return this.buyersService.getMyProfile(req.user.id);
  }

  @Put('me')
  async updateMyProfile(
    @Request() req: any,
    @Body() updateBuyerDto: UpdateBuyerDto,
  ) {
    return this.buyersService.updateMyProfile(req.user.id, updateBuyerDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @Request() req: any,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    return this.buyersService.deleteAccount(req.user.id, deleteAccountDto);
  }
}
