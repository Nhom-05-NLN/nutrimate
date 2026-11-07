import { Request, Response } from 'express';
import { AuthLocals } from '../middleware/authMiddleware.js';
import * as service from '../services/nutritionDiaryService.js';
import { ApiResponse } from '../types/index.js';
import { NutritionDiaryDay } from '../types/nutritionDiary.js';

type DiaryResponse = ApiResponse<NutritionDiaryDay>;
export async function getDay(req: Request, res: Response<DiaryResponse, AuthLocals>): Promise<void> {
  try { res.json({ success: true, data: await service.getDay(res.locals.auth.sub, req.query.date) }); }
  catch (error: unknown) { respond(res, error); }
}
export async function createMeal(req: Request, res: Response<DiaryResponse, AuthLocals>): Promise<void> {
  try {
    const date = service.parseDate(req.body?.date);
    await service.createMeal(res.locals.auth.sub, req.body);
    res.status(201).json({ success: true, message: 'Đã lưu món ăn vào nhật ký.', data: await service.getDay(res.locals.auth.sub, date) });
  } catch (error: unknown) { respond(res, error); }
}
export async function deleteMeal(req: Request, res: Response<DiaryResponse, AuthLocals>): Promise<void> {
  try {
    const date = await service.deleteMeal(res.locals.auth.sub, req.params.id, req.query.date);
    res.json({
      success: true,
      message: 'Đã xóa món ăn khỏi nhật ký.',
      data: await service.getDay(res.locals.auth.sub, date),
    });
  } catch (error: unknown) { respond(res, error); }
}
export async function createWater(req: Request, res: Response<DiaryResponse, AuthLocals>): Promise<void> {
  try {
    const date = service.parseDate(req.body?.date);
    await service.createWater(res.locals.auth.sub, req.body);
    res.status(201).json({ success: true, message: 'Đã lưu lượng nước uống.', data: await service.getDay(res.locals.auth.sub, date) });
  } catch (error: unknown) { respond(res, error); }
}
function respond(res: Response<DiaryResponse, AuthLocals>, error: unknown): void {
  if (error instanceof service.NutritionDiaryError) { res.status(error.statusCode).json({ success: false, message: error.message }); return; }
  console.error('[NutritionDiaryController] Không thể xử lý nhật ký:', error instanceof Error ? error.message : 'Unknown error');
  res.status(503).json({ success: false, message: 'Không thể tải hoặc cập nhật nhật ký. Vui lòng thử lại sau.' });
}
