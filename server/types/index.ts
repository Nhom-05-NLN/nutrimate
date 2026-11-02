export type DietCategory = 'all' | 'low-carb' | 'high-protein' | 'sugar-free';

export interface NutritionFacts {
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber?: number;
  sodium?: number;
}

export type NutritionFact = NutritionFacts;
export interface Product {
  id: string;
  code: string;
  name: string;
  category: DietCategory;
  categoryName: string;
  price: number;
  basePrice?: number;
  originalPrice?: number;
  image: string;
  imageURL?: string;
  description: string;
  ingredients: string[];
  usageInstruction?: string;
  status?: boolean;
  nutrition: NutritionFacts;
  stock: number;
  rating: number;
  reviewCount: number;
  badges: string[];
  isFeatured?: boolean;
  bestFor: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  dietType: DietCategory;
  icon?: string;
  count?: number;
}

export type VoucherDiscountType = 'fixed' | 'percent';
export type VoucherTargetType = 'all' | 'first_order';

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  targetType: VoucherTargetType;
  usageLimit: number;
  usedCount: number;
  startDate?: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateVoucherPayload {
  code: string;
  title: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  targetType?: VoucherTargetType;
  usageLimit: number;
  endDate: string;
  isActive?: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'vietqr' | 'momo';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  calories: number;
  protein: number;
  portion?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  createdAt: string;
  customer: CustomerInfo;
  items: OrderItem[];
  totalAmount: number;
  totalCalories: number;
  totalProtein: number;
  shippingFee: number;
  discountAmount?: number;
  voucherCode?: string;
  shippingMethod?: 'standard' | 'express_2h';
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes?: string;
}

export interface ProductFilterQuery {
  category?: string;
  diet?: string;
  search?: string;
  maxCalories?: number;
  minProtein?: number;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'calories_asc' | 'calories_desc' | 'rating_desc' | 'newest';
}

export interface PaginatedProductResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Product[];
  message?: string;
}

export interface CreateOrderPayload {
  customer: CustomerInfo;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  shippingMethod?: 'standard' | 'express_2h';
  voucherCode?: string;
  notes?: string;
}

export interface KnowledgeBaseEntry {
  id: number;
  question: string | null;
  answer: string | null;
  category: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

export interface ChatbotKnowledge {
  id: number;
  intentTag: string;
  keywordPatterns: string[];
  answerTemplate: string;
  recommendedCategory?: DietCategory;
}

export interface ChatResponseData {
  reply: string;
  suggestedProducts: Product[];
  intent?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}
