export interface AdminDashboardData {
  summary: {
    monthlyRevenue: number;
    revenueChangePercent: number | null;
    totalOrders: number;
    deliveredOrderPercent: number;
    pendingOrders: number;
    totalCustomers: number;
    newCustomers: number;
    customersWithBmi: number;
    monthlyChatMessages: number;
  };
  weeklySales: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  categories: {
    name: string;
    unitsSold: number;
    percentage: number;
  }[];
  urgentOrders: {
    id: string;
    orderCode: string;
    customerName: string;
    customerPhone: string;
    mainProduct: string;
    total: number;
    paymentMethod: string;
    status: string;
  }[];
  lowStockProducts: {
    id: string;
    code: string;
    name: string;
    stock: number;
    threshold: number;
  }[];
}
