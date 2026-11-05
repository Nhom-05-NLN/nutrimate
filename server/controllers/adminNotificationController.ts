import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { AdminNotificationList } from '../types/adminNotification.js';
import * as adminNotificationRepository from '../repositories/adminNotificationRepository.js';

export async function listNotifications(
  _req: Request,
  res: Response<ApiResponse<AdminNotificationList>>,
): Promise<void> {
  try {
    const result = await adminNotificationRepository.listAdminNotifications();
    res.status(200).json({ success: true, data: result });
  } catch (error: unknown) {
    const diagnostic = error instanceof Error ? error.message : 'Unknown notification list error';
    console.error('[AdminNotificationController] Không thể tải thông báo:', diagnostic);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thông báo quản trị. Kiểm tra cấu hình cơ sở dữ liệu và migration.',
    });
  }
}

export async function markAllRead(
  _req: Request,
  res: Response<ApiResponse<{ updated: boolean }>>,
): Promise<void> {
  try {
    await adminNotificationRepository.markAllAdminNotificationsRead();
    res.status(200).json({ success: true, data: { updated: true } });
  } catch (error: unknown) {
    const diagnostic = error instanceof Error ? error.message : 'Unknown notification update error';
    console.error('[AdminNotificationController] Không thể cập nhật trạng thái thông báo:', diagnostic);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái thông báo.',
    });
  }
}

export async function markRead(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<{ updated: boolean }>>,
): Promise<void> {
  if (!/^[1-9]\d{0,18}$/.test(req.params.id)) {
    res.status(400).json({ success: false, message: 'Mã thông báo không hợp lệ.' });
    return;
  }

  try {
    const updated = await adminNotificationRepository.markAdminNotificationRead(req.params.id);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
      return;
    }
    res.status(200).json({ success: true, data: { updated: true } });
  } catch (error: unknown) {
    const diagnostic = error instanceof Error ? error.message : 'Unknown notification update error';
    console.error('[AdminNotificationController] Không thể cập nhật trạng thái thông báo:', diagnostic);
    res.status(500).json({ success: false, message: 'Không thể cập nhật trạng thái thông báo.' });
  }
}

export async function deleteNotification(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<{ deleted: boolean }>>,
): Promise<void> {
  if (!/^[1-9]\d{0,18}$/.test(req.params.id)) {
    res.status(400).json({ success: false, message: 'Mã thông báo không hợp lệ.' });
    return;
  }

  try {
    const deleted = await adminNotificationRepository.deleteAdminNotification(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
      return;
    }
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    const diagnostic = error instanceof Error ? error.message : 'Unknown notification deletion error';
    console.error('[AdminNotificationController] Không thể xóa thông báo:', diagnostic);
    res.status(500).json({ success: false, message: 'Không thể xóa thông báo.' });
  }
}

export async function deleteAllNotifications(
  _req: Request,
  res: Response<ApiResponse<{ deleted: boolean }>>,
): Promise<void> {
  try {
    await adminNotificationRepository.deleteAllAdminNotifications();
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    const diagnostic = error instanceof Error ? error.message : 'Unknown notifications deletion error';
    console.error('[AdminNotificationController] Không thể xóa tất cả thông báo:', diagnostic);
    res.status(500).json({ success: false, message: 'Không thể xóa tất cả thông báo.' });
  }
}
