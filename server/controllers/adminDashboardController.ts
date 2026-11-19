import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { AdminDashboardData } from '../types/adminDashboard.js';
import * as adminDashboardService from '../services/adminDashboardService.js';

export async function getDashboard(
  req: Request,
  res: Response<ApiResponse<AdminDashboardData>>,
): Promise<void> {
  const currentDate = new Date();
  const period = req.query.period === undefined ? 'week'
    : typeof req.query.period === 'string' ? req.query.period : '';
  if (!['week', 'month', 'year'].includes(period)) {
    res.status(400).json({
      success: false,
      message: 'Khoảng thống kê không hợp lệ.',
    });
    return;
  }

  const dateParam = period === 'week' ? req.query.week : req.query.date;
  const selectedDate = typeof dateParam === 'string' ? dateParam : '';
  const datePattern = period === 'year'
    ? /^\d{4}-01-01$/
    : period === 'month'
      ? /^\d{4}-\d{2}-01$/
      : /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(selectedDate)) {
    res.status(400).json({
      success: false,
      message: 'Ngày thống kê không hợp lệ.',
    });
    return;
  }

  const parsedStart = new Date(`${selectedDate}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedStart.getTime())
    || parsedStart.toISOString().slice(0, 10) !== selectedDate
  ) {
    res.status(400).json({
      success: false,
      message: 'Ngày thống kê không hợp lệ.',
    });
    return;
  }

  let periodStart = selectedDate;
  if (period === 'week') {
    if (parsedStart.getUTCDay() !== 1) {
      res.status(400).json({ success: false, message: 'Tuần thống kê phải bắt đầu từ thứ Hai.' });
      return;
    }
  } else if (period === 'month') {
    periodStart = selectedDate;
  } else {
    periodStart = selectedDate;
  }

  const periodEndDate = new Date(parsedStart);
  if (period === 'week') periodEndDate.setUTCDate(periodEndDate.getUTCDate() + 7);
  if (period === 'month') periodEndDate.setUTCMonth(periodEndDate.getUTCMonth() + 1);
  if (period === 'year') periodEndDate.setUTCFullYear(periodEndDate.getUTCFullYear() + 1);
  const periodEnd = periodEndDate.toISOString().slice(0, 10);

  const previousStartDate = new Date(parsedStart);
  if (period === 'week') previousStartDate.setUTCDate(previousStartDate.getUTCDate() - 7);
  if (period === 'month') previousStartDate.setUTCMonth(previousStartDate.getUTCMonth() - 1);
  if (period === 'year') previousStartDate.setUTCFullYear(previousStartDate.getUTCFullYear() - 1);
  const previousStart = previousStartDate.toISOString().slice(0, 10);

  if (parsedStart > currentDate) {
    res.status(400).json({ success: false, message: 'Không thể xem thống kê trong tương lai.' });
    return;
  }

  try {
    const dashboard = await adminDashboardService.loadAdminDashboard(
      periodStart,
      periodEnd,
      previousStart,
      period as 'week' | 'month' | 'year',
    );
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
