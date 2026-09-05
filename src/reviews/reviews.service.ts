import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema.js';
import { CreateReviewDto } from './dto/review.dto.js';
import { ProductsService } from '../products/products.service.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private productsService: ProductsService,
  ) {}

  async findByProduct(productId: string) {
    return this.reviewModel
      .find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
  }

  async create(productId: string, userId: string, dto: CreateReviewDto) {
    await this.productsService.findById(productId);

    const existing = await this.reviewModel.findOne({
      product: productId,
      user: userId,
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    return this.reviewModel.create({
      product: productId,
      user: userId,
      ...dto,
    });
  }

  async getAverageRating(productId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: { product: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);
    return result[0] ?? { averageRating: 0, count: 0 };
  }
}
