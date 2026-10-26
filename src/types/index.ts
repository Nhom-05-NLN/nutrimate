export type DietCategory = 'all' | 'low-carb' | 'high-protein' | 'sugar-free' | 'snacks-nuts';

export interface NutritionFacts {
  servingSize: string;
  servingsPerContainer?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber?: number;
  sodium?: number;
  cholesterol?: number;
  saturatedFat?: number;
  transFat?: number;
  // Micronutrients % DV
  vitaminE?: number;
  iron?: number;
  zinc?: number;
  magnesium?: number;
}

export interface ProductPortionOption {
  label: string;
  weight: string;
  price: number;
  savingBadge?: string;
  inStock: boolean;
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
  galleryImages?: string[];
  description: string;
  ingredients: string[];
  nutrition: NutritionFacts;
  portions?: ProductPortionOption[];
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount?: number;
  badges: string[];
  isFeatured?: boolean;
  bestFor: string;
  traceability?: string;
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
  selectedPortion?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'packing' | 'shipping' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'vietqr' | 'momo' | 'bank_card';
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

export interface TrackingStep {
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

export interface DriverInfo {
  name: string;
  phone: string;
  vehiclePlate: string;
  coolingCondition: string; // e.g. "Thùng giữ mát 4°C"
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
  shippingMethod: 'standard' | 'express_2h';
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes?: string;
  driver?: DriverInfo;
  trackingSteps?: TrackingStep[];
}

export interface ProductFilterQuery {
  category?: string;
  diet?: string;
  search?: string;
  maxCalories?: number;
  minProtein?: number;
  maxSugar?: number;
  minPrice?: number;
  maxPrice?: number;
  specialDiet?: string[];
}

export interface CreateOrderPayload {
  customer: CustomerInfo;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  shippingMethod: 'standard' | 'express_2h';
  voucherCode?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedProducts?: Product[];
  actionLink?: {
    text: string;
    action: string;
  };
}

export interface KnowledgeBaseEntry {
  id: number;
  question: string | null;
  answer: string | null;
  category: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface KnowledgeBaseEntryPayload {
  question: string;
  answer: string;
  category?: string;
}

export interface KnowledgeImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}

// User Profile & Body Metrics (Figma 07)
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  birthDate: string;
  city: string;
  membershipTier: 'Silver' | 'Gold' | 'Platinum';
  nutriPoints: number;
  currentDiet: string;
  fitnessGoal: string;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  bmi: number;
  bmiClassification: string;
  bmrKcal: number;
  tdeeKcal: number;
  targetDailyCalories: number;
  targetMacros: {
    proteinPercent: number;
    proteinGrams: number;
    proteinKcal: number;
    carbsPercent: number;
    carbsGrams: number;
    carbsKcal: number;
    fatPercent: number;
    fatGrams: number;
    fatKcal: number;
  };
  dietPreferences: string[];
}

// Daily Nutrition Log (Figma 08)
export interface MealItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  proteinGrams: number;
  isCompleted: boolean;
}

export interface MealCategory {
  id: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  title: string;
  timeSlot: string;
  totalCalories: number;
  totalProtein: number;
  items: MealItem[];
  aiRecommendation?: string;
}

export interface DailyNutritionLog {
  date: string;
  targetCalories: number;
  consumedCalories: number;
  burnedCalories: number;
  remainingCalories: number;
  statusText: string;
  macros: {
    proteinCurrent: number;
    proteinTarget: number;
    carbsCurrent: number;
    carbsTarget: number;
    fatCurrent: number;
    fatTarget: number;
    sugarCurrent: number;
    sugarMax: number;
  };
  waterIntakeMl: number;
  waterTargetMl: number;
  waterGlasses: boolean[]; // 8 glasses of 250ml-275ml
  meals: MealCategory[];
}

// Admin Portal Models (Figma 10, 11, 12, 13, 14)
export interface AdminDashboardOverview {
  monthlyRevenueVnd: number;
  revenueGrowthPercent: number;
  totalOrders: number;
  pendingOrdersCount: number;
  activeCustomersCount: number;
  newCustomersCount: number;
  bmiTrackingPercent: number;
  nutriBotInteractions: number;
  conversionRatePercent: number;
  weeklyRevenueData: {
    day: string;
    regularRevenue: number;
    aiComboRevenue: number;
    isPeak?: boolean;
  }[];
  categoryShares: {
    name: string;
    sharePercent: number;
    growthPercent: number;
  }[];
  lowStockAlerts: {
    productName: string;
    sku: string;
    currentStock: number;
    unit: string;
    threshold: number;
    status: 'urgent' | 'warning';
  }[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  format: 'PDF' | 'MD/DOCX' | 'JSON/DB' | 'TXT';
  size: string;
  chunksCount: number;
  indexedStatus: 'indexed' | 'pending';
  categoryTag: string;
  similarityScore: number;
  accessCount: number;
  lastUpdated: string;
}
