import { Request, Response } from 'express';
import * as orderService from '../services/orderService.js';
import { ApiResponse, Order, CreateOrderPayload, OrderStatus } from '../types/index.js';

export async function createOrder(req: Request, res: Response<ApiResponse<Order>>): Promise<void> {
  try {
    const payload = req.body as CreateOrderPayload;
    const order = await orderService.createOrder(payload);
    res.status(201).json({
      success: true,
      message: `Đặt hàng thành công! Mã đơn: ${order.orderCode}`,
      data: order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi tạo đơn hàng';
    res.status(400).json({ success: false, message });
  }
}

export async function getOrders(_req: Request, res: Response<ApiResponse<Order[]>>): Promise<void> {
  try {
    const orders = await orderService.getOrders();
    res.json({
      success: true,
      total: orders.length,
      data: orders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi tải danh sách đơn hàng';
    res.status(500).json({ success: false, message });
  }
}

export async function getOrderById(req: Request<{ id: string }>, res: Response<ApiResponse<Order>>): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng yêu cầu' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi tra cứu đơn hàng';
    res.status(500).json({ success: false, message });
  }
}

export async function updateOrderStatus(
  req: Request<{ id: string }, ApiResponse<Order>, { status?: OrderStatus }>,
  res: Response<ApiResponse<Order>>
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: 'Thiếu trạng thái đơn hàng' });
      return;
    }
    const updated = await orderService.updateStatus(id, status);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng để cập nhật' });
      return;
    }
    res.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng ${updated.orderCode} sang ${status}`,
      data: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái đơn hàng';
    res.status(500).json({ success: false, message });
  }
}
