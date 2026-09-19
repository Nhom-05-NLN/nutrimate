import { Request, Response } from 'express';
import * as productService from '../services/productService.js';
import { ApiResponse, Product, ProductFilterQuery } from '../types/index.js';

export async function getProducts(req: Request, res: Response<ApiResponse<Product[]>>): Promise<void> {
  try {
    const { category, diet, search, maxCalories, minProtein } = req.query;
    const filter: ProductFilterQuery = {
      category: typeof category === 'string' ? category : undefined,
      diet: typeof diet === 'string' ? diet : undefined,
      search: typeof search === 'string' ? search : undefined,
      maxCalories: typeof maxCalories === 'string' ? parseFloat(maxCalories) : undefined,
      minProtein: typeof minProtein === 'string' ? parseFloat(minProtein) : undefined,
    };

    const products = await productService.getProducts(filter);
    res.json({
      success: true,
      total: products.length,
      data: products,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi tải danh sách sản phẩm';
    res.status(500).json({ success: false, message });
  }
}

export async function getProductById(req: Request<{ id: string }>, res: Response<ApiResponse<Product>>): Promise<void> {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm yêu cầu' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi xem chi tiết sản phẩm';
    res.status(500).json({ success: false, message });
  }
}

export async function createProduct(req: Request, res: Response<ApiResponse<Product>>): Promise<void> {
  try {
    const payload = req.body;
    if (!payload.name || !payload.price || !payload.category) {
      res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc của sản phẩm' });
      return;
    }
    const newProduct = await productService.addProduct(payload);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi thêm mới sản phẩm';
    res.status(500).json({ success: false, message });
  }
}
