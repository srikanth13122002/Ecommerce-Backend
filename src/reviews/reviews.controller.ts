import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ProductsService } from '../products/products.service.js';

@ApiTags('reviews')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(
    private reviewsService: ReviewsService,
    private productsService: ProductsService,
  ) {}

  @Get()
  async findByProduct(@Param('productId') productId: string) {
    const [reviews, stats] = await Promise.all([
      this.reviewsService.findByProduct(productId),
      this.reviewsService.getAverageRating(productId),
    ]);
    return { reviews, stats };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @Param('productId') productId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(productId, userId, dto);
  }
}
