import { Controller, Post, Body, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get('sellers/:id/reviews')
  async getSellerReviews(
    @Param('id') id: string,
    @Query('limit') limit = 10,
    @Query('cursor') cursor?: string,
  ) {
    return this.reviewsService.findAllBySeller(id, Number(limit), cursor);
  }
}
