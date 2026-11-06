import { Order, CreateOrderPayload, OrderStatus, PaymentStatus } from '../types/index.js';
import * as orderRepo from '../repositories/orderRepository.js';
import * as voucherService from './voucherService.js';

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Giỏ hàng không được để trống khi đặt hàng.');
  }

  if (!payload.customer || !payload.customer.name.trim() || !payload.customer.phone.trim()) {
    throw new Error('Vui lòng cung cấp đầy đủ tên và số điện thoại người nhận.');
  }

  const itemsTotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCalories = payload.items.reduce((sum, item) => sum + item.calories * item.quantity, 0);
  const totalProtein = payload.items.reduce((sum, item) => sum + item.protein * item.quantity, 0);

  // Phí vận chuyển theo chính sách tự động: Tiền hàng >= 300k miễn phí ship (standard)
  const isExpress = payload.shippingMethod === 'express_2h';
  let shippingFee = 25000;
  if (isExpress) {
    shippingFee = 35000;
  } else if (itemsTotal >= 300000) {
    shippingFee = 0;
  }

  // Voucher discount tính toán thông qua voucherService
  let discountAmount = 0;
  let appliedCode: string | undefined = undefined;

  if (payload.voucherCode && payload.voucherCode.trim()) {
    const rawCode = payload.voucherCode.trim().toUpperCase();
    const customerId = payload.customer.phone || payload.customer.email || undefined;
    const validation = await voucherService.validateVoucher(rawCode, itemsTotal, customerId);

    if (validation.isValid) {
      discountAmount = validation.discountAmount;
      appliedCode = validation.voucher?.code || rawCode;
    } else {
      console.warn(`[OrderService] Voucher ${rawCode} không hợp lệ: ${validation.message}`);
    }
  }

  const totalAmount = Math.max(0, itemsTotal + shippingFee - discountAmount);
  const orderCode = `NM-${Math.floor(100000 + Math.random() * 900000)}`;

  const order: Order = {
    id: `ord-${Date.now()}`,
    orderCode,
    createdAt: new Date().toISOString(),
    customer: payload.customer,
    items: payload.items,
    totalAmount,
    totalCalories: Math.round(totalCalories * 10) / 10,
    totalProtein: Math.round(totalProtein * 10) / 10,
    shippingFee,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
    voucherCode: appliedCode,
    shippingMethod: payload.shippingMethod || 'standard',
    paymentMethod: payload.paymentMethod || 'vietqr',
    paymentStatus: 'pending',
    status: 'pending',
    notes: payload.notes,
  };

  const savedOrder = await orderRepo.createOrder(order);

  // Ghi nhận lượt sử dụng voucher nếu có áp dụng
  if (appliedCode && discountAmount > 0) {
    try {
      await voucherService.recordVoucherUsage(appliedCode);
    } catch (err: unknown) {
      console.warn('[OrderService Voucher Usage Error]:', err);
    }
  }

  return savedOrder;
}

const QR_PAYMENT_TIMEOUT_MS = 30 * 60 * 1000; // 30 phút

/**
 * Tự động hủy các đơn hàng thanh toán qua QR (VietQR / MoMo) quá 30 phút không hoàn tất thanh toán
 */
export async function autoCancelExpiredOrders(): Promise<number> {
  try {
    const orders = await orderRepo.getAllOrders();
    const now = Date.now();
    let cancelledCount = 0;

    for (const order of orders) {
      const isPending = order.status === 'pending' && order.paymentStatus === 'pending';
      const isQrPayment = order.paymentMethod === 'vietqr' || order.paymentMethod === 'momo';
      if (!isPending || !isQrPayment) continue;

      const createdAtTime = new Date(order.createdAt).getTime();
      if (!isNaN(createdAtTime) && now - createdAtTime >= QR_PAYMENT_TIMEOUT_MS) {
        const cancelReason = order.notes
          ? `${order.notes} | [Hệ thống tự động hủy do quá hạn 30 phút thanh toán QR]`
          : '[Hệ thống tự động hủy do quá hạn 30 phút thanh toán QR]';

        await orderRepo.updateOrderStatus(order.id, 'cancelled', cancelReason);

        if (order.voucherCode) {
          try {
            await voucherService.releaseVoucherUsage(order.voucherCode);
          } catch (err: unknown) {
            console.warn(`[OrderService] Release voucher ${order.voucherCode} error:`, err);
          }
        }
        cancelledCount++;
      }
    }

    return cancelledCount;
  } catch (err: unknown) {
    console.warn('[OrderService autoCancelExpiredOrders error]:', err);
    return 0;
  }
}

export async function getOrders(): Promise<Order[]> {
  await autoCancelExpiredOrders();
  return orderRepo.getAllOrders();
}

export async function getOrderById(id: string): Promise<Order | null> {
  const order = await orderRepo.getOrderById(id);
  if (order) {
    const isPending = order.status === 'pending' && order.paymentStatus === 'pending';
    const isQrPayment = order.paymentMethod === 'vietqr' || order.paymentMethod === 'momo';
    const createdAtTime = new Date(order.createdAt).getTime();
    if (isPending && isQrPayment && !isNaN(createdAtTime) && Date.now() - createdAtTime >= QR_PAYMENT_TIMEOUT_MS) {
      const cancelReason = order.notes
        ? `${order.notes} | [Hệ thống tự động hủy do quá hạn 30 phút thanh toán QR]`
        : '[Hệ thống tự động hủy do quá hạn 30 phút thanh toán QR]';
      const cancelled = await orderRepo.updateOrderStatus(order.id, 'cancelled', cancelReason);
      if (order.voucherCode) {
        await voucherService.releaseVoucherUsage(order.voucherCode).catch(() => {});
      }
      return cancelled;
    }
  }
  return order;
}

export async function updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
  return orderRepo.updateOrderStatus(id, status);
}

export async function cancelOrder(id: string, reason?: string): Promise<Order | null> {
  const order = await orderRepo.getOrderById(id);
  if (!order) {
    throw new Error('Đơn hàng không tồn tại trên hệ thống');
  }

  if (order.status !== 'pending') {
    throw new Error('Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái chờ xác nhận');
  }

  const cancelNote = reason
    ? (order.notes ? `${order.notes} | [Lý do hủy: ${reason}]` : `[Lý do hủy: ${reason}]`)
    : (order.notes ? `${order.notes} | [Khách hàng yêu cầu hủy đơn]` : '[Khách hàng yêu cầu hủy đơn]');

  const updated = await orderRepo.updateOrderStatus(order.id, 'cancelled', cancelNote);

  // Hoàn lại voucher nếu có
  if (order.voucherCode) {
    try {
      await voucherService.releaseVoucherUsage(order.voucherCode);
    } catch (err: unknown) {
      console.warn(`[OrderService] Release voucher on cancel error:`, err);
    }
  }

  return updated;
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  status?: OrderStatus
): Promise<Order | null> {
  return orderRepo.updateOrderPaymentStatus(id, paymentStatus, status);
}
