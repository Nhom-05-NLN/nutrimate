import { getPool, isDbConnected } from '../db/index.js';
import { AdminCustomer, AdminCustomerInput, AdminCustomerListResult } from '../types/adminCustomer.js';

export interface AdminCustomerQuery {
  search: string;
  segment: 'all' | 'frequent';
  nutritionGoal: 'all' | 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'unset';
  bmiProfile: 'all' | 'set' | 'unset';
  orders: 'all' | 'has_orders' | 'no_orders';
  includeAvatars: boolean;
  page: number;
  limit: number;
}

interface CustomerIdRow {
  user_id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avt_url: string | null;
  bmi: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  nutrition_goal: string | null;
  total_spent: number;
  order_count: number;
  completed_order_count: number;
  chat_message_count: number;
  chat_conversation_count: number;
  last_chat_at: Date | null;
}

interface CountRow {
  total: string;
}

interface CustomerStatsRow {
  total_customers: string;
  bmi_goal_customer_count: string;
  frequent_chat_customer_count: string;
}

const recentChatActivityCte = `WITH recent_chat_activity AS (
  SELECT
    chat_conversations.user_id,
    COUNT(*)::int AS message_count,
    COUNT(DISTINCT chat_conversations.id)::int AS conversation_count,
    MAX(chat_messages.created_at) AS last_chat_at
  FROM chat_conversations
  JOIN chat_messages ON chat_messages.conversation_id = chat_conversations.id
  WHERE chat_conversations.user_id IS NOT NULL
    AND chat_messages.role = 'user'
    AND chat_messages.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  GROUP BY chat_conversations.user_id
)`;

const customerOrderActivityCte = `, customer_order_activity AS (
  SELECT
    linked_orders.customer_id,
    COALESCE(SUM(linked_orders.total_amount) FILTER (WHERE linked_orders.status = 'delivered'), 0)::float8 AS total_spent,
    COUNT(*)::int AS order_count,
    COUNT(*) FILTER (WHERE linked_orders.status = 'delivered')::int AS completed_order_count
  FROM (
    SELECT user_id AS customer_id, total_amount, status
    FROM orders
    WHERE user_id IS NOT NULL
    UNION ALL
    SELECT customer_id, total_amount, status
    FROM orders
    WHERE customer_id IS NOT NULL AND customer_id IS DISTINCT FROM user_id
  ) AS linked_orders
  GROUP BY linked_orders.customer_id
)`;

function customerFilterSql(): string {
  return `AND ($4::text = 'all' OR health_profiles.nutrition_goal = NULLIF($4, 'unset')
      OR ($4::text = 'unset' AND health_profiles.nutrition_goal IS NULL))
    AND ($5::text = 'all'
      OR ($5::text = 'set' AND health_profiles.bmi IS NOT NULL)
      OR ($5::text = 'unset' AND health_profiles.bmi IS NULL))
    AND ($6::text = 'all'
      OR ($6::text = 'has_orders' AND EXISTS (
        SELECT 1 FROM orders filter_orders
        WHERE filter_orders.user_id = customers.user_id OR filter_orders.customer_id = customers.user_id
      ))
      OR ($6::text = 'no_orders' AND NOT EXISTS (
        SELECT 1 FROM orders filter_orders
        WHERE filter_orders.user_id = customers.user_id OR filter_orders.customer_id = customers.user_id
      )))`;
}

