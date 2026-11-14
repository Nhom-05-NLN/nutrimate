import { Order, OrderItem, OrderStatus, PaymentStatus } from '../types/index.js';
import { INITIAL_ORDERS } from '../db/seedData.js';
import { isDbConnected, queryPostgres, getPool } from '../db/index.js';

let memoryOrders: Order[] = [...INITIAL_ORDERS];

export interface ChatOrderSummary {
  orderCode: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items: { productName: string; quantity: number }[];
}

interface ChatOrderRow {
  order_id: number;
  order_code: string;
  order_date: string;
  status: string;
  payment_status: string;
  total_amount: string;
}

interface ChatOrderItemRow {
  product_name: string;
  quantity: number;
}

async function getChatOrderItems(
  orderId: number,
  executeQuery: typeof queryPostgres,
): Promise<{ productName: string; quantity: number }[]> {
  const result = await executeQuery<ChatOrderItemRow>(
    `SELECT product_name, quantity
     FROM order_items
     WHERE order_id = $1
     ORDER BY order_item_id`,
    [orderId],
  );
  return result.rows.map(item => ({ productName: item.product_name, quantity: item.quantity }));
}

function toChatOrderSummary(order: ChatOrderRow): Omit<ChatOrderSummary, 'items'> {
  return {
    orderCode: order.order_code,
    createdAt: order.order_date,
    status: order.status,
    paymentStatus: order.payment_status,
    totalAmount: Number(order.total_amount),
  };
}

