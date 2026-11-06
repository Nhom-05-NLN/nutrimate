import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { AdminDashboardData } from '../types/adminDashboard.js';
import * as adminDashboardService from '../services/adminDashboardService.js';

export async function getDashboard(
  _req: Request,
  res: Response<ApiResponse<AdminDashboardData>>,
): Promise<void> {
  try {
    const dashboard = await adminDashboardService.loadAdminDashboard();
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
