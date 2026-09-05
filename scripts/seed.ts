import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

const categories = [
  { name: 'Electronics', description: 'Gadgets and devices' },
  { name: 'Clothing', description: 'Fashion and apparel' },
  { name: 'Home & Garden', description: 'Home essentials' },
  { name: 'Sports', description: 'Sports and fitness gear' },
  { name: 'Books', description: 'Books and literature' },
];

const productTemplates = [
  { name: 'Wireless Headphones', price: 79.99, category: 'Electronics' },
  { name: 'Smart Watch', price: 199.99, category: 'Electronics' },
  { name: 'Bluetooth Speaker', price: 49.99, category: 'Electronics' },
  { name: 'Laptop Stand', price: 34.99, category: 'Electronics' },
  { name: 'Classic T-Shirt', price: 24.99, category: 'Clothing' },
  { name: 'Denim Jeans', price: 59.99, category: 'Clothing' },
  { name: 'Running Shoes', price: 89.99, category: 'Clothing' },
  { name: 'Winter Jacket', price: 129.99, category: 'Clothing' },
  { name: 'Desk Lamp', price: 39.99, category: 'Home & Garden' },
  { name: 'Plant Pot Set', price: 29.99, category: 'Home & Garden' },
  { name: 'Throw Pillow', price: 19.99, category: 'Home & Garden' },
  { name: 'Yoga Mat', price: 34.99, category: 'Sports' },
  { name: 'Dumbbell Set', price: 79.99, category: 'Sports' },
  { name: 'Water Bottle', price: 14.99, category: 'Sports' },
  { name: 'The Great Novel', price: 12.99, category: 'Books' },
  { name: 'Cookbook Deluxe', price: 29.99, category: 'Books' },
  { name: 'USB-C Hub', price: 44.99, category: 'Electronics' },
  { name: 'Hoodie', price: 49.99, category: 'Clothing' },
  { name: 'Coffee Maker', price: 89.99, category: 'Home & Garden' },
  { name: 'Tennis Racket', price: 119.99, category: 'Sports' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seed() {
  console.log('Connected to PostgreSQL');

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@store.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: 'Admin User',
      role: 'admin',
    },
  });
  console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: slugify(cat.name),
        description: cat.description,
      },
    });
    categoryMap[cat.name] = category.id;
  }
  console.log(`Created ${categories.length} categories`);

  for (let i = 0; i < productTemplates.length; i++) {
    const p = productTemplates[i];
    await prisma.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        description: `High quality ${p.name.toLowerCase()} for everyday use. Built to last with premium materials and excellent craftsmanship.`,
        price: p.price,
        stock: Math.floor(Math.random() * 50) + 10,
        images: [`https://picsum.photos/seed/${slugify(p.name)}/600/600`],
        categoryId: categoryMap[p.category],
        featured: i < 8,
      },
    });
  }
  console.log(`Created ${productTemplates.length} products`);

  console.log('Seed completed successfully');
}

seed()
  .catch((err) => {
    console.error('\n❌ Seed failed:', err.message);
    console.error('\nMake sure PostgreSQL is running and DATABASE_URL is set in .env');
    console.error('Example: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
