import { Order, OrderItem, OrderStatus } from '../types/index.js';
import { INITIAL_ORDERS } from '../db/seedData.js';
import { isDbConnected, queryPostgres, getPool } from '../db/index.js';

let memoryOrders: Order[] = [...INITIAL_ORDERS];

interface OrderRow {
  id: string;
  order_code: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: string;
  total_calories: string;
  total_protein: string;
  shipping_fee: string;
  notes: string | null;
}

interface OrderItemRow {
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  unit_price: string;
  quantity: number;
  calories: string;
  protein: string;
}

export async function getAllOrders(): Promise<Order[]> {
  if (isDbConnected()) {
    try {
      const ordersSql = `
        SELECT id, order_code, created_at, customer_name, customer_phone,
               customer_email, shipping_address, payment_method, payment_status,
               status, total_amount, total_calories, total_protein, shipping_fee, notes
        FROM orders
        ORDER BY created_at DESC
      `;
      const ordersResult = await queryPostgres<OrderRow>(ordersSql);

      if (ordersResult.rows.length === 0) {
        return [];
      }

      // Tránh N+1: Lấy tất cả items của các order trong 1 query duy nhất
      const orderIds = ordersResult.rows.map((r) => r.id);
      const itemsSql = `
        SELECT order_id, product_id, product_name, product_image,
               unit_price, quantity, calories, protein
        FROM order_items
        WHERE order_id = ANY($1::int[])
      `;
      const itemsResult = await queryPostgres<OrderItemRow>(itemsSql, [orderIds]);

      const itemsByOrderId = new Map<string, OrderItem[]>();
      for (const itemRow of itemsResult.rows) {
        const list = itemsByOrderId.get(String(itemRow.order_id)) || [];
        list.push({
          productId: String(itemRow.product_id),
          productName: itemRow.product_name,
          productImage: itemRow.product_image || '',
          price: parseFloat(itemRow.unit_price),
          quantity: itemRow.quantity,
          calories: parseFloat(itemRow.calories),
          protein: parseFloat(itemRow.protein),
        });
        itemsByOrderId.set(String(itemRow.order_id), list);
      }

      return ordersResult.rows.map((row) => ({
        id: String(row.id),
        orderCode: row.order_code,
        createdAt: row.created_at,
        customer: {
          name: row.customer_name,
          phone: row.customer_phone,
          email: row.customer_email,
          address: row.shipping_address,
        },
        items: itemsByOrderId.get(String(row.id)) || [],
        totalAmount: parseFloat(row.total_amount),
        totalCalories: parseFloat(row.total_calories),
        totalProtein: parseFloat(row.total_protein),
        shippingFee: parseFloat(row.shipping_fee),
        paymentMethod: row.payment_method as Order['paymentMethod'],
        paymentStatus: row.payment_status as Order['paymentStatus'],
        status: row.status as OrderStatus,
        notes: row.notes || undefined,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Orders query error';
      console.warn('[OrderRepository GetAll Fallback]:', msg);
    }
  }

  return memoryOrders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (isDbConnected()) {
    try {
      const orderSql = `
        SELECT id, order_code, created_at, customer_name, customer_phone,
               customer_email, shipping_address, payment_method, payment_status,
               status, total_amount, total_calories, total_protein, shipping_fee, notes
        FROM orders
        WHERE id::text = $1 OR order_code = $1
        LIMIT 1
      `;
      const orderRes = await queryPostgres<OrderRow>(orderSql, [id]);
      const orderRow = orderRes.rows[0];
      if (!orderRow) return null;

      const itemsSql = `
        SELECT order_id, product_id, product_name, product_image,
               unit_price, quantity, calories, protein
        FROM order_items
        WHERE order_id = $1
      `;
      const itemsRes = await queryPostgres<OrderItemRow>(itemsSql, [orderRow.id]);
      const items: OrderItem[] = itemsRes.rows.map((itemRow) => ({
        productId: String(itemRow.product_id),
        productName: itemRow.product_name,
        productImage: itemRow.product_image || '',
        price: parseFloat(itemRow.unit_price),
        quantity: itemRow.quantity,
        calories: parseFloat(itemRow.calories),
        protein: parseFloat(itemRow.protein),
      }));

      return {
        id: String(orderRow.id),
        orderCode: orderRow.order_code,
        createdAt: orderRow.created_at,
        customer: {
          name: orderRow.customer_name,
          phone: orderRow.customer_phone,
          email: orderRow.customer_email,
          address: orderRow.shipping_address,
        },
        items,
        totalAmount: parseFloat(orderRow.total_amount),
        totalCalories: parseFloat(orderRow.total_calories),
        totalProtein: parseFloat(orderRow.total_protein),
        shippingFee: parseFloat(orderRow.shipping_fee),
        paymentMethod: orderRow.payment_method as Order['paymentMethod'],
        paymentStatus: orderRow.payment_status as Order['paymentStatus'],
        status: orderRow.status as OrderStatus,
        notes: orderRow.notes || undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order get by id error';
      console.warn('[OrderRepository GetById Fallback]:', msg);
    }
  }

  const found = memoryOrders.find((o) => o.id === id || o.orderCode === id);
  return found || null;
}

export async function createOrder(order: Order): Promise<Order> {
  if (isDbConnected()) {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      const orderSql = `
        INSERT INTO orders (
          order_code, customer_name, customer_phone, customer_email,
          shipping_address, payment_method, payment_status, status,
          total_amount, total_calories, total_protein, shipping_fee, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `;
      const orderValues = [
        order.orderCode,
        order.customer.name,
        order.customer.phone,
        order.customer.email,
        order.customer.address,
        order.paymentMethod,
        order.paymentStatus,
        order.status,
        order.totalAmount,
        order.totalCalories,
        order.totalProtein,
        order.shippingFee,
        order.notes || null,
      ];
      const res = await client.query<{ id: number }>(orderSql, orderValues);
      const insertedOrder = res.rows[0];
      if (insertedOrder) {
        order.id = String(insertedOrder.id);
      }

      for (const item of order.items) {
        const itemSql = `
          INSERT INTO order_items (
            order_id, product_name, product_image,
            unit_price, quantity, calories, protein, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        const subtotal = item.price * item.quantity;
        await client.query(itemSql, [
          order.id,
          item.productName,
          item.productImage,
          item.price,
          item.quantity,
          item.calories,
          item.protein,
          subtotal,
        ]);
      }

      await client.query('COMMIT');
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      const msg = err instanceof Error ? err.message : 'Create order error';
      console.warn('[OrderRepository Create Fallback]:', msg);
    } finally {
      client.release();
    }
  }

  memoryOrders.unshift(order);
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  if (isDbConnected()) {
    try {
      const sql = `
        UPDATE orders
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id::text = $2 OR order_code = $2
        RETURNING id
      `;
      const res = await queryPostgres(sql, [status, id]);
      if (res.rowCount && res.rowCount > 0) {
        return getOrderById(id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update order status error';
      console.warn('[OrderRepository UpdateStatus Fallback]:', msg);
    }
  }

  const order = memoryOrders.find((o) => o.id === id || o.orderCode === id);
  if (order) {
    order.status = status;
    return order;
  }
  return null;
}
