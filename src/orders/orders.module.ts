import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController, AdminOrdersController } from './orders.controller.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [ProductsModule],
  providers: [OrdersService],
  controllers: [OrdersController, AdminOrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
