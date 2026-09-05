# ShopVerse - Ecommerce Backend

NestJS REST API for a modern ecommerce platform with MongoDB, JWT auth, and Stripe payments.

## Tech Stack

- **NestJS** - Node.js framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication with refresh tokens
- **Stripe** - Payment processing (test mode)
- **Swagger** - API documentation at `/api/docs`

## Prerequisites

- Node.js 18+
- MongoDB running locally or MongoDB Atlas connection string

## Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your values:
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` / `JWT_REFRESH_SECRET` - Random secure strings
   - `STRIPE_SECRET_KEY` - From [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - `STRIPE_WEBHOOK_SECRET` - From Stripe webhook settings (optional for local dev)

3. Install dependencies:
   ```bash
   npm install
   ```

4. Seed the database (admin user + sample products):
   ```bash
   npm run seed
   ```

5. Start development server:
   ```bash
   npm run start:dev
   ```

API runs at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/api/docs`

## Default Admin Credentials

After seeding:
- **Email:** admin@store.com
- **Password:** Admin@123

## API Routes

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/api/v1/auth` | Register, login, refresh, me |
| Products | `/api/v1/products` | CRUD, search, pagination |
| Categories | `/api/v1/categories` | Category management |
| Cart | `/api/v1/cart` | Server-side cart (authenticated) |
| Orders | `/api/v1/orders` | Order creation and tracking |
| Payments | `/api/v1/payments` | Stripe checkout sessions |
| Reviews | `/api/v1/products/:id/reviews` | Product reviews |
| Admin | `/api/v1/admin` | Dashboard stats, users |
| Upload | `/api/v1/upload` | Product image upload |

## Stripe Webhook (Production)

For payment confirmation in production, configure a Stripe webhook pointing to:
```
POST /api/v1/payments/webhook
```
Event: `checkout.session.completed`

For local testing without webhooks, orders remain in `pending` status until manually updated or webhook is configured via Stripe CLI.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Production build |
| `npm run start:prod` | Run production build |
| `npm run seed` | Seed database with sample data |
