import { Request, Response } from 'express';
import * as categoryService from '../services/categoryService.js';
import { ApiResponse, Category } from '../types/index.js';

export async function getCategories(_req: Request, res: Response<ApiResponse<Category[]>>): Promise<void> {
  try {
    const categories = await categoryService.getCategories();
    res.json({
      success: true,
      total: categories.length,
      data: categories,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi tải danh mục thực phẩm';
    res.status(500).json({ success: false, message });
  }
}
