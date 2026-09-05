import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto.js';
import { ProductsService } from '../products/products.service.js';
import { OrderStatus } from '../common/enums/order-status.enum.js';
import { serializeOrder } from '../common/utils/serializers.js';
import { toNumber } from '../common/utils/serializers.js';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items.length) {
      throw new BadRequestException('Order must have at least one item');
    }

    const orderItems: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
    }[] = [];
    let total = 0;

    for (const item of dto.items) {
      const product = await this.productsService.findById(item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}`,
        );
      }
      const lineTotal = toNumber(product.price) * item.quantity;
      total += lineTotal;
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: toNumber(product.price),
        quantity: item.quantity,
        image: product.images?.[0] ?? '',
      });
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        status: OrderStatus.Pending,
        shippingFullName: dto.shippingAddress.fullName,
        shippingAddressLine1: dto.shippingAddress.addressLine1,
        shippingAddressLine2: dto.shippingAddress.addressLine2 ?? '',
        shippingCity: dto.shippingAddress.city,
        shippingState: dto.shippingAddress.state,
        shippingPostalCode: dto.shippingAddress.postalCode,
        shippingCountry: dto.shippingAddress.country,
        shippingPhone: dto.shippingAddress.phone,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    return serializeOrder(order);
  }

  async findByUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(serializeOrder);
  }

  async findById(id: string, userId?: string) {
    const order = await this.prisma.order.findFirst({
      where: userId ? { id, userId } : { id },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return serializeOrder(order);
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count(),
    ]);
    return {
      data: data.map(serializeOrder),
      meta: { total, page, limit },
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status: dto.status },
        include: { items: true },
      });
      return serializeOrder(order);
    } catch {
      throw new NotFoundException('Order not found');
    }
  }

  async markAsPaid(orderId: string, stripeSessionId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.Paid) return serializeOrder(order);

    await this.productsService.decrementStock(
      order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    );

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.Paid, stripeSessionId },
      include: { items: true },
    });

    return serializeOrder(updated);
  }

  async getStats() {
    const [totalOrders, paidOrders, revenueResult] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.Paid } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.Paid },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      paidOrders,
      revenue: toNumber(revenueResult._sum.total ?? 0),
    };
  }
}
