import { Order, CreateOrderPayload, OrderStatus, PaymentStatus } from '../types/index.js';
import * as orderRepo from '../repositories/orderRepository.js';

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Giỏ hàng không được để trống khi đặt hàng.');
  }

  if (!payload.customer || !payload.customer.name.trim() || !payload.customer.phone.trim()) {
    throw new Error('Vui lòng cung cấp đầy đủ tên và số điện thoại người nhận.');
  }

  const isExpress = payload.shippingMethod === 'express_2h';
  const shippingFee = isExpress ? 35000 : 25000;
  const itemsTotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCalories = payload.items.reduce((sum, item) => sum + item.calories * item.quantity, 0);
  const totalProtein = payload.items.reduce((sum, item) => sum + item.protein * item.quantity, 0);

  // Voucher discount tính toán
  let discountAmount = 0;
  if (payload.voucherCode) {
    const code = payload.voucherCode.trim().toUpperCase();
    if (code === 'NUTRIFREESHIP' || code === 'FREESHIP') {
      discountAmount = Math.min(shippingFee, 25000);
    } else if (code === 'HEALTHY20K') {
      discountAmount = 20000;
    } else if (code === 'CLEANEAT10') {
      discountAmount = Math.round(itemsTotal * 0.1);
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
    voucherCode: payload.voucherCode,
    shippingMethod: payload.shippingMethod || 'standard',
    paymentMethod: payload.paymentMethod || 'vietqr',
    paymentStatus: payload.paymentMethod === 'vietqr' ? 'pending' : 'pending',
    status: 'pending',
    notes: payload.notes,
  };

  return orderRepo.createOrder(order);
}

export async function getOrders(): Promise<Order[]> {
  return orderRepo.getAllOrders();
}

export async function getOrderById(id: string): Promise<Order | null> {
  return orderRepo.getOrderById(id);
}

export async function updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
  return orderRepo.updateOrderStatus(id, status);
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  status?: OrderStatus
): Promise<Order | null> {
  return orderRepo.updateOrderPaymentStatus(id, paymentStatus, status);
}
