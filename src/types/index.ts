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
  isAiRecommended?: boolean;
  bestFor: string;
  traceability?: string;
}

export type ChatSuggestedProduct = Omit<Product, 'nutrition'> & { nutrition?: NutritionFacts };

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
  isAiRecommended?: boolean;
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
    productRevenue: number;
    aiRecommendedRevenue: number;
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
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginatedProductResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  requestId?: string;
  failed?: boolean;
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  imagePreview?: string;
  imageUrl?: string;
  suggestedProducts?: ChatSuggestedProduct[];
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

export interface NutritionImagePrediction {
  imageId: number;
  imageUrl: string;
  ocrText: string;
  uploadDate: string;
  status: 'completed' | 'unrecognized';
  predictedCalories: number | null;
  predictedProtein: number | null;
  predictedCarbs: number | null;
  predictedFat: number | null;
  predictedSugar: number | null;
  labelFacts: { label: string; value: string }[];
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

export type NutritionGoal = 'lose_weight' | 'maintain_weight' | 'gain_weight';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';

export interface CalorieProfileInput {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: ActivityLevel | null;
  nutritionGoal: NutritionGoal | null;
}

export interface CaloriePlanResult extends Omit<CalorieProfileInput, 'activityLevel' | 'nutritionGoal'> {
  activityLevel: ActivityLevel;
  nutritionGoal: NutritionGoal;
  bmi: number;
  bmrKcal: number;
  tdeeKcal: number;
  targetCalories: number;
  adjustmentKcal: number;
  minimumTargetApplied: boolean;
}

export interface CaloriePlanResponse {
  profile: {
    heightCm: number | null;
    weightKg: number | null;
    age: number | null;
    gender: CalorieProfileInput['gender'] | null;
    activityLevel: ActivityLevel | null;
    nutritionGoal: NutritionGoal | null;
    bmi: number | null;
  };
  plan: CaloriePlanResult | null;
}

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

export interface AdminCustomerListResponse {
  customers: AdminCustomer[];
  total: number;
  totalCustomers: number;
  bmiGoalCustomerCount: number;
  frequentChatCustomerCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export interface NutritionDiaryMeal {
  id: number;
  mealType: MealType;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  createdAt: string;
}
export interface NutritionDiaryWaterLog { id: number; amountMl: number; loggedAt: string }
export interface NutritionDiaryDay {
  date: string;
  meals: NutritionDiaryMeal[];
  waterLogs: NutritionDiaryWaterLog[];
  totals: { calories: number; protein: number; carbs: number; fat: number; sugar: number; waterMl: number };
}
export interface CreateNutritionDiaryMeal {
  date: string; mealType: MealType; foodName: string;
  calories: number; protein: number; carbs: number; fat: number; sugar: number;
}

// User Profile & Body Metrics (Figma 07)
export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  defaultAddress?: {
    addressId: number;
    receiverName: string;
    receiverPhone: string;
    address: string;
    houseNumber: string;
    street: string;
    hamlet: string;
    ward: string;
    province: string;
    isDefault: boolean;
  } | null;
  addresses?: {
    addressId: number;
    receiverName: string;
    receiverPhone: string;
    address: string;
    houseNumber: string;
    street: string;
    hamlet: string;
    ward: string;
    province: string;
    isDefault: boolean;
  }[];
  role?: UserRole;
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
    aiRecommendedRevenue: number;
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
