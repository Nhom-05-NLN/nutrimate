import {
  ApiResponse,
  AdminCustomerListResponse,
  Category,
  ChatSuggestedProduct,
  CreateOrderPayload,
  KnowledgeBaseEntry,
  KnowledgeBaseEntryPayload,
  KnowledgeImportResult,
  NutritionImagePrediction,
  Order,
  PaginatedProductResult,
  Product,
  ProductFilterQuery,
  CaloriePlanResponse,
  CalorieProfileInput,
  CreateNutritionDiaryMeal,
  NutritionDiaryDay,
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      ...options,
    });

    if (!res.ok) {
      let errorMsg = `Lỗi mạng HTTP ${res.status}`;
      try {
        const errorData = (await res.json()) as { message?: string };
        if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch {
        // Fallback error message
      }
      throw new ApiError(res.status, errorMsg);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : 'Lỗi không xác định khi kết nối máy chủ';
    throw new Error(message);
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetchJson<ApiResponse<Category[]>>('/categories');
  return res.data || [];
}

export async function fetchProducts(filter: ProductFilterQuery = {}): Promise<PaginatedProductResult> {
  const query = new URLSearchParams();
  if (filter.category && filter.category !== 'all') {
    query.set('category', filter.category);
  }
  if (filter.diet && filter.diet !== 'all') {
    query.set('diet', filter.diet);
  }
  if (filter.search && filter.search.trim()) {
    query.set('search', filter.search.trim());
  }
  if (filter.maxCalories && filter.maxCalories > 0) {
    query.set('maxCalories', String(filter.maxCalories));
  }
  if (filter.minProtein && filter.minProtein > 0) {
    query.set('minProtein', String(filter.minProtein));
  }
  if (filter.page && filter.page > 0) {
    query.set('page', String(filter.page));
  }
  if (filter.limit && filter.limit > 0) {
    query.set('limit', String(filter.limit));
  }
  if (filter.sort) {
    query.set('sort', filter.sort);
  }

  const qs = query.toString();
  const endpoint = qs ? `/products?${qs}` : '/products';
  const res = await fetchJson<ApiResponse<Product[]>>(endpoint);
  const items = res.data || [];
  return {
    products: items,
    total: res.total !== undefined ? res.total : items.length,
    page: res.page || filter.page || 1,
    limit: res.limit || filter.limit || 12,
    totalPages: res.totalPages || Math.ceil((res.total || items.length) / (res.limit || filter.limit || 12)) || 1,
  };
}

export async function fetchProductById(id: string): Promise<Product> {
  const res = await fetchJson<ApiResponse<Product>>(`/products/${id}`);
  if (!res.data) {
    throw new Error('Không tìm thấy sản phẩm');
  }
  return res.data;
}

export async function postOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await fetchJson<ApiResponse<Order>>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || 'Không thể hoàn tất đơn hàng');
  }
  return res.data;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  accessToken: string;
  role: 'customer' | 'admin';
  avatarUrl?: string | null;
  dietPreferences: string[];
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
  addresses?: ShippingAddress[];
}

export interface ShippingAddress {
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
}

export type ShippingAddressInput = Omit<ShippingAddress, "addressId" | "address" | "isDefault">;

export async function fetchUserAddresses(): Promise<ShippingAddress[]> {
  const res = await fetchJson<ApiResponse<ShippingAddress[]>>("/auth/me/addresses");
  return res.data ?? [];
}

