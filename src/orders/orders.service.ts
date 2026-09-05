import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto.js';
import { ProductsService } from '../products/products.service.js';
import { OrderStatus } from '../common/enums/order-status.enum.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private productsService: ProductsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items.length) {
      throw new BadRequestException('Order must have at least one item');
    }

    const orderItems = [];
    let total = 0;

    for (const item of dto.items) {
      const product = await this.productsService.findById(item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}`,
        );
      }
      const lineTotal = product.price * item.quantity;
      total += lineTotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0] ?? '',
      });
    }

    return this.orderModel.create({
      user: userId,
      items: orderItems,
      total,
      shippingAddress: dto.shippingAddress,
      status: OrderStatus.Pending,
    });
  }

  async findByUser(userId: string) {
    return this.orderModel
      .find({ user: userId })
      .sort({ createdAt: -1 });
  }

  async findById(id: string, userId?: string) {
    const filter: Record<string, unknown> = { _id: id };
    if (userId) filter.user = userId;
    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel
        .find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments(),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { status: dto.status },
      { new: true },
    );
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async markAsPaid(orderId: string, stripeSessionId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.Paid) return order;

    await this.productsService.decrementStock(
      order.items.map((i) => ({
        productId: i.product.toString(),
        quantity: i.quantity,
      })),
    );

    order.status = OrderStatus.Paid;
    order.stripeSessionId = stripeSessionId;
    return order.save();
  }

  async getStats() {
    const [totalOrders, paidOrders, revenueResult] = await Promise.all([
      this.orderModel.countDocuments(),
      this.orderModel.countDocuments({ status: OrderStatus.Paid }),
      this.orderModel.aggregate([
        { $match: { status: OrderStatus.Paid } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    return {
      totalOrders,
      paidOrders,
      revenue: revenueResult[0]?.total ?? 0,
    };
  }
}
