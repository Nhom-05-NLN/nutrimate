import { Request, Response } from 'express';
import { AuthLocals } from '../middleware/authMiddleware.js';
import * as caloriePlanService from '../services/caloriePlanService.js';
import { ApiResponse } from '../types/index.js';
import { CaloriePlan, CalorieProfile } from '../types/caloriePlan.js';

type PlanData = { profile: CalorieProfile; plan: CaloriePlan | null };

export async function getPlan(
  _req: Request,
  res: Response<ApiResponse<PlanData>, AuthLocals>,
): Promise<void> {
  try {
    const data = await caloriePlanService.getPlan(res.locals.auth.sub);
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    respondWithError(res, error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response<ApiResponse<PlanData>, AuthLocals>,
): Promise<void> {
  try {
    const data = await caloriePlanService.updateProfile(res.locals.auth.sub, req.body);
    res.status(200).json({ success: true, message: 'Đã lưu hồ sơ và lộ trình Calories.', data });
  } catch (error: unknown) {
    respondWithError(res, error);
  }
}

function respondWithError(res: Response<ApiResponse<PlanData>, AuthLocals>, error: unknown): void {
  if (error instanceof caloriePlanService.CaloriePlanError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  const diagnostic = error instanceof Error ? error.message : 'Unknown server error';
  console.error('[CaloriePlanController] Không thể xử lý lộ trình Calories:', diagnostic);
  res.status(503).json({ success: false, message: 'Không thể tải hoặc lưu lộ trình. Vui lòng thử lại sau.' });
}