export async function createUserAddress(payload: ShippingAddressInput): Promise<ShippingAddress> {
  const res = await fetchJson<ApiResponse<ShippingAddress>>("/auth/me/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error(res.message || "Không thể thêm địa chỉ.");
  return res.data;
}

export async function editUserAddress(
  addressId: number,
  payload: ShippingAddressInput,
): Promise<ShippingAddress> {
  const res = await fetchJson<ApiResponse<ShippingAddress>>(`/auth/me/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error(res.message || "Không thể cập nhật địa chỉ.");
  return res.data;
}

export async function setDefaultUserAddress(addressId: number): Promise<void> {
  await fetchJson<ApiResponse<never>>(`/auth/me/addresses/${addressId}/default`, {
    method: "PATCH",
  });
}

export async function deleteUserAddress(addressId: number): Promise<void> {
  await fetchJson<ApiResponse<never>>(`/auth/me/addresses/${addressId}`, {
    method: "DELETE",
  });
}

export async function postRegister(payload: RegisterPayload): Promise<RegisteredUser> {
  const res = await fetchJson<ApiResponse<RegisteredUser>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || 'Không thể đăng ký tài khoản');
  }
  return res.data;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export async function postLogin(payload: LoginPayload): Promise<RegisteredUser> {
  const res = await fetchJson<ApiResponse<RegisteredUser>>('/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || 'Không thể đăng nhập');
  }
  return res.data;
}

export async function postAdminLogin(payload: LoginPayload): Promise<RegisteredUser> {
  const res = await fetchJson<ApiResponse<RegisteredUser>>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || 'Không thể đăng nhập quản trị viên');
  }
  return res.data;
}

export async function fetchCurrentUser(): Promise<RegisteredUser | null> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'same-origin',
  });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Lỗi mạng HTTP ${response.status} khi xác minh phiên đăng nhập.`);
  }

  const res = (await response.json()) as ApiResponse<RegisteredUser>;
  if (!res.data) {
    throw new Error(res.message || 'Không thể xác minh phiên đăng nhập.');
  }
  return res.data;
}

