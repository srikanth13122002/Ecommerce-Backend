import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service.js';
import { CartService } from '../cart/cart.service.js';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private ordersService: OrdersService,
    private cartService: CartService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  async createCheckoutSession(orderId: string, userId: string) {
    const order = await this.ordersService.findById(orderId, userId);

    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not pending payment');
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [this.absoluteImageUrl(item.image)] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${this.configService.getOrThrow('STRIPE_SUCCESS_URL')}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: this.configService.getOrThrow('STRIPE_CANCEL_URL'),
      metadata: {
        orderId: orderId,
        userId: userId,
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    let event: Stripe.Event;

    if (webhookSecret) {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } else {
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const userId = session.metadata?.userId;

      if (orderId) {
        await this.ordersService.markAsPaid(orderId, session.id);
        if (userId) {
          await this.cartService.clearCart(userId);
        }
      }
    }

    return { received: true };
  }

  private absoluteImageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const port = this.configService.get('PORT', 3000);
    return `http://localhost:${port}${path}`;
  }
}
