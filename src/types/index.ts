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

export interface Product {
  id: string;
  code: string;
  name: string;
  category: DietCategory;
  categoryName: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  ingredients: string[];
  nutrition: NutritionFacts;
  stock: number;
  rating: number;
  reviewCount: number;
  badges: string[];
  isFeatured?: boolean;
  bestFor: string;
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

export interface CartItem {
  product: Product;
  quantity: number;
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
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
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
}

export interface CreateOrderPayload {
  customer: CustomerInfo;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedProducts?: Product[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}