export async function listAdminCustomers(query: AdminCustomerQuery): Promise<AdminCustomerListResult> {
  if (!isDbConnected()) {
    throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  }

  const search = query.search.trim();
  const hasSearch = search.length > 0;
  const searchValue = hasSearch ? `%${search}%` : '';
  const onlyFrequent = query.segment === 'frequent';
  const offset = (query.page - 1) * query.limit;
  const pool = getPool();
  const countQuery = pool.query<CountRow>(
    `${recentChatActivityCte}${customerOrderActivityCte}
     SELECT COUNT(*)::text AS total
     FROM customers
     LEFT JOIN users ON users.id = customers.user_id
     LEFT JOIN health_profiles ON health_profiles.customer_id = customers.user_id
     LEFT JOIN recent_chat_activity
       ON recent_chat_activity.user_id = customers.user_id
     WHERE (NOT $1::boolean OR customers.user_id::text ILIKE $2
       OR users.full_name ILIKE $2 OR users.email ILIKE $2 OR users.phone ILIKE $2)
       AND (NOT $3::boolean OR COALESCE(recent_chat_activity.message_count, 0) >= 5)
       ${customerFilterSql()}`,
    [hasSearch, searchValue, onlyFrequent, query.nutritionGoal, query.bmiProfile, query.orders],
  );
  const statsQuery = pool.query<CustomerStatsRow>(
    `${recentChatActivityCte}
     SELECT
       COUNT(DISTINCT customers.user_id)::text AS total_customers,
       COUNT(DISTINCT customers.user_id) FILTER (
         WHERE health_profiles.bmi IS NOT NULL
           AND health_profiles.nutrition_goal IS NOT NULL
       )::text AS bmi_goal_customer_count,
       COUNT(DISTINCT customers.user_id) FILTER (
         WHERE COALESCE(recent_chat_activity.message_count, 0) >= 5
       )::text AS frequent_chat_customer_count
     FROM customers
     LEFT JOIN health_profiles
       ON health_profiles.customer_id = customers.user_id
     LEFT JOIN recent_chat_activity
       ON recent_chat_activity.user_id = customers.user_id`,
  );
  const customersQuery = pool.query<CustomerIdRow>(
    `${recentChatActivityCte}${customerOrderActivityCte}
     SELECT
       customers.user_id,
       users.full_name,
       users.email,
       users.phone,
       CASE WHEN $9::boolean THEN users.avt_url ELSE NULL END AS avt_url,
       health_profiles.bmi::float8,
       health_profiles.height_cm::float8,
       health_profiles.weight_kg::float8,
       health_profiles.nutrition_goal,
       COALESCE(customer_order_activity.total_spent, 0)::float8 AS total_spent,
       COALESCE(customer_order_activity.order_count, 0)::int AS order_count,
       COALESCE(customer_order_activity.completed_order_count, 0)::int AS completed_order_count,
       COALESCE(recent_chat_activity.message_count, 0) AS chat_message_count,
       COALESCE(recent_chat_activity.conversation_count, 0) AS chat_conversation_count,
       recent_chat_activity.last_chat_at
     FROM customers
     LEFT JOIN users ON users.id = customers.user_id
     LEFT JOIN health_profiles ON health_profiles.customer_id = customers.user_id
     LEFT JOIN customer_order_activity ON customer_order_activity.customer_id = customers.user_id
     LEFT JOIN recent_chat_activity
       ON recent_chat_activity.user_id = customers.user_id
     WHERE (NOT $1::boolean OR customers.user_id::text ILIKE $2
       OR users.full_name ILIKE $2 OR users.email ILIKE $2 OR users.phone ILIKE $2)
       AND (NOT $3::boolean OR COALESCE(recent_chat_activity.message_count, 0) >= 5)
       ${customerFilterSql()}
     ORDER BY
       CASE WHEN $3::boolean THEN recent_chat_activity.message_count END DESC NULLS LAST,
       customers.user_id DESC
     LIMIT $7 OFFSET $8`,
    [
      hasSearch,
      searchValue,
      onlyFrequent,
      query.nutritionGoal,
      query.bmiProfile,
      query.orders,
      query.limit,
      offset,
      query.includeAvatars,
    ],
  );
  const [customersResult, countResult, statsResult] = await Promise.all([
    customersQuery,
    countQuery,
    statsQuery,
  ]);
  const total = Number(countResult.rows[0]?.total ?? 0);
  const stats = statsResult.rows[0];
  if (!stats) {
    throw new Error('Không thể tải thống kê khách hàng từ cơ sở dữ liệu.');
  }
  const totalCustomers = Number(stats.total_customers);
  const bmiGoalCustomerCount = Number(stats.bmi_goal_customer_count);
  const frequentChatCustomerCount = Number(stats.frequent_chat_customer_count);
  const customers: AdminCustomer[] = customersResult.rows.map((row) => ({
    id: String(row.user_id),
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avt_url,
    bmi: row.bmi,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    nutritionGoal: row.nutrition_goal,
    totalSpent: row.total_spent,
    orderCount: row.order_count,
    completedOrderCount: row.completed_order_count,
    recentChatMessages: row.chat_message_count,
    recentChatConversations: row.chat_conversation_count,
    lastChatAt: row.last_chat_at?.toISOString() ?? null,
  }));

  return {
    customers,
    total,
    totalCustomers,
    bmiGoalCustomerCount,
    frequentChatCustomerCount,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function createAdminCustomer(
  input: AdminCustomerInput,
  passwordHash: string,
): Promise<string> {
  if (!isDbConnected()) throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query<{ id: number }>(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, NULLIF($3, ''), $4, 'customer')
       RETURNING id`,
      [input.fullName, input.email, input.phone, passwordHash],
    );
    const userId = userResult.rows[0]?.id;
    if (!userId) throw new Error('Không thể tạo tài khoản khách hàng.');
    await client.query('INSERT INTO customers (user_id) VALUES ($1)', [userId]);

    if (input.heightCm !== null || input.weightKg !== null || input.nutritionGoal !== null) {
      await client.query(
        `INSERT INTO health_profiles
           (customer_id, height_cm, weight_kg, bmi, nutrition_goal)
         VALUES (
           $1, $2, $3,
           CASE WHEN $2::numeric > 0 AND $3::numeric > 0
             THEN ROUND($3::numeric / POWER($2::numeric / 100, 2), 1)
             ELSE NULL
           END,
           $4
         )`,
        [userId, input.heightCm, input.weightKg, input.nutritionGoal],
      );
    }

    await client.query('COMMIT');
    return String(userId);
  } catch (error: unknown) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError: unknown) {
      const message = rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error';
      console.error('[AdminCustomerRepository] Không thể rollback tạo khách hàng:', message);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAdminCustomer(
  id: number,
  input: AdminCustomerInput,
): Promise<boolean> {
  if (!isDbConnected()) throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `UPDATE users
      SET full_name = $2, email = $3, phone = NULLIF($4, ''), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND EXISTS (SELECT 1 FROM customers WHERE user_id = $1)`,
      [id, input.fullName, input.email, input.phone],
    );
    if (userResult.rowCount !== 1) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      `INSERT INTO health_profiles (customer_id, height_cm, weight_kg, bmi, nutrition_goal)
       VALUES (
         $1, $2, $3,
         CASE WHEN $2::numeric > 0 AND $3::numeric > 0
           THEN ROUND($3::numeric / POWER($2::numeric / 100, 2), 1)
           ELSE NULL
         END,
         $4
       )
       ON CONFLICT (customer_id) DO UPDATE SET
         height_cm = EXCLUDED.height_cm,
         weight_kg = EXCLUDED.weight_kg,
         bmi = EXCLUDED.bmi,
         nutrition_goal = EXCLUDED.nutrition_goal,
         updated_at = CURRENT_TIMESTAMP`,
      [id, input.heightCm, input.weightKg, input.nutritionGoal],
    );
    await client.query('COMMIT');
    return true;
  } catch (error: unknown) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError: unknown) {
      const message = rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error';
      console.error('[AdminCustomerRepository] Không thể rollback cập nhật khách hàng:', message);
    }
    throw error;
  } finally {
    client.release();
  }
}

export type DeleteAdminCustomerResult =
  | { deleted: true; orderCount: 0 }
  | { deleted: false; orderCount: number };

export async function deleteAdminCustomer(id: number): Promise<DeleteAdminCustomerResult | null> {
  if (!isDbConnected()) throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const customerResult = await client.query<{ id: number }>(
      `SELECT users.id
       FROM users
       JOIN customers ON customers.user_id = users.id
       WHERE users.id = $1
       FOR UPDATE OF users, customers`,
      [id],
    );
    if (!customerResult.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    const ordersResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM orders
       WHERE user_id = $1 OR customer_id = $1`,
      [id],
    );
    const orderCount = Number(ordersResult.rows[0]?.count ?? 0);
    if (orderCount > 0) {
      await client.query('ROLLBACK');
      return { deleted: false, orderCount };
    }

    const deletedResult = await client.query(
      `DELETE FROM users
       WHERE id = $1
         AND EXISTS (SELECT 1 FROM customers WHERE user_id = $1)`,
      [id],
    );
    if (deletedResult.rowCount !== 1) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query('COMMIT');
    return { deleted: true, orderCount: 0 };
  } catch (error: unknown) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError: unknown) {
      const message = rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error';
      console.error('[AdminCustomerRepository] Không thể rollback xóa khách hàng:', message);
    }
    throw error;
  } finally {
    client.release();
  }
}
