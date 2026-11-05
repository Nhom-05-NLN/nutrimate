import { Voucher, CreateVoucherPayload } from '../types/index.js';
import * as voucherRepo from '../repositories/voucherRepository.js';
import * as orderRepo from '../repositories/orderRepository.js';

export interface VoucherValidationResult {
  isValid: boolean;
  discountAmount: number;
  message?: string;
  voucher?: Voucher;
}

export async function getAllVouchers(): Promise<Voucher[]> {
  return voucherRepo.getAllVouchers();
}

export async function getVoucherByCode(code: string): Promise<Voucher | null> {
  return voucherRepo.getVoucherByCode(code);
}

export async function validateVoucher(
  code: string,
  itemsTotal: number,
  customerIdentifier?: string // phone hoặc email
): Promise<VoucherValidationResult> {
  if (!code || !code.trim()) {
    return { isValid: false, discountAmount: 0, message: 'Vui lòng cung cấp mã voucher' };
  }

  const voucher = await voucherRepo.getVoucherByCode(code);
  if (!voucher) {
    return { isValid: false, discountAmount: 0, message: 'Mã voucher không tồn tại trên hệ thống' };
  }

  if (!voucher.isActive) {
    return { isValid: false, discountAmount: 0, message: 'Mã voucher hiện đang tạm dừng kích hoạt' };
  }

  // Kiểm tra hạn sử dụng
  if (voucher.endDate) {
    const end = new Date(voucher.endDate).getTime();
    if (Date.now() > end) {
      return { isValid: false, discountAmount: 0, message: 'Mã voucher đã hết hạn sử dụng' };
    }
  }

  // Kiểm tra lượt dùng
  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
    return { isValid: false, discountAmount: 0, message: 'Mã voucher đã hết lượt sử dụng' };
  }

  // Kiểm tra tiền hàng tối thiểu
  if (itemsTotal < voucher.minOrderAmount) {
    const diff = voucher.minOrderAmount - itemsTotal;
    const diffFormatted = new Intl.NumberFormat('vi-VN').format(diff);
    return {
      isValid: false,
      discountAmount: 0,
      message: `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucher.minOrderAmount)}đ để áp dụng (còn thiếu ${diffFormatted}đ)`,
    };
  }

  // Kiểm tra khách hàng mới nếu targetType === 'first_order'
  if (voucher.targetType === 'first_order' && customerIdentifier) {
    const allOrders = await orderRepo.getAllOrders();
    const cleanId = customerIdentifier.trim().toLowerCase();
    const hasPriorOrder = allOrders.some(
      (o) =>
        (o.customer.phone && o.customer.phone.trim().toLowerCase() === cleanId) ||
        (o.customer.email && o.customer.email.trim().toLowerCase() === cleanId)
    );
    if (hasPriorOrder) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Mã khuyến mãi này chỉ dành riêng cho khách hàng mới đặt đơn đầu tiên',
      };
    }
  }

  // Tính số tiền chiết khấu
  let discountAmount = 0;
  if (voucher.discountType === 'fixed') {
    discountAmount = Math.min(voucher.discountValue, itemsTotal);
  } else if (voucher.discountType === 'percent') {
    discountAmount = Math.round(itemsTotal * (voucher.discountValue / 100));
    if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
    }
  }

  return {
    isValid: true,
    discountAmount,
    voucher,
    message: `Áp dụng thành công mã ${voucher.code}`,
  };
}

export async function createVoucher(payload: CreateVoucherPayload): Promise<Voucher> {
  const code = payload.code.trim().toUpperCase();
  if (!code) {
    throw new Error('Mã voucher không được để trống');
  }

  const existing = await voucherRepo.getVoucherByCode(code);
  if (existing) {
    throw new Error(`Mã voucher ${code} đã tồn tại`);
  }

  if (payload.discountValue <= 0) {
    throw new Error('Giá trị chiết khấu phải lớn hơn 0');
  }

  if (payload.discountType === 'percent' && payload.discountValue > 100) {
    throw new Error('Chiết khấu theo phần trăm không được vượt quá 100%');
  }

  const voucher: Voucher = {
    id: `vouch-${Date.now()}`,
    code,
    title: payload.title.trim() || `Ưu đãi ${code}`,
    description: payload.description?.trim(),
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    minOrderAmount: payload.minOrderAmount || 0,
    maxDiscountAmount: payload.maxDiscountAmount,
    targetType: payload.targetType || 'all',
    usageLimit: payload.usageLimit || 100,
    usedCount: 0,
    endDate: payload.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    isActive: payload.isActive ?? true,
    createdAt: new Date().toISOString(),
  };

  return voucherRepo.createVoucher(voucher);
}

export async function toggleVoucher(id: string): Promise<Voucher | null> {
  return voucherRepo.toggleVoucherActive(id);
}

export async function deleteVoucher(id: string): Promise<boolean> {
  return voucherRepo.deleteVoucher(id);
}

export async function recordVoucherUsage(code: string): Promise<void> {
  await voucherRepo.incrementVoucherUsed(code);
}

export async function releaseVoucherUsage(code: string): Promise<void> {
  await voucherRepo.decrementVoucherUsed(code);
}
