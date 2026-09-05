import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema.js';
import { ProductsService } from '../products/products.service.js';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private productsService: ProductsService,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartModel
      .findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name slug price images stock',
      });

    if (!cart) {
      cart = await this.cartModel.create({ user: userId, items: [] });
    }

    return this.formatCart(cart);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    await this.productsService.findById(productId);

    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      cart = await this.cartModel.create({ user: userId, items: [] });
    }

    const existing = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId as unknown as import('mongoose').Types.ObjectId, quantity });
    }

    await cart.save();
    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find(
      (i) => i.product.toString() === productId,
    );
    if (!item) throw new NotFoundException('Item not in cart');

    item.quantity = quantity;
    await cart.save();
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new NotFoundException('Cart not found');

    cart.items = cart.items.filter(
      (i) => i.product.toString() !== productId,
    );
    await cart.save();
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.cartModel.findOneAndUpdate(
      { user: userId },
      { items: [] },
      { upsert: true },
    );
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  async mergeCart(
    userId: string,
    guestItems: { productId: string; quantity: number }[],
  ) {
    for (const item of guestItems) {
      await this.addItem(userId, item.productId, item.quantity);
    }
    return this.getCart(userId);
  }

  private formatCart(cart: CartDocument) {
    const items = cart.items
      .filter((item) => item.product && typeof item.product === 'object')
      .map((item) => {
        const product = item.product as unknown as {
          _id: string;
          name: string;
          slug: string;
          price: number;
          images: string[];
          stock: number;
        };
        return {
          productId: product._id.toString(),
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.images?.[0] ?? '',
          stock: product.stock,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
        };
      });

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, subtotal, itemCount };
  }
}
