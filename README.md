# ShopVerse - Ecommerce Backend

NestJS REST API for a modern ecommerce platform with **PostgreSQL**, **Prisma**, JWT auth, and Stripe payments.

**Repository:** [github.com/srikanth13122002/Ecommerce-Backend](https://github.com/srikanth13122002/Ecommerce-Backend)

## Tech Stack

- **NestJS** — Node.js framework
- **PostgreSQL** + **Prisma** — Database and ORM
- **JWT** — Authentication with refresh tokens
- **Stripe** — Payment processing
- **Swagger** — API documentation at `/api/docs`

## Prerequisites

- Node.js 18+
- Docker Desktop (recommended) or PostgreSQL 14+ installed locally

## Local Setup

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your values (see [Environment Variables](#environment-variables)).

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start PostgreSQL with Docker:

   ```bash
   docker compose up -d
   ```

   Default connection (matches `.env.example`):

   ```
   postgresql://postgres:postgres@localhost:5432/ecommerce
   ```

5. Sync the database schema:

   ```bash
   npm run prisma:push
   ```

   For tracked migrations in team/production workflows:

   ```bash
   npm run prisma:migrate
   ```

6. Seed the database (admin user + sample products):

   ```bash
   npm run seed
   ```

   > **Warning:** The seed script clears existing data. Use only in development/staging.

7. Start the development server:

   ```bash
   npm run start:dev
   ```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`
- Uploaded images: `http://localhost:3000/uploads/...`

## Default Admin Credentials

After seeding:

- **Email:** `admin@store.com`
- **Password:** `Admin@123`

Change these before any production deployment.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `3000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access token signing secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret |
| `JWT_EXPIRES_IN` | No | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL (default: `7d`) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Prod | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_SUCCESS_URL` | Yes | Redirect after successful checkout |
| `STRIPE_CANCEL_URL` | Yes | Redirect after cancelled checkout |
| `CORS_ORIGIN` | Yes | Frontend URL (must match exactly) |
| `UPLOAD_DIR` | No | Product image storage path (default: `./uploads`) |
| `ADMIN_EMAIL` | Seed | Admin email for seed script |
| `ADMIN_PASSWORD` | Seed | Admin password for seed script |

### Production example

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/ecommerce?sslmode=require
JWT_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<long-random-string>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=https://your-frontend.com/checkout/success
STRIPE_CANCEL_URL=https://your-frontend.com/checkout/cancel
CORS_ORIGIN=https://your-frontend.com
UPLOAD_DIR=./uploads
```

## Database

PostgreSQL tables managed by Prisma:

| Table | Description |
|-------|-------------|
| `users` | Customer and admin accounts |
| `categories` | Product categories |
| `products` | Product catalog |
| `carts` / `cart_items` | Per-user shopping carts |
| `orders` / `order_items` | Orders with line-item snapshots |
| `reviews` | Product reviews (one per user per product) |

Schema file: `prisma/schema.prisma`

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

## Stripe Webhook

Payment confirmation requires a Stripe webhook in production:

- **URL:** `POST https://your-api-domain.com/api/v1/payments/webhook`
- **Event:** `checkout.session.completed`

Set `STRIPE_WEBHOOK_SECRET` from the Stripe Dashboard after creating the endpoint.

For local testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/v1/payments/webhook
```

Without a webhook, orders stay in `pending` status after checkout.

## Production Deployment

### Build and run

```bash
npm install
npm run prisma:generate
npm run build
npm run start:prod
```

The production entry point is `node dist/main`.

### DevOps checklist

- [ ] Set all production env vars on the host (never commit `.env`)
- [ ] Use a managed PostgreSQL instance (Supabase, Neon, RDS, etc.)
- [ ] Run `npm run prisma:migrate deploy` on production deploys
- [ ] Set `CORS_ORIGIN` to the exact frontend production URL
- [ ] Configure Stripe live keys and webhook endpoint
- [ ] Ensure `uploads/` directory is persistent (volume or object storage)
- [ ] Change default admin password after first login
- [ ] Run `npm run seed` only on fresh staging/dev databases
- [ ] Expose port `3000` (or your configured `PORT`) behind HTTPS reverse proxy

### Related frontend repo

The React storefront lives in a separate repository:

[github.com/srikanth13122002/Ecommerce-frontend](https://github.com/srikanth13122002/Ecommerce-frontend)

Set the frontend `VITE_API_URL` to `https://your-api-domain.com/api/v1`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Production build |
| `npm run start:prod` | Run production build |
| `npm run seed` | Seed database with sample data |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create/apply Prisma migrations |
| `npm run prisma:push` | Push schema to DB (dev shortcut) |
