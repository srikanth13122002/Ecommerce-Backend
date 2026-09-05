import type {
  Category,
  Order,
  OrderItem,
  Product,
  Review,
  User,
} from '@prisma/client';
export function toNumber(value: { toString(): string } | number): number {
  return typeof value === 'number' ? value : Number(value);
}

export function serializeCategory(category: Category) {
  return {
    _id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function serializeProduct(
  product: Product & { category?: Category },
) {
  return {
    _id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: toNumber(product.price),
    stock: product.stock,
    images: product.images,
    category: product.category
      ? serializeCategory(product.category)
      : product.categoryId,
    featured: product.featured,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function serializeOrder(
  order: Order & {
    items?: OrderItem[];
    user?: Pick<User, 'id' | 'name' | 'email'>;
  },
) {
  return {
    _id: order.id,
    user: order.user
      ? { _id: order.user.id, name: order.user.name, email: order.user.email }
      : order.userId,
    items: (order.items ?? []).map((item) => ({
      product: item.productId,
      name: item.name,
      price: toNumber(item.price),
      quantity: item.quantity,
      image: item.image,
    })),
    total: toNumber(order.total),
    status: order.status,
    shippingAddress: {
      fullName: order.shippingFullName,
      addressLine1: order.shippingAddressLine1,
      addressLine2: order.shippingAddressLine2,
      city: order.shippingCity,
      state: order.shippingState,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
      phone: order.shippingPhone,
    },
    stripeSessionId: order.stripeSessionId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function serializeReview(
  review: Review & { user?: Pick<User, 'id' | 'name'> },
) {
  return {
    _id: review.id,
    product: review.productId,
    user: review.user
      ? { _id: review.user.id, name: review.user.name }
      : review.userId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
