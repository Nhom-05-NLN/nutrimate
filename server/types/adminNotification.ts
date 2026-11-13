export interface AdminNotification {
  id: string;
  type: 'customer_registered' | 'order_placed';
  title: string;
  message: string;
  customerId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface AdminNotificationList {
  notifications: AdminNotification[];
  unreadCount: number;
}
