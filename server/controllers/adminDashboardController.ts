import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { AdminDashboardData } from '../types/adminDashboard.js';
import * as adminDashboardService from '../services/adminDashboardService.js';

export async function getDashboard(
  req: Request,
  res: Response<ApiResponse<AdminDashboardData>>,
): Promise<void> {
  const currentDate = new Date();
  const currentWeekStartDate = new Date(Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate() - ((currentDate.getUTCDay() + 6) % 7),
  ));
  const currentWeekStart = currentWeekStartDate.toISOString().slice(0, 10);
  const weekStart = req.query.week === undefined
    ? currentWeekStart
    : typeof req.query.week === 'string'
      ? req.query.week
      : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    res.status(400).json({
      success: false,
      message: 'Tuần thống kê không hợp lệ.',
    });
    return;
  }

  const parsedWeekStart = new Date(`${weekStart}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedWeekStart.getTime())
    || parsedWeekStart.toISOString().slice(0, 10) !== weekStart
    || parsedWeekStart.getUTCDay() !== 1
  ) {
    res.status(400).json({
      success: false,
      message: 'Tuần thống kê phải bắt đầu từ thứ Hai.',
    });
    return;
  }

  if (weekStart > currentWeekStart) {
    res.status(400).json({
      success: false,
      message: 'Không thể xem thống kê của tuần trong tương lai.',
    });
    return;
  }

  try {
    const dashboard = await adminDashboardService.loadAdminDashboard(weekStart);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error: unknown) {
    const diagnostic = error instanceof Error ? error.message : 'Unknown admin dashboard error';
    console.error('[AdminDashboardController] Không thể tải dashboard:', diagnostic);
    res.status(503).json({
      success: false,
      message: 'Không thể tải dữ liệu dashboard từ cơ sở dữ liệu.',
    });
  }
}
