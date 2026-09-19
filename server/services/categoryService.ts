import { Category } from '../types/index.js';
import * as categoryRepo from '../repositories/categoryRepository.js';

export async function getCategories(): Promise<Category[]> {
  return categoryRepo.getAllCategories();
}
