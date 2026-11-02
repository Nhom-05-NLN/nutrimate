import { Request, Response } from 'express';
import * as voucherService from '../services/voucherService.js';
import { CreateVoucherPayload } from '../types/index.js';

export async function getVouchers(_req: Request, res: Response): Promise<void> {
  try {
    const vouchers = await voucherService.getAllVouchers();
    res.json({ success: true, data: vouchers, total: vouchers.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi lấy danh sách voucher';
    res.status(500).json({ success: false, message: msg });
  }
}

export async function validateVoucher(req: Request, res: Response): Promise<void> {
  try {
    const { code, itemsTotal, customerPhone, customerEmail } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã voucher' });
      return;
    }

    const total = parseFloat(itemsTotal) || 0;
    const identifier = customerPhone || customerEmail || undefined;
    const result = await voucherService.validateVoucher(code, total, identifier);

    if (!result.isValid) {
      res.status(400).json({
        success: false,
        message: result.message || 'Mã voucher không hợp lệ',
        discountAmount: 0,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        discountAmount: result.discountAmount,
        voucher: result.voucher,
      },
      message: result.message,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi kiểm tra voucher';
    res.status(500).json({ success: false, message: msg });
  }
}

export async function createVoucher(req: Request, res: Response): Promise<void> {
  try {
    const payload: CreateVoucherPayload = req.body;
    const newVoucher = await voucherService.createVoucher(payload);
    res.status(201).json({
      success: true,
      data: newVoucher,
      message: `Đã tạo thành công voucher ${newVoucher.code}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi tạo voucher';
    res.status(400).json({ success: false, message: msg });
  }
}

export async function toggleVoucher(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'Thiếu mã định danh voucher' });
      return;
    }
    const updated = await voucherService.toggleVoucher(id);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
      return;
    }
    res.json({
      success: true,
      data: updated,
      message: `Đã ${updated.isActive ? 'kích hoạt' : 'tạm dừng'} voucher ${updated.code}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái voucher';
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteVoucher(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'Thiếu mã định danh voucher' });
      return;
    }
    const deleted = await voucherService.deleteVoucher(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
      return;
    }
    res.json({ success: true, message: 'Đã xóa voucher thành công' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi xóa voucher';
    res.status(500).json({ success: false, message: msg });
  }
}
