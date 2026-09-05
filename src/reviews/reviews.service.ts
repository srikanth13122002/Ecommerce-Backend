import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/review.dto.js';
import { ProductsService } from '../products/products.service.js';
import { serializeReview } from '../common/utils/serializers.js';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async findByProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map(serializeReview);
  }

  async create(productId: string, userId: string, dto: CreateReviewDto) {
    await this.productsService.findById(productId);

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return serializeReview(review);
  }

  async getAverageRating(productId: string) {
    const result = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating ?? 0,
      count: result._count.rating,
    };
  }
}
