import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

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
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  await db.dropDatabase();
  console.log('Dropped existing database');

  const usersCol = db.collection('users');
  const categoriesCol = db.collection('categories');
  const productsCol = db.collection('products');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@store.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await usersCol.insertOne({
    email: adminEmail,
    passwordHash,
    name: 'Admin User',
    role: 'admin',
    refreshTokenHash: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);

  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of categories) {
    const result = await categoriesCol.insertOne({
      name: cat.name,
      slug: slugify(cat.name),
      description: cat.description,
      image: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    categoryMap[cat.name] = result.insertedId;
  }
  console.log(`Created ${categories.length} categories`);

  for (let i = 0; i < productTemplates.length; i++) {
    const p = productTemplates[i];
    await productsCol.insertOne({
      name: p.name,
      slug: slugify(p.name),
      description: `High quality ${p.name.toLowerCase()} for everyday use. Built to last with premium materials and excellent craftsmanship.`,
      price: p.price,
      stock: Math.floor(Math.random() * 50) + 10,
      images: [
        `https://picsum.photos/seed/${slugify(p.name)}/600/600`,
      ],
      category: categoryMap[p.category],
      featured: i < 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`Created ${productTemplates.length} products`);

  await mongoose.disconnect();
  console.log('Seed completed successfully');
}

seed().catch((err) => {
  if (err.name === 'MongooseServerSelectionError') {
    const isAtlas = MONGODB_URI.includes('mongodb+srv') || MONGODB_URI.includes('mongodb.net');
    console.error('\n❌ Could not connect to MongoDB at:', MONGODB_URI.replace(/:([^:@/]+)@/, ':***@'));
    if (isAtlas) {
      console.error('\nAtlas connection failed. Try these fixes:\n');
      console.error('  1. Network Access → Add IP Address → "Add Current IP Address"');
      console.error('     (Your IP may have changed since setup)');
      console.error('  2. Or temporarily allow all: 0.0.0.0/0 (dev only)');
      console.error('  3. Wait 2 minutes after adding IP, then retry');
      console.error('  4. If on office/school WiFi, try mobile hotspot (port 27017 may be blocked)');
      console.error('  5. Verify user/password in Database Access\n');
    } else {
      console.error('\nMongoDB is not running. Choose one option:\n');
      console.error('  Option A — Docker: docker compose up -d (from project root)');
      console.error('  Option B — MongoDB Atlas: set MONGODB_URI in .env');
      console.error('  Option C — Install locally: mongodb.com/try/download/community\n');
    }
  } else {
    console.error('Seed failed:', err);
  }
  process.exit(1);
});
