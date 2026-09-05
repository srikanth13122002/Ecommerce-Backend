import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto.js';
import { serializeProduct } from '../common/utils/serializers.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.categoryId = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    if (featured !== undefined) where.featured = featured;

    const skip = (page - 1) * limit;
    const orderBy = this.parseSort(sort);

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map(serializeProduct),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findFeatured(limit = 8) {
    const products = await this.prisma.product.findMany({
      where: { featured: true },
      include: { category: true },
      take: limit,
    });
    return products.map(serializeProduct);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return serializeProduct(product);
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: slugify(dto.name),
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        categoryId: dto.category,
        images: dto.images ?? [],
        featured: dto.featured ?? false,
      },
      include: { category: true },
    });
    return serializeProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name, slug: slugify(dto.name) } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
          ...(dto.category !== undefined ? { categoryId: dto.category } : {}),
          ...(dto.images !== undefined ? { images: dto.images } : {}),
          ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
        },
        include: { category: true },
      });
      return serializeProduct(product);
    } catch {
      throw new NotFoundException('Product not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
      return { deleted: true };
    } catch {
      throw new NotFoundException('Product not found');
    }
  }

  async decrementStock(
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new NotFoundException(`Insufficient stock for ${product.name}`);
      }
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: product.stock - item.quantity },
      });
    }
  }

  async getLowStock(threshold = 5) {
    const products = await this.prisma.product.findMany({
      where: { stock: { lte: threshold } },
      include: { category: true },
      take: 10,
    });
    return products.map(serializeProduct);
  }

  private parseSort(sort: string): Prisma.ProductOrderByWithRelationInput {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    const direction = desc ? 'desc' : 'asc';

    if (field === 'price' || field === 'name' || field === 'createdAt') {
      return { [field]: direction };
    }
    return { createdAt: 'desc' };
  }
}
