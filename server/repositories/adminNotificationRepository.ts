import { getPool, isDbConnected } from '../db/index.js';
import { AdminNotification, AdminNotificationList } from '../types/adminNotification.js';

interface NotificationRow {
  id: string;
  type: AdminNotification['type'];
  title: string;
  message: string;
  customer_id: string | null;
  created_at: Date;
  read_at: Date | null;
}

export async function listAdminNotifications(): Promise<AdminNotificationList> {
  if (!isDbConnected()) throw new Error('Cơ sở dữ liệu hiện không khả dụng.');

  const result = await getPool().query<NotificationRow>(
    `SELECT id::text, type, title, message, customer_id::text, created_at, read_at
     FROM admin_notifications
     ORDER BY created_at DESC, id DESC
     LIMIT 50`,
  );
  const unreadResult = await getPool().query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM admin_notifications WHERE read_at IS NULL',
  );

  return {
    notifications: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      customerId: row.customer_id,
      createdAt: row.created_at.toISOString(),
      readAt: row.read_at?.toISOString() ?? null,
    })),
    unreadCount: Number(unreadResult.rows[0]?.count ?? 0),
  };
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  if (!isDbConnected()) throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  await getPool().query(
    'UPDATE admin_notifications SET read_at = CURRENT_TIMESTAMP WHERE read_at IS NULL',
  );
}

export async function markAdminNotificationRead(id: string): Promise<boolean> {
  if (!isDbConnected()) throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  const result = await getPool().query(
    `UPDATE admin_notifications
     SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = $1`,
    [id],
  );
  return result.rowCount === 1;
}

export async function deleteAdminNotification(id: string): Promise<boolean> {
  if (!isDbConnected()) throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  const result = await getPool().query(
    'DELETE FROM admin_notifications WHERE id = $1',
    [id],
  );
  return result.rowCount === 1;
}

export async function deleteAllAdminNotifications(): Promise<void> {
  if (!isDbConnected()) throw new Error('Cơ sở dữ liệu hiện không khả dụng.');
  await getPool().query('DELETE FROM admin_notifications');
}
