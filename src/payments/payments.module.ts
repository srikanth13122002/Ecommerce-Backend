import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { OrdersModule } from '../orders/orders.module.js';
import { CartModule } from '../cart/cart.module.js';

@Module({
  imports: [OrdersModule, CartModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
