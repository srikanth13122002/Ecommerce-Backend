import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { OrdersModule } from '../orders/orders.module.js';
import { ProductsModule } from '../products/products.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [OrdersModule, ProductsModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
