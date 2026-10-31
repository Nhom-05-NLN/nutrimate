import { Product, ProductFilterQuery } from '../types/index.js';
import * as productRepo from '../repositories/productRepository.js';

export async function getProducts(filter: ProductFilterQuery) {
  const page = filter.page && filter.page > 0 ? Number(filter.page) : 1;
  const limit = filter.limit && filter.limit > 0 ? Number(filter.limit) : 12;

  const { products, total } = await productRepo.findProducts({ ...filter, page, limit });

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total/limit) || 1,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  return productRepo.findProductById(id);
}

export async function addProduct(prodData: Omit<Product, 'id' | 'code' | 'rating' | 'reviewCount'>): Promise<Product> {
  const price = prodData.price ?? prodData.basePrice ?? 0;
  const image = prodData.image ?? prodData.imageURL ?? '';
  const newProduct: Product = {
    ...prodData,
    id: `prod-${Date.now()}`,
    code: `NM-${Math.floor(1000 + Math.random() * 9000)}`,
    price,
    basePrice: price,
    image,
    imageURL: image,
    status: prodData.status ?? true,
    usageInstruction: prodData.usageInstruction ?? 'Bảo quản nơi thoáng mát, dùng trực tiếp sau khi mở bao bì.',
    rating: 5.0,
    reviewCount: 0,
    badges: prodData.badges || ['Mới'],
  };
  return productRepo.createProduct(newProduct);
}
