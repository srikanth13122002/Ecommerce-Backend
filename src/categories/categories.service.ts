import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';
import { serializeCategory } from '../common/utils/serializers.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map(serializeCategory);
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return serializeCategory(category);
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('Category not found');
    return serializeCategory(category);
  }

  async create(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        ...dto,
        slug: slugify(dto.name),
      },
    });
    return serializeCategory(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.name ? { slug: slugify(dto.name) } : {}),
        },
      });
      return serializeCategory(category);
    } catch {
      throw new NotFoundException('Category not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.category.delete({ where: { id } });
      return { deleted: true };
    } catch {
      throw new NotFoundException('Category not found');
    }
  }
}
