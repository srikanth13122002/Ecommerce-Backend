import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll() {
    return this.categoryModel.find().sort({ name: 1 });
  }

  async findById(id: string) {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.categoryModel.findOne({ slug });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    return this.categoryModel.create({
      ...dto,
      slug: slugify(dto.name),
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const update: Record<string, unknown> = { ...dto };
    if (dto.name) update.slug = slugify(dto.name);
    const category = await this.categoryModel.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);
    if (!category) throw new NotFoundException('Category not found');
    return { deleted: true };
  }
}