export async function updateCurrentUser(
  payload: Pick<RegisteredUser, "name" | "email" | "phone">,
): Promise<Pick<RegisteredUser, "id" | "name" | "email" | "phone" | "role" | "defaultAddress" | "addresses">> {
  const res = await fetchJson<ApiResponse<Pick<RegisteredUser, "id" | "name" | "email" | "phone" | "role" | "defaultAddress" | "addresses">>>(
    "/auth/me",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  if (!res.data) {
    throw new Error(res.message || "Không thể cập nhật thông tin cá nhân.");
  }
  return res.data;
}

export async function updateCurrentUserAvatar(avatarUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetchJson<ApiResponse<{ avatarUrl: string }>>('/auth/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
      signal: controller.signal,
    });
    if (!res.data) {
      throw new Error(res.message || 'Không thể cập nhật ảnh đại diện.');
    }
    return res.data.avatarUrl;
  } catch (error: unknown) {
    if (controller.signal.aborted) {
      throw new Error('Máy chủ mất quá lâu để lưu ảnh. Kiểm tra API/Neon và thử lại.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function updateCurrentUserDietPreferences(
  dietPreferences: string[],
): Promise<string[]> {
  const res = await fetchJson<ApiResponse<{ dietPreferences: string[] }>>(
    '/auth/me/diet-preferences',
    {
      method: 'PATCH',
      body: JSON.stringify({ dietPreferences }),
    },
  );
  if (!res.data) {
    throw new Error(res.message || 'Không thể cập nhật chế độ ăn.');
  }
  return res.data.dietPreferences;
}

export async function postLogout(): Promise<void> {
  await fetchJson<ApiResponse<never>>('/auth/logout', {
    method: 'POST',
  });
}

export async function fetchNutritionDiary(date: string): Promise<NutritionDiaryDay> {
  const response = await fetchJson<ApiResponse<NutritionDiaryDay>>(`/nutrition-diary?date=${encodeURIComponent(date)}`);
  if (!response.data) throw new Error(response.message || 'Không thể tải nhật ký dinh dưỡng.');
  return response.data;
}

export async function postNutritionMeal(payload: CreateNutritionDiaryMeal): Promise<NutritionDiaryDay> {
  const response = await fetchJson<ApiResponse<NutritionDiaryDay>>('/nutrition-diary/meals', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.data) throw new Error(response.message || 'Không thể lưu món ăn.');
  return response.data;
}

export async function postNutritionWater(date: string, amountMl: number): Promise<NutritionDiaryDay> {
  const response = await fetchJson<ApiResponse<NutritionDiaryDay>>('/nutrition-diary/water', { method: 'POST', body: JSON.stringify({ date, amountMl }) });
  if (!response.data) throw new Error(response.message || 'Không thể lưu lượng nước.');
  return response.data;
}

export interface ChatbotResponse {
  conversationId: string;
  messages: ChatHistoryMessage[];
  reply: string;
  suggestedProducts: ChatSuggestedProduct[];
  intent?: string;
}

export interface ChatConversation { id: string; createdAt: string; updatedAt: string }
export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  requestId: string;
  suggestedProducts: ChatSuggestedProduct[];
  imageUrl?: string | null;
}
function chatHeaders(token?: string | null): Record<string, string> {
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
export async function ensureChatSession(token?: string | null): Promise<{ kind: 'guest' | 'customer'; created: boolean }> {
  const res = await fetchJson<ApiResponse<{ kind: 'guest' | 'customer'; created: boolean }>>('/chat/session', {
    method: 'POST', credentials: 'same-origin', headers: chatHeaders(token), body: '{}',
  });
  if (!res.data) throw new Error('Không thể khôi phục phiên chat.');
  return res.data;
}
export async function createChatConversation(token?: string | null): Promise<ChatConversation> {
  const res = await fetchJson<ApiResponse<ChatConversation>>('/chat/conversations', { method: 'POST', headers: chatHeaders(token) });
  if (!res.data) throw new Error('Không thể tạo hội thoại.');
  return res.data;
}
export async function fetchChatConversations(token?: string | null): Promise<ChatConversation[]> {
  const res = await fetchJson<ApiResponse<ChatConversation[]>>('/chat/conversations', { headers: chatHeaders(token) });
  return res.data || [];
}
export async function fetchChatHistory(id: string, token?: string | null, before?: string): Promise<ChatHistoryMessage[]> {
  const res = await fetchJson<ApiResponse<{ messages: ChatHistoryMessage[] }>>(`/chat/conversations/${encodeURIComponent(id)}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`, { headers: chatHeaders(token) });
  if (!res.data) throw new Error('Không thể tải lịch sử.');
  return res.data.messages;
}
export async function postChatMessage(message: string, conversationId: string, requestId: string, token?: string | null): Promise<ChatbotResponse> {
  const res = await fetchJson<ApiResponse<ChatbotResponse>>('/chat/ask', {
    method: 'POST',
    headers: chatHeaders(token),
    body: JSON.stringify({ message, conversationId, requestId }),
  });
  if (!res.data) {
    throw new Error('Không nhận được phản hồi từ NutriBot');
  }
  return res.data;
}

export async function fetchKnowledgeEntries(): Promise<KnowledgeBaseEntry[]> {
  const res = await fetchJson<ApiResponse<KnowledgeBaseEntry[]>>('/knowledge');
  return res.data || [];
}

export async function createKnowledgeEntry(payload: KnowledgeBaseEntryPayload): Promise<KnowledgeBaseEntry> {
  const res = await fetchJson<ApiResponse<KnowledgeBaseEntry>>('/knowledge', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error('Không thể lưu tri thức mới.');
  return res.data;
}

export async function importKnowledgeEntries(entries: KnowledgeBaseEntryPayload[]): Promise<KnowledgeImportResult> {
  const res = await fetchJson<ApiResponse<KnowledgeImportResult>>('/knowledge/import', {
    method: 'POST',
    body: JSON.stringify({ entries }),
  });
  if (!res.data) throw new Error('Không thể nhập file tri thức.');
  return res.data;
}

export async function updateKnowledgeEntry(id: number, payload: KnowledgeBaseEntryPayload): Promise<KnowledgeBaseEntry> {
  const res = await fetchJson<ApiResponse<KnowledgeBaseEntry>>(`/knowledge/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error('Không thể cập nhật tri thức.');
  return res.data;
}

export async function deleteKnowledgeEntry(id: number): Promise<{ deleted: boolean; id: number }> {
  const res = await fetchJson<ApiResponse<{ deleted: boolean; id: number }>>(`/knowledge/${id}`, {
    method: 'DELETE',
  });
  if (!res.data) throw new Error('Không thể xóa tri thức.');
  return res.data;
}

async function prepareNutritionImage(image: File): Promise<File> {
  if (typeof createImageBitmap !== 'function') return image;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(image);
  } catch {
    return image;
  }

  try {
    const maxDimension = 2048;
    const maxOriginalBytes = 1.5 * 1024 * 1024;
    if (image.size <= maxOriginalBytes && bitmap.width <= maxDimension && bitmap.height <= maxDimension) return image;

    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Không thể chuẩn bị ảnh để phân tích.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) resolve(result);
        else reject(new Error('Không thể nén ảnh để phân tích.'));
      }, 'image/jpeg', 0.85);
    });
    return new File([blob], image.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: image.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

export async function postNutritionImage(image: File, token: string, conversationId: string, requestId: string, question = ''): Promise<NutritionImagePrediction> {
  const preparedImage = await prepareNutritionImage(image);
  const questionBytes = new TextEncoder().encode(question.trim());
  let questionBinary = '';
  for (const byte of questionBytes) questionBinary += String.fromCharCode(byte);
  const response = await fetch(`${API_BASE}/chat/nutrition-images`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': preparedImage.type || 'application/octet-stream',
      Authorization: `Bearer ${token}`,
      'X-Chat-Conversation-Id': conversationId,
      'X-Chat-Request-Id': requestId,
      'X-Chat-Question': btoa(questionBinary),
    },
    body: preparedImage,
  });

  let result: ApiResponse<NutritionImagePrediction>;
  try {
    result = await response.json() as ApiResponse<NutritionImagePrediction>;
  } catch {
    throw new ApiError(response.status, `Lỗi mạng HTTP ${response.status}`);
  }
  if (!response.ok) throw new ApiError(response.status, result.message || `Lỗi mạng HTTP ${response.status}`);
  if (!result.data) throw new Error('Không nhận được kết quả phân tích ảnh.');
  return result.data;
}

export async function fetchNutritionChatImage(imageUrl: string, token: string): Promise<Blob> {
  if (!/^\/api\/chat\/nutrition-images\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(imageUrl)) {
    throw new Error('Đường dẫn ảnh trong lịch sử không hợp lệ.');
  }
  const response = await fetch(imageUrl, {
    credentials: 'same-origin',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new ApiError(response.status, 'Không thể tải ảnh trong lịch sử chat.');
  return response.blob();
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  return fetchJson<{ status: string; service: string }>('/health');
}

export async function fetchCaloriePlan(): Promise<CaloriePlanResponse> {
  const response = await fetchJson<ApiResponse<CaloriePlanResponse>>('/calorie-plan');
  if (!response.data) throw new Error(response.message || 'Không thể tải hồ sơ Calories.');
  return response.data;
}

export async function saveCalorieProfile(profile: CalorieProfileInput): Promise<CaloriePlanResponse> {
  const response = await fetchJson<ApiResponse<CaloriePlanResponse>>('/calorie-plan/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
  if (!response.data) throw new Error(response.message || 'Không thể lưu hồ sơ Calories.');
  return response.data;
}

export interface AdminCustomerQuery {
  search?: string;
  segment?: 'all' | 'frequent';
  nutritionGoal?: 'all' | 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'unset';
  bmiProfile?: 'all' | 'set' | 'unset';
  orders?: 'all' | 'has_orders' | 'no_orders';
  includeAvatars?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminCustomerMutationInput {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  heightCm: number | null;
  weightKg: number | null;
  nutritionGoal: 'lose_weight' | 'maintain_weight' | 'gain_weight' | null;
}

export interface AdminNotification {
  id: string;
  type: 'customer_registered' | 'customer_logged_in';
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

export async function fetchAdminNotifications(): Promise<AdminNotificationList> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetchJson<ApiResponse<AdminNotificationList>>('/admin/notifications', {
      signal: controller.signal,
    });
    if (!response.data) {
      throw new Error(response.message || 'Không thể tải thông báo quản trị.');
    }
    return response.data;
  } catch (error: unknown) {
    if (controller.signal.aborted) {
      throw new Error('Máy chủ không phản hồi API thông báo. Hãy khởi động lại backend rồi thử lại.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function markAdminNotificationsRead(): Promise<void> {
  const response = await fetchJson<ApiResponse<{ updated: boolean }>>('/admin/notifications/read-all', {
    method: 'PATCH',
  });
  if (!response.data?.updated) {
    throw new Error(response.message || 'Không thể cập nhật trạng thái thông báo.');
  }
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  const response = await fetchJson<ApiResponse<{ updated: boolean }>>(
    `/admin/notifications/${encodeURIComponent(id)}/read`,
    { method: 'PATCH' },
  );
  if (!response.data?.updated) {
    throw new Error(response.message || 'Không thể cập nhật trạng thái thông báo.');
  }
}

export async function deleteAdminNotification(id: string): Promise<void> {
  const response = await fetchJson<ApiResponse<{ deleted: boolean }>>(
    `/admin/notifications/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
  if (!response.data?.deleted) {
    throw new Error(response.message || 'Không thể xóa thông báo.');
  }
}

export async function deleteAllAdminNotifications(): Promise<void> {
  const response = await fetchJson<ApiResponse<{ deleted: boolean }>>('/admin/notifications', {
    method: 'DELETE',
  });
  if (!response.data?.deleted) {
    throw new Error(response.message || 'Không thể xóa tất cả thông báo.');
  }
}

function notifyAdminCustomerCountChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-customers-changed'));
  }
}

export async function fetchAdminCustomers(
  filters: AdminCustomerQuery = {},
): Promise<AdminCustomerListResponse> {
  const query = new URLSearchParams();
  if (filters.search?.trim()) query.set('search', filters.search.trim());
  if (filters.segment && filters.segment !== 'all') query.set('segment', filters.segment);
  if (filters.nutritionGoal && filters.nutritionGoal !== 'all') query.set('nutritionGoal', filters.nutritionGoal);
  if (filters.bmiProfile && filters.bmiProfile !== 'all') query.set('bmiProfile', filters.bmiProfile);
  if (filters.orders && filters.orders !== 'all') query.set('orders', filters.orders);
  if (filters.includeAvatars === false) query.set('includeAvatars', 'false');
  if (filters.page && filters.page > 1) query.set('page', String(filters.page));
  if (filters.limit) query.set('limit', String(filters.limit));
  const queryString = query.toString();
  const response = await fetchJson<ApiResponse<AdminCustomerListResponse>>(
    `/admin/customers${queryString ? `?${queryString}` : ''}`,
  );
  if (!response.data) {
    throw new Error(response.message || 'Không thể tải danh sách khách hàng.');
  }
  return response.data;
}

export async function createAdminCustomer(input: AdminCustomerMutationInput): Promise<string> {
  const response = await fetchJson<ApiResponse<{ id: string }>>('/admin/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.data) throw new Error(response.message || 'Không thể tạo khách hàng.');
  notifyAdminCustomerCountChanged();
  return response.data.id;
}

export async function updateAdminCustomer(
  id: string,
  input: AdminCustomerMutationInput,
): Promise<void> {
  const response = await fetchJson<ApiResponse<{ updated: boolean }>>(`/admin/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  if (!response.data?.updated) throw new Error(response.message || 'Không thể cập nhật khách hàng.');
}

export async function deleteAdminCustomer(id: string): Promise<void> {
  const response = await fetchJson<ApiResponse<{ deleted: boolean }>>(`/admin/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.data?.deleted) throw new Error(response.message || 'Không thể xóa khách hàng.');
  notifyAdminCustomerCountChanged();
}
