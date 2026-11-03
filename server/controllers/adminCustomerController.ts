import { Request, Response } from 'express';
import * as adminCustomerService from '../services/adminCustomerService.js';
import { ApiResponse } from '../types/index.js';
import { AdminCustomerListResult } from '../types/adminCustomer.js';

export async function listCustomers(
  req: Request,
  res: Response<ApiResponse<AdminCustomerListResult>>,
): Promise<void> {
  try {
    const result = await adminCustomerService.listCustomers(req.query);
    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof adminCustomerService.AdminCustomerError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }

    const diagnostic = error instanceof Error ? error.message : 'Unknown customer list error';
    console.error('[AdminCustomerController] Không thể tải danh sách khách hàng:', diagnostic);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh sách khách hàng.',
    });
  }
}

export async function createCustomer(
  req: Request,
  res: Response<ApiResponse<{ id: string }>>,
): Promise<void> {
  try {
    const id = await adminCustomerService.createCustomer(req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (error: unknown) {
    if (error instanceof adminCustomerService.AdminCustomerError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof adminCustomerService.AdminCustomerDuplicateEmailError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    const diagnostic = error instanceof Error ? error.message : 'Unknown customer creation error';
    console.error('[AdminCustomerController] Không thể tạo khách hàng:', diagnostic);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo khách hàng.' });
  }
}

export async function updateCustomer(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<{ updated: boolean }>>,
): Promise<void> {
  try {
    await adminCustomerService.updateCustomer(req.params.id, req.body);
    res.status(200).json({ success: true, data: { updated: true } });
  } catch (error: unknown) {
    if (error instanceof adminCustomerService.AdminCustomerError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof adminCustomerService.AdminCustomerDuplicateEmailError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof adminCustomerService.AdminCustomerNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    const diagnostic = error instanceof Error ? error.message : 'Unknown customer update error';
    console.error('[AdminCustomerController] Không thể cập nhật khách hàng:', diagnostic);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật khách hàng.' });
  }
}

export async function deleteCustomer(
  req: Request<{ id: string }>,
  res: Response<ApiResponse<{ deleted: boolean }>>,
): Promise<void> {
  try {
    await adminCustomerService.deleteCustomer(req.params.id);
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    if (error instanceof adminCustomerService.AdminCustomerError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof adminCustomerService.AdminCustomerNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof adminCustomerService.AdminCustomerHasOrdersError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    if (
      typeof error === 'object' && error !== null && 'code' in error &&
      error.code === '23503'
    ) {
      res.status(409).json({
        success: false,
        message: 'Không thể xóa khách hàng vì vẫn còn dữ liệu liên quan cần được bảo toàn.',
      });
      return;
    }
    const diagnostic = error instanceof Error ? error.message : 'Unknown customer deletion error';
    console.error('[AdminCustomerController] Không thể xóa khách hàng:', diagnostic);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa khách hàng.' });
  }
}