export async function findChatOrderByCode(
  orderCode: string,
  userId: number,
  executeQuery: typeof queryPostgres = queryPostgres,
): Promise<ChatOrderSummary | null> {
  const cleanCode = orderCode.trim().toUpperCase().replace(/^#/, '');
  let result = await executeQuery<ChatOrderRow>(
    `SELECT order_id, order_code, order_date, status, payment_status, total_amount
     FROM orders
     WHERE (UPPER(order_code) = $1 OR UPPER(order_code) = '#' || $1)
       AND (user_id = $2 OR customer_id = $2)
     LIMIT 1`,
    [cleanCode, userId],
  );
  if (!result.rows[0]) {
    result = await executeQuery<ChatOrderRow>(
      `UPDATE orders AS order_row
       SET user_id = account.id, customer_id = account.id
       FROM users AS account
       WHERE (UPPER(order_row.order_code) = $1 OR UPPER(order_row.order_code) = '#' || $1)
         AND account.id = $2
         AND account.role = 'customer'
         AND order_row.user_id IS NULL
         AND order_row.customer_id IS NULL
         AND LENGTH(BTRIM(COALESCE(order_row.customer_phone, order_row.receiver_phone, ''))) > 0
         AND (
           LENGTH(BTRIM(COALESCE(order_row.customer_email, order_row.receiver_email, ''))) > 0
           OR LENGTH(BTRIM(COALESCE(order_row.customer_name, order_row.receiver_name, ''))) > 0
         )
         AND (
           (
             LOWER(BTRIM(COALESCE(order_row.customer_email, order_row.receiver_email))) = LOWER(BTRIM(account.email))
             AND REGEXP_REPLACE(COALESCE(order_row.customer_phone, order_row.receiver_phone), '[^0-9]', '', 'g')
                 = REGEXP_REPLACE(account.phone, '[^0-9]', '', 'g')
           )
           OR (
             LOWER(BTRIM(COALESCE(order_row.customer_name, order_row.receiver_name))) = LOWER(BTRIM(account.full_name))
             AND REGEXP_REPLACE(COALESCE(order_row.customer_phone, order_row.receiver_phone), '[^0-9]', '', 'g')
                 = REGEXP_REPLACE(account.phone, '[^0-9]', '', 'g')
           )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM users AS other_account
           WHERE other_account.id <> account.id
             AND other_account.role = 'customer'
             AND (
               (
                 LOWER(BTRIM(COALESCE(order_row.customer_email, order_row.receiver_email))) = LOWER(BTRIM(other_account.email))
                 AND REGEXP_REPLACE(COALESCE(order_row.customer_phone, order_row.receiver_phone), '[^0-9]', '', 'g')
                     = REGEXP_REPLACE(other_account.phone, '[^0-9]', '', 'g')
               )
               OR (
                 LOWER(BTRIM(COALESCE(order_row.customer_name, order_row.receiver_name))) = LOWER(BTRIM(other_account.full_name))
                 AND REGEXP_REPLACE(COALESCE(order_row.customer_phone, order_row.receiver_phone), '[^0-9]', '', 'g')
                     = REGEXP_REPLACE(other_account.phone, '[^0-9]', '', 'g')
               )
             )
         )
       RETURNING order_row.order_id, order_row.order_code, order_row.order_date,
                 order_row.status, order_row.payment_status, order_row.total_amount`,
      [cleanCode, userId],
    );
  }
  const order = result.rows[0];
  if (!order) return null;

  return {
    ...toChatOrderSummary(order),
    items: await getChatOrderItems(order.order_id, executeQuery),
  };
}

interface OrderRow {
  id: string;
  order_code: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  shipping_method?: string | null;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: string;
  total_calories: string;
  total_protein: string;
  shipping_fee: string;
  discount_amount?: string | null;
  voucher_code?: string | null;
  notes: string | null;
  user_id?: number | string | null;
  customer_id?: number | string | null;
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
  is_ai_recommended: boolean;
}

export async function getOrdersByUser(userId: number | null): Promise<Order[]> {
  if (isDbConnected()) {
    try {
      let isAdmin = false;
      if (userId) {
        const userRes = await queryPostgres<{ role: string }>(
          `SELECT CASE
             WHEN EXISTS (SELECT 1 FROM admins WHERE user_id = $1) THEN 'admin'
             ELSE 'customer'
           END AS role`,
          [userId],
        );
        isAdmin = userRes.rows[0]?.role === 'admin';
      }

      // Khách chưa đăng nhập: không xem đơn hàng của người khác
      if (!userId) {
        return [];
      }

      const ordersSql = isAdmin
        ? `
          SELECT id, order_code, created_at, customer_name, customer_phone,
                 customer_email, shipping_address, shipping_method, payment_method, payment_status,
                 status, total_amount, total_calories, total_protein, shipping_fee,
                 discount_amount, voucher_code, notes, user_id, customer_id
          FROM orders
          ORDER BY created_at DESC, id DESC
        `
        : `
          SELECT id, order_code, created_at, customer_name, customer_phone,
                 customer_email, shipping_address, shipping_method, payment_method, payment_status,
                 status, total_amount, total_calories, total_protein, shipping_fee,
                 discount_amount, voucher_code, notes, user_id, customer_id
          FROM orders
          WHERE user_id = $1
             OR customer_id = $1
             OR (
               customer_phone IS NOT NULL
               AND REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g') = (SELECT REGEXP_REPLACE(phone, '[^0-9]', '', 'g') FROM users WHERE id = $1)
             )
             OR (
               customer_email IS NOT NULL
               AND LOWER(BTRIM(customer_email)) = (SELECT LOWER(BTRIM(email)) FROM users WHERE id = $1)
             )
          ORDER BY created_at DESC, id DESC
        `;
      const params = isAdmin ? [] : [userId];
      const ordersResult = await queryPostgres<OrderRow>(ordersSql, params);

      if (ordersResult.rows.length === 0) {
        return [];
      }

      const orderIds = ordersResult.rows.map((r) => r.id);
      const itemsSql = `
        SELECT order_id, product_id, product_name, product_image,
               unit_price, quantity, calories, protein, is_ai_recommended
        FROM order_items
        WHERE order_id = ANY($1::int[])
      `;
      const itemsResult = await queryPostgres<OrderItemRow>(itemsSql, [orderIds]);

      const itemsByOrderId = new Map<string, OrderItem[]>();
      for (const itemRow of itemsResult.rows) {
        const list = itemsByOrderId.get(String(itemRow.order_id)) || [];
        const rawId = itemRow.product_id;
        const resolvedId = (rawId !== null && rawId !== undefined && String(rawId) !== 'null')
          ? String(rawId)
          : (itemRow.product_name ? `prod-${encodeURIComponent(itemRow.product_name)}` : '');
        list.push({
          productId: resolvedId,
          productName: itemRow.product_name,
          productImage: itemRow.product_image || '',
          price: parseFloat(itemRow.unit_price),
          quantity: itemRow.quantity,
          calories: parseFloat(itemRow.calories),
          protein: parseFloat(itemRow.protein),
          isAiRecommended: itemRow.is_ai_recommended,
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
        discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : undefined,
        voucherCode: row.voucher_code || undefined,
        shippingMethod: (row.shipping_method as Order['shippingMethod']) || 'standard',
        paymentMethod: row.payment_method as Order['paymentMethod'],
        paymentStatus:
          row.status === 'delivered' && row.payment_method?.toLowerCase() === 'cod'
            ? 'paid'
            : (row.payment_status as Order['paymentStatus']),
        status: row.status as OrderStatus,
        notes: row.notes || undefined,
        userId: row.user_id ? String(row.user_id) : undefined,
        customerId: row.customer_id ? String(row.customer_id) : undefined,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Orders query error';
      console.warn('[OrderRepository GetOrdersByUser Fallback]:', msg);
    }
  }

  if (!userId) return [];
  return memoryOrders;
}

export async function getAllOrders(): Promise<Order[]> {
  if (isDbConnected()) {
    try {
      const ordersSql = `
        SELECT id, order_code, created_at, customer_name, customer_phone,
               customer_email, shipping_address, shipping_method, payment_method, payment_status,
               status, total_amount, total_calories, total_protein, shipping_fee,
               discount_amount, voucher_code, notes, user_id, customer_id
        FROM orders
        ORDER BY created_at DESC, id DESC
      `;
      const ordersResult = await queryPostgres<OrderRow>(ordersSql);

      if (ordersResult.rows.length === 0) {
        return [];
      }

      // Tránh N+1: Lấy tất cả items của các order trong 1 query duy nhất
      const orderIds = ordersResult.rows.map((r) => r.id);
      const itemsSql = `
        SELECT order_id, product_id, product_name, product_image,
               unit_price, quantity, calories, protein, is_ai_recommended
        FROM order_items
        WHERE order_id = ANY($1::int[])
      `;
      const itemsResult = await queryPostgres<OrderItemRow>(itemsSql, [orderIds]);

      const itemsByOrderId = new Map<string, OrderItem[]>();
      for (const itemRow of itemsResult.rows) {
        const list = itemsByOrderId.get(String(itemRow.order_id)) || [];
        const rawId = itemRow.product_id;
        const resolvedId = (rawId !== null && rawId !== undefined && String(rawId) !== 'null')
          ? String(rawId)
          : (itemRow.product_name ? `prod-${encodeURIComponent(itemRow.product_name)}` : '');
        list.push({
          productId: resolvedId,
          productName: itemRow.product_name,
          productImage: itemRow.product_image || '',
          price: parseFloat(itemRow.unit_price),
          quantity: itemRow.quantity,
          calories: parseFloat(itemRow.calories),
          protein: parseFloat(itemRow.protein),
          isAiRecommended: itemRow.is_ai_recommended,
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
        discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : undefined,
        voucherCode: row.voucher_code || undefined,
        shippingMethod: (row.shipping_method as Order['shippingMethod']) || 'standard',
        paymentMethod: row.payment_method as Order['paymentMethod'],
        paymentStatus:
          row.status === 'delivered' && row.payment_method?.toLowerCase() === 'cod'
            ? 'paid'
            : (row.payment_status as Order['paymentStatus']),
        status: row.status as OrderStatus,
        notes: row.notes || undefined,
        userId: row.user_id ? String(row.user_id) : undefined,
        customerId: row.customer_id ? String(row.customer_id) : undefined,
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
               customer_email, shipping_address, shipping_method, payment_method, payment_status,
               status, total_amount, total_calories, total_protein, shipping_fee,
               discount_amount, voucher_code, notes
        FROM orders
        WHERE id::text = $1 OR order_code = $1
        LIMIT 1
      `;
      const orderRes = await queryPostgres<OrderRow>(orderSql, [id]);
      const orderRow = orderRes.rows[0];
      if (!orderRow) return null;

      const itemsSql = `
        SELECT order_id, product_id, product_name, product_image,
               unit_price, quantity, calories, protein, is_ai_recommended
        FROM order_items
        WHERE order_id = $1
      `;
      const itemsRes = await queryPostgres<OrderItemRow>(itemsSql, [orderRow.id]);
      const items: OrderItem[] = itemsRes.rows.map((itemRow) => {
        const rawId = itemRow.product_id;
        const resolvedId = (rawId !== null && rawId !== undefined && String(rawId) !== 'null')
          ? String(rawId)
          : (itemRow.product_name ? `prod-${encodeURIComponent(itemRow.product_name)}` : '');
        return {
          productId: resolvedId,
          productName: itemRow.product_name,
          productImage: itemRow.product_image || '',
          price: parseFloat(itemRow.unit_price),
          quantity: itemRow.quantity,
          calories: parseFloat(itemRow.calories),
          protein: parseFloat(itemRow.protein),
          isAiRecommended: itemRow.is_ai_recommended,
        };
      });

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
        discountAmount: orderRow.discount_amount ? parseFloat(orderRow.discount_amount) : undefined,
        voucherCode: orderRow.voucher_code || undefined,
        shippingMethod: (orderRow.shipping_method as Order['shippingMethod']) || 'standard',
        paymentMethod: orderRow.payment_method as Order['paymentMethod'],
        paymentStatus:
          orderRow.status === 'delivered' && orderRow.payment_method?.toLowerCase() === 'cod'
            ? 'paid'
            : (orderRow.payment_status as Order['paymentStatus']),
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

export async function createOrder(order: Order, ownerUserId: number | null = null): Promise<Order> {
  if (isDbConnected()) {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      const orderSql = `
        INSERT INTO orders (
          user_id, customer_id, order_code, customer_name, customer_phone, customer_email,
          receiver_name, receiver_phone, receiver_email,
          shipping_address, shipping_method, payment_method, payment_status, status,
          total_amount, total_calories, total_protein, shipping_fee,
          discount_amount, voucher_code, notes
        ) VALUES (
          $1,
          CASE WHEN $1::int IS NOT NULL AND EXISTS (SELECT 1 FROM customers WHERE user_id = $1::int) THEN $1::int ELSE NULL END,
          $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING order_id, id
      `;
      const orderValues = [
        ownerUserId,
        order.orderCode,
        order.customer.name,
        order.customer.phone,
        order.customer.email || null,
        order.customer.name,
        order.customer.phone,
        order.customer.email || null,
        order.customer.address,
        order.shippingMethod || 'standard',
        order.paymentMethod,
        order.paymentStatus,
        order.status,
        order.totalAmount,
        order.totalCalories,
        order.totalProtein,
        order.shippingFee,
        order.discountAmount || 0,
        order.voucherCode || null,
        order.notes || null,
      ];
      const res = await client.query<{ id?: number; order_id?: number }>(orderSql, orderValues);
      const insertedOrder = res.rows[0];
      if (insertedOrder) {
        const resolvedDbId = insertedOrder.order_id || insertedOrder.id;
        order.id = String(resolvedDbId);
        await client.query('UPDATE orders SET id = order_id WHERE order_id = $1 AND id IS NULL', [resolvedDbId]);
      }

      for (const item of order.items) {
        const itemSql = `
          INSERT INTO order_items (
            order_id, product_id, product_name, product_image,
            unit_price, quantity, calories, protein, subtotal, is_ai_recommended
          ) VALUES (
            $1,
            CASE WHEN $2::int IS NOT NULL AND EXISTS (SELECT 1 FROM products WHERE product_id = $2::int) THEN $2::int ELSE NULL END,
            $3, $4, $5, $6, $7, $8, $9, $10
          )
        `;
        const subtotal = item.price * item.quantity;
        const parsedProdId = item.productId && !isNaN(Number(item.productId)) ? Number(item.productId) : null;
        await client.query(itemSql, [
          Number(order.id),
          parsedProdId,
          item.productName,
          item.productImage,
          item.price,
          item.quantity,
          item.calories,
          item.protein,
          subtotal,
          item.isAiRecommended === true,
        ]);
      }

      await client.query(
        `INSERT INTO admin_notifications (type, title, message, customer_id)
         VALUES ('order_placed', 'Đơn hàng mới', $1, $2)`,
        [
          `Đơn hàng #${order.orderCode} của ${order.customer.name} (${order.totalAmount.toLocaleString('vi-VN')}đ) vừa được đặt.`,
          ownerUserId,
        ],
      );

      await client.query('COMMIT');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('[OrderRepository Create Failed]:', errMsg);
      try {
        await client.query('ROLLBACK');
      } catch {
        console.warn('[OrderRepository Create Failed]: transaction rollback failed');
      }
      throw new Error('Không thể lưu đơn hàng. Vui lòng thử lại.');
    } finally {
      client.release();
    }
  }

  memoryOrders.unshift(order);
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<Order | null> {
  if (isDbConnected()) {
    try {
      const sql = `
        UPDATE orders
        SET status = $1::varchar,
            payment_status = CASE
              WHEN $1::varchar = 'delivered' AND LOWER(payment_method) = 'cod' THEN 'paid'
              ELSE payment_status
            END,
            notes = COALESCE($3, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id::text = $2 OR order_code = $2
        RETURNING id
      `;
      const res = await queryPostgres(sql, [status, id, notes || null]);
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
    if (status === 'delivered' && order.paymentMethod?.toLowerCase() === 'cod') {
      order.paymentStatus = 'paid';
    }
    if (notes) {
      order.notes = notes;
    }
    return order;
  }
  return null;
}

export async function updateOrderPaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  status?: OrderStatus
): Promise<Order | null> {
  if (isDbConnected()) {
    try {
      const sql = `
        UPDATE orders
        SET payment_status = $1,
            status = COALESCE($2, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id::text = $3 OR order_code = $3
        RETURNING id
      `;
      const res = await queryPostgres(sql, [paymentStatus, status || null, id]);
      if (res.rowCount && res.rowCount > 0) {
        return getOrderById(id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update payment status error';
      console.warn('[OrderRepository UpdatePaymentStatus Fallback]:', msg);
    }
  }

  const order = memoryOrders.find((o) => o.id === id || o.orderCode === id);
  if (order) {
    order.paymentStatus = paymentStatus;
    if (status) {
      order.status = status;
    }
    return order;
  }
  return null;
}
