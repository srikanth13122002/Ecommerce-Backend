import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema.js';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(query: ProductQueryDto) {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sort = '-createdAt',
      featured,
    } = query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) filter.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: { $gte?: number; $lte?: number } = {};
      if (minPrice !== undefined) priceFilter.$gte = minPrice;
      if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
      filter.price = priceFilter;
    }
    if (featured !== undefined) filter.featured = featured;

    const skip = (page - 1) * limit;
    const sortObj = this.parseSort(sort);

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findFeatured(limit = 8) {
    return this.productModel
      .find({ featured: true })
      .populate('category', 'name slug')
      .limit(limit);
  }

  async findBySlug(slug: string) {
    const product = await this.productModel
      .findOne({ slug })
      .populate('category', 'name slug');
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findById(id: string) {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name slug');
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.productModel.create({
      ...dto,
      slug: slugify(dto.name),
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const update: Record<string, unknown> = { ...dto };
    if (dto.name) update.slug = slugify(dto.name);
    const product = await this.productModel
      .findByIdAndUpdate(id, update, { new: true })
      .populate('category', 'name slug');
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) throw new NotFoundException('Product not found');
    return { deleted: true };
  }

  async decrementStock(
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      const product = await this.productModel.findById(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        throw new NotFoundException(`Insufficient stock for ${product.name}`);
      }
      product.stock -= item.quantity;
      await product.save();
    }
  }

  async getLowStock(threshold = 5) {
    return this.productModel
      .find({ stock: { $lte: threshold } })
      .populate('category', 'name slug')
      .limit(10);
  }

  private parseSort(sort: string): Record<string, 1 | -1> {
    if (sort.startsWith('-')) {
      return { [sort.slice(1)]: -1 };
    }
    return { [sort]: 1 };
  }
}
