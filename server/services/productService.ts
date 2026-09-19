import { Product, ProductFilterQuery } from '../types/index.js';
import * as productRepo from '../repositories/productRepository.js';

export async function getProducts(filter: ProductFilterQuery): Promise<Product[]> {
  return productRepo.findProducts(filter);
}

export async function getProductById(id: string): Promise<Product | null> {
  return productRepo.findProductById(id);
}

export async function addProduct(prodData: Omit<Product, 'id' | 'code' | 'rating' | 'reviewCount'>): Promise<Product> {
  const newProduct: Product = {
    ...prodData,
    id: `prod-${Date.now()}`,
    code: `NM-${Math.floor(1000 + Math.random() * 9000)}`,
    rating: 5.0,
    reviewCount: 0,
    badges: prodData.badges || ['Mới'],
  };
  return productRepo.createProduct(newProduct);
}
