export interface AdminCustomer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bmi: number | null;
  heightCm: number | null;
  weightKg: number | null;
  nutritionGoal: string | null;
  totalSpent: number;
  orderCount: number;
  completedOrderCount: number;
  recentChatMessages: number;
  recentChatConversations: number;
  lastChatAt: string | null;
}

export interface AdminCustomerListResult {
  customers: AdminCustomer[];
  total: number;
  totalCustomers: number;
  bmiGoalCustomerCount: number;
  frequentChatCustomerCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  heightCm: number | null;
  weightKg: number | null;
  nutritionGoal: 'lose_weight' | 'maintain_weight' | 'gain_weight' | null;
}
