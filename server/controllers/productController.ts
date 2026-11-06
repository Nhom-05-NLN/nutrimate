import { Request, Response } from 'express';
import * as productService from '../services/productService.js';
import { getTotalSoldProducts } from '../repositories/productRepository.js';
import { ApiResponse, Product, ProductFilterQuery, PaginatedProductResponse } from '../types/index.js';

export async function getSalesSummary(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, data: { totalSold: await getTotalSoldProducts() } });
  } catch {
    res.status(503).json({ success: false, message: 'Không thể tải lượt bán từ cơ sở dữ liệu.' });
  }
}

export async function getProducts(req: Request, res: Response<PaginatedProductResponse | ApiResponse<Product[]>>): Promise<void> {
  try {
    const { category, diet, search, maxCalories, minProtein, page, limit, sort } = req.query;
    const filter: ProductFilterQuery = {
      categories: typeof req.query.categories === 'string'
        ? [...new Set(req.query.categories.split(',').map(value => value.trim()).filter(value => value && value !== 'all'))]
        : undefined,
      category: typeof category === 'string' ? category : undefined,
      diet: typeof diet === 'string' ? diet : undefined,
      search: typeof search === 'string' ? search : undefined,
      maxCalories: typeof maxCalories === 'string' ? parseFloat(maxCalories) : undefined,
      minProtein: typeof minProtein === 'string' ? parseFloat(minProtein) : undefined,
      page: typeof page === 'string' ? parseInt(page, 10) : 1,
      limit: typeof limit === 'string' ? parseInt(limit, 10) : 12,
      sort: typeof sort === 'string' ? (sort as ProductFilterQuery['sort']) : undefined,
    };

    const result = await productService.getProducts(filter);
    res.json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      data: result.products,
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
