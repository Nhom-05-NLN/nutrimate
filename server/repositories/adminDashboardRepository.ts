import { getPool, isDbConnected } from '../db/index.js';
import { AdminDashboardData } from '../types/adminDashboard.js';

const LOW_STOCK_THRESHOLD = 30;

interface SummaryRow {
  monthly_revenue: string;
  previous_month_revenue: string;
  total_orders: string;
  delivered_orders: string;
  pending_orders: string;
  total_customers: string;
  new_customers: string;
  customers_with_bmi: string;
  monthly_chat_messages: string;
}

interface WeeklySalesRow {
  date: string;
  product_revenue: string;
  ai_recommended_revenue: string;
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

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  if (!isDbConnected()) {
    throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  }

  const pool = getPool();
  const [
    summaryResult,
    weeklySalesResult,
    categorySalesResult,
    urgentOrdersResult,
    lowStockResult,
  ] = await Promise.all([
    pool.query<SummaryRow>(
      `SELECT
         (SELECT COALESCE(SUM(total_amount), 0)
          FROM orders
          WHERE status = 'delivered'
            AND created_at >= date_trunc('month', CURRENT_DATE))::text AS monthly_revenue,
         (SELECT COALESCE(SUM(total_amount), 0)
          FROM orders
          WHERE status = 'delivered'
            AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
            AND created_at < date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
              + LEAST(
                  EXTRACT(DAY FROM CURRENT_DATE)::int,
                  EXTRACT(DAY FROM date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::int
                ) * INTERVAL '1 day')::text AS previous_month_revenue,
         (SELECT COUNT(*) FROM orders)::text AS total_orders,
         (SELECT COUNT(*) FROM orders WHERE status = 'delivered')::text AS delivered_orders,
         (SELECT COUNT(*) FROM orders WHERE status = 'pending')::text AS pending_orders,
         (SELECT COUNT(*) FROM customers)::text AS total_customers,
         (SELECT COUNT(*)
          FROM customers
          JOIN users ON users.id = customers.user_id
          WHERE users.created_at >= date_trunc('month', CURRENT_DATE))::text AS new_customers,
         (SELECT COUNT(DISTINCT health_profiles.customer_id)
          FROM health_profiles
          WHERE health_profiles.bmi IS NOT NULL)::text AS customers_with_bmi,
         (SELECT COUNT(*)
          FROM chat_messages
          WHERE role = 'user'
            AND created_at >= date_trunc('month', CURRENT_DATE))::text AS monthly_chat_messages`,
    ),
    pool.query<WeeklySalesRow>(
      `SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
              COALESCE(SUM(order_items.subtotal) FILTER (
                WHERE orders.status = 'delivered' AND NOT order_items.is_ai_recommended
              ), 0)::text AS product_revenue,
              COALESCE(SUM(order_items.subtotal) FILTER (
                WHERE orders.status = 'delivered' AND order_items.is_ai_recommended
              ), 0)::text AS ai_recommended_revenue,
              COUNT(DISTINCT orders.id) FILTER (WHERE orders.status <> 'cancelled')::text AS orders
       FROM generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         INTERVAL '1 day'
       ) AS days(day)
       LEFT JOIN orders
         ON orders.created_at >= days.day
        AND orders.created_at < days.day + INTERVAL '1 day'
        AND orders.status <> 'cancelled'
       LEFT JOIN order_items ON order_items.order_id = orders.id
       GROUP BY days.day
       ORDER BY days.day`,
    ),
    pool.query<CategorySalesRow>(
      `SELECT products.category_name AS name,
              SUM(order_items.quantity)::text AS units_sold
       FROM order_items
       JOIN orders ON orders.id = order_items.order_id
       JOIN products ON products.id = order_items.product_id
       WHERE orders.status = 'delivered'
         AND orders.created_at >= date_trunc('month', CURRENT_DATE)
       GROUP BY products.category_name
       ORDER BY SUM(order_items.quantity) DESC, products.category_name`,
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
       WHERE orders.status = 'pending'
       ORDER BY orders.created_at ASC
       LIMIT 5`,
    ),
    pool.query<LowStockRow>(
      `SELECT id, code, name, stock_quantity
       FROM products
       WHERE is_active = TRUE AND stock_quantity <= $1
       ORDER BY stock_quantity ASC, name
       LIMIT 5`,
      [LOW_STOCK_THRESHOLD],
    ),
  ]);

  const summary = summaryResult.rows[0];
  if (!summary) {
    throw new Error('Không thể tải thống kê dashboard.');
  }

  const monthlyRevenue = toNumber(summary.monthly_revenue);
  const previousMonthRevenue = toNumber(summary.previous_month_revenue);
  const totalOrders = toNumber(summary.total_orders);
  const deliveredOrders = toNumber(summary.delivered_orders);
  const totalUnitsSold = categorySalesResult.rows.reduce(
    (total, category) => total + toNumber(category.units_sold),
    0,
  );
  const topCategories = categorySalesResult.rows.slice(0, 3);
  const otherUnits = categorySalesResult.rows
    .slice(3)
    .reduce((total, category) => total + toNumber(category.units_sold), 0);
  const categories = topCategories.map((category) => {
    const unitsSold = toNumber(category.units_sold);
    return {
      name: category.name,
      unitsSold,
      percentage: totalUnitsSold > 0 ? (unitsSold / totalUnitsSold) * 100 : 0,
    };
  });
  if (otherUnits > 0) {
    categories.push({
      name: 'Khác',
      unitsSold: otherUnits,
      percentage: (otherUnits / totalUnitsSold) * 100,
    });
  }

  return {
    summary: {
      monthlyRevenue,
      revenueChangePercent: previousMonthRevenue > 0
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : null,
      totalOrders,
      deliveredOrderPercent: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
      pendingOrders: toNumber(summary.pending_orders),
      totalCustomers: toNumber(summary.total_customers),
      newCustomers: toNumber(summary.new_customers),
      customersWithBmi: toNumber(summary.customers_with_bmi),
      monthlyChatMessages: toNumber(summary.monthly_chat_messages),
    },
    weeklySales: weeklySalesResult.rows.map((row) => ({
      date: row.date,
      revenue: toNumber(row.product_revenue) + toNumber(row.ai_recommended_revenue),
      productRevenue: toNumber(row.product_revenue),
      aiRecommendedRevenue: toNumber(row.ai_recommended_revenue),
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
