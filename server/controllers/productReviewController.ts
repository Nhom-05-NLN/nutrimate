import { Request, Response } from 'express';
import { insertProductReview, listProductReviews } from '../repositories/productReviewRepository.js';
import type { AuthLocals } from '../middleware/authMiddleware.js';

export async function getReviews(req: Request<{ id: string }>, res: Response) {
  try {
    res.json({ success: true, data: await listProductReviews(req.params.id) });
  } catch {
    res.status(503).json({ success: false, message: 'Không thể tải đánh giá từ cơ sở dữ liệu.' });
  }
}

export async function createReview(req: Request<{ id: string }>, res: Response<unknown, AuthLocals>) {
  const { rating, content } = req.body ?? {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 ||
      typeof content !== 'string' || !content.trim() || content.trim().length > 2000) {
    res.status(400).json({ success: false, message: 'Chọn từ 1 đến 5 sao và nhập nhận xét tối đa 2000 ký tự.' });
    return;
  }
  try {
    const id = await insertProductReview(req.params.id, res.locals.auth.sub, rating, content.trim());
    if (!id) {
      res.status(403).json({ success: false, message: 'Bạn chỉ có thể đánh giá sản phẩm đã mua trong đơn hàng được giao thành công.' });
      return;
    }
    res.status(201).json({ success: true, data: { id } });
  } catch {
    res.status(503).json({ success: false, message: 'Không thể lưu đánh giá. Vui lòng thử lại.' });
  }
}
