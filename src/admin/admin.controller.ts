import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { OrdersService } from '../orders/orders.service.js';
import { ProductsService } from '../products/products.service.js';
import { UsersService } from '../users/users.service.js';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private usersService: UsersService,
  ) {}

  @Get('stats')
  async getStats() {
    const [orderStats, lowStock] = await Promise.all([
      this.ordersService.getStats(),
      this.productsService.getLowStock(),
    ]);

    const users = await this.usersService.findAll();

    return {
      ...orderStats,
      totalUsers: users.length,
      lowStockProducts: lowStock,
    };
  }

  @Get('users')
  getUsers() {
    return this.usersService.findAll();
  }
}
