import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsService } from '../products/products.service.js';
import { toNumber } from '../common/utils/serializers.js';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  images: true,
                  stock: true,
                },
              },
            },
          },
        },
      });
    }

    return this.formatCart(cart);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    await this.productsService.findById(productId);

    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: { increment: quantity } },
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) throw new NotFoundException('Item not in cart');

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    try {
      await this.prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });
    } catch {
      throw new NotFoundException('Item not in cart');
    }

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
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

  private formatCart(
    cart: {
      items: {
        quantity: number;
        product: {
          id: string;
          name: string;
          slug: string;
          price: import('@prisma/client').Prisma.Decimal;
          images: string[];
          stock: number;
        };
      }[];
    },
  ) {
    const items = cart.items.map((item) => {
      const price = toNumber(item.product.price);
      return {
        productId: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price,
        image: item.product.images?.[0] ?? '',
        stock: item.product.stock,
        quantity: item.quantity,
        lineTotal: price * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, subtotal, itemCount };
  }
}
