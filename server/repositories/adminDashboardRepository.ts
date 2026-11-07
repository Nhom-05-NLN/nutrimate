import { getPool, isDbConnected } from '../db/index.js';
import { AdminDashboardData } from '../types/adminDashboard.js';

const LOW_STOCK_THRESHOLD = 30;

interface SummaryRow {
  weekly_revenue: string;
  previous_week_revenue: string;
  total_orders: string;
  delivered_orders: string;
  pending_orders: string;
  total_customers: string;
  new_customers: string;
  customers_with_bmi: string;
  weekly_chat_messages: string;
}

interface WeeklySalesRow {
  date: string;
  revenue: string;
  orders: string;
}

interface CategorySalesRow {
  name: string;
  units_sold: string;
}

interface UrgentOrderRow {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  main_product: string | null;
  total_amount: string;
  payment_method: string;
  status: string;
}

interface LowStockRow {
  id: number;
  code: string;
  name: string;
  stock_quantity: number;
}

function toNumber(value: string): number {
  return Number(value) || 0;
}

export async function getAdminDashboard(weekStart: string): Promise<AdminDashboardData> {
  if (!isDbConnected()) {
    throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  }

  const pool = getPool();
  const [productColumnsResult, categoryColumnsResult] = await Promise.all([
    pool.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'products'`,
    ),
    pool.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'categories'`,
    ),
  ]);
  const productColumns = new Set(productColumnsResult.rows.map((row) => row.column_name));
  const categoryColumns = new Set(categoryColumnsResult.rows.map((row) => row.column_name));
  const productIdColumn = productColumns.has('id')
    ? 'id'
    : productColumns.has('product_id')
      ? 'product_id'
      : null;
  const productActiveColumn = productColumns.has('is_active')
    ? 'is_active'
    : productColumns.has('status')
      ? 'status'
      : null;
  const categoryIdColumn = productIdColumn === 'product_id' && categoryColumns.has('category_id')
    ? 'category_id'
    : categoryColumns.has('id')
      ? 'id'
      : null;

  if (!productIdColumn || !productActiveColumn) {
    throw new Error('Bảng products thiếu cột mã hoặc trạng thái sản phẩm cần cho dashboard.');
  }
  if (!productColumns.has('category_name') && !categoryIdColumn) {
    throw new Error('Không tìm thấy cột danh mục sản phẩm cần cho dashboard.');
  }

  const categoryName = productColumns.has('category_name')
    ? 'products.category_name'
    : 'categories.name';
  const categoryJoin = productColumns.has('category_name')
    ? ''
    : `JOIN categories ON categories.${categoryIdColumn} = products.category_id`;
  const [
    summaryResult,
    weeklySalesResult,
    categorySalesResult,
    urgentOrdersResult,
    lowStockResult,
  ] = await Promise.all([
    pool.query<SummaryRow>(
      `WITH selected_week AS (
         SELECT $1::date AS week_start,
                LEAST($1::date + INTERVAL '7 days', CURRENT_DATE + INTERVAL '1 day') AS period_end
       )
       SELECT
         (SELECT COALESCE(SUM(total_amount), 0)
          FROM orders
          WHERE status = 'delivered'
            AND created_at >= selected_week.week_start
            AND created_at < selected_week.period_end)::text AS weekly_revenue,
         (SELECT COALESCE(SUM(total_amount), 0)
          FROM orders
          WHERE status = 'delivered'
            AND created_at >= selected_week.week_start - INTERVAL '7 days'
            AND created_at < selected_week.period_end - INTERVAL '7 days')::text AS previous_week_revenue,
         (SELECT COUNT(*)
          FROM orders
          WHERE status <> 'cancelled'
            AND created_at >= selected_week.week_start
            AND created_at < selected_week.period_end)::text AS total_orders,
         (SELECT COUNT(*)
          FROM orders
          WHERE status = 'delivered'
            AND created_at >= selected_week.week_start
            AND created_at < selected_week.period_end)::text AS delivered_orders,
         (SELECT COUNT(*)
          FROM orders
          WHERE status = 'pending')::text AS pending_orders,
         (SELECT COUNT(*) FROM customers)::text AS total_customers,
         (SELECT COUNT(*)
          FROM customers
          JOIN users ON users.id = customers.user_id
          WHERE users.created_at >= selected_week.week_start
            AND users.created_at < selected_week.period_end)::text AS new_customers,
         (SELECT COUNT(DISTINCT health_profiles.customer_id)
          FROM health_profiles
          WHERE health_profiles.bmi IS NOT NULL)::text AS customers_with_bmi,
         (SELECT COUNT(*)
          FROM chat_messages
          WHERE role = 'user'
            AND created_at >= selected_week.week_start
            AND created_at < selected_week.period_end)::text AS weekly_chat_messages
       FROM selected_week`,
      [weekStart],
    ),
    pool.query<WeeklySalesRow>(
      `SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
              COALESCE(daily.revenue, 0)::text AS revenue,
              COALESCE(daily.orders, 0)::text AS orders
       FROM generate_series(
         $1::date,
         LEAST($1::date + INTERVAL '6 days', CURRENT_DATE),
         INTERVAL '1 day'
       ) AS days(day)
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) AS revenue,
                COUNT(*) FILTER (WHERE status <> 'cancelled') AS orders
         FROM orders
         WHERE created_at >= days.day
           AND created_at < days.day + INTERVAL '1 day'
       ) AS daily ON TRUE
       ORDER BY days.day`,
      [weekStart],
    ),
    pool.query<CategorySalesRow>(
      `SELECT ${categoryName} AS name,
              SUM(order_items.quantity)::text AS units_sold
       FROM order_items
       JOIN orders ON orders.id = order_items.order_id
       JOIN products ON products.${productIdColumn} = order_items.product_id
       ${categoryJoin}
       WHERE orders.status = 'delivered'
         AND orders.created_at >= $1::date
         AND orders.created_at < LEAST($1::date + INTERVAL '7 days', CURRENT_DATE + INTERVAL '1 day')
       GROUP BY ${categoryName}
       ORDER BY SUM(order_items.quantity) DESC, ${categoryName}`,
      [weekStart],
    ),
    pool.query<UrgentOrderRow>(
      `SELECT orders.id, orders.order_code, orders.customer_name, orders.customer_phone,
              (SELECT order_items.product_name ||
                      CASE WHEN order_items.quantity > 1 THEN ' x' || order_items.quantity ELSE '' END
               FROM order_items
               WHERE order_items.order_id = orders.id
               ORDER BY order_items.quantity DESC, order_items.id
               LIMIT 1) AS main_product,
              orders.total_amount::text, orders.payment_method, orders.status
       FROM orders
       ORDER BY orders.created_at DESC, orders.id DESC
       LIMIT 3`,
    ),
    pool.query<LowStockRow>(
      `SELECT ${productIdColumn} AS id, code, name, stock_quantity
       FROM products
       WHERE ${productActiveColumn} = TRUE AND stock_quantity <= $1
       ORDER BY stock_quantity ASC, name`,
      [LOW_STOCK_THRESHOLD],
    ),
  ]);

  const summary = summaryResult.rows[0];
  if (!summary) {
    throw new Error('Không thể tải thống kê dashboard.');
  }

  const weeklyRevenue = toNumber(summary.weekly_revenue);
  const previousWeekRevenue = toNumber(summary.previous_week_revenue);
  const totalOrders = toNumber(summary.total_orders);
  const deliveredOrders = toNumber(summary.delivered_orders);
  const totalUnitsSold = categorySalesResult.rows.reduce(
    (total, category) => total + toNumber(category.units_sold),
    0,
  );
  const categories = categorySalesResult.rows.map((category) => {
    const unitsSold = toNumber(category.units_sold);
    return {
      name: category.name,
      unitsSold,
      percentage: totalUnitsSold > 0 ? (unitsSold / totalUnitsSold) * 100 : 0,
    };
  });

  return {
    summary: {
      weeklyRevenue,
      revenueChangePercent: previousWeekRevenue > 0
        ? ((weeklyRevenue - previousWeekRevenue) / previousWeekRevenue) * 100
        : null,
      totalOrders,
      deliveredOrderPercent: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
      pendingOrders: toNumber(summary.pending_orders),
      totalCustomers: toNumber(summary.total_customers),
      newCustomers: toNumber(summary.new_customers),
      customersWithBmi: toNumber(summary.customers_with_bmi),
      weeklyChatMessages: toNumber(summary.weekly_chat_messages),
    },
    weeklySales: weeklySalesResult.rows.map((row) => ({
      date: row.date,
      revenue: toNumber(row.revenue),
      orders: toNumber(row.orders),
    })),
    categories,
    urgentOrders: urgentOrdersResult.rows.map((row) => ({
      id: String(row.id),
      orderCode: row.order_code,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      mainProduct: row.main_product ?? 'Không có thông tin sản phẩm',
      total: toNumber(row.total_amount),
      paymentMethod: row.payment_method,
      status: row.status,
    })),
    lowStockProducts: lowStockResult.rows.map((row) => ({
      id: String(row.id),
      code: row.code,
      name: row.name,
      stock: row.stock_quantity,
      threshold: LOW_STOCK_THRESHOLD,
    })),
  };
}
