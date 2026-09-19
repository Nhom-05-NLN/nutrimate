import { Order, CreateOrderPayload, OrderStatus } from '../types/index.js';
import * as orderRepo from '../repositories/orderRepository.js';

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Giỏ hàng không được để trống khi đặt hàng.');
  }

  if (!payload.customer || !payload.customer.name.trim() || !payload.customer.phone.trim()) {
    throw new Error('Vui lòng cung cấp đầy đủ tên và số điện thoại người nhận.');
  }

  const shippingFee = 25000;
  const itemsTotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCalories = payload.items.reduce((sum, item) => sum + item.calories * item.quantity, 0);
  const totalProtein = payload.items.reduce((sum, item) => sum + item.protein * item.quantity, 0);

  const orderCode = `NM-${Math.floor(100000 + Math.random() * 900000)}`;

  const order: Order = {
    id: `ord-${Date.now()}`,
    orderCode,
    createdAt: new Date().toISOString(),
    customer: payload.customer,
    items: payload.items,
    totalAmount: itemsTotal + shippingFee,
    totalCalories: Math.round(totalCalories * 10) / 10,
    totalProtein: Math.round(totalProtein * 10) / 10,
    shippingFee,
    paymentMethod: payload.paymentMethod || 'vietqr',
    paymentStatus: payload.paymentMethod === 'vietqr' ? 'paid' : 'pending',
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
