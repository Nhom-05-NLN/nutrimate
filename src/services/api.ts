import {
  ApiResponse,
  Category,
  ChatSuggestedProduct,
  CreateOrderPayload,
  KnowledgeBaseEntry,
  KnowledgeBaseEntryPayload,
  KnowledgeImportResult,
  NutritionImagePrediction,
  Order,
  Product,
  ProductFilterQuery,
  CaloriePlanResponse,
  CalorieProfileInput,
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

export async function fetchProducts(filter: ProductFilterQuery = {}): Promise<Product[]> {
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

  const qs = query.toString();
  const endpoint = qs ? `/products?${qs}` : '/products';
  const res = await fetchJson<ApiResponse<Product[]>>(endpoint);
  return res.data || [];
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
  const res = await fetchJson<ApiResponse<RegisteredUser>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || 'Không thể đăng nhập');
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

export async function postLogout(): Promise<void> {
  await fetchJson<ApiResponse<never>>('/auth/logout', {
    method: 'POST',
  });
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

export async function postNutritionImage(image: File, token: string): Promise<NutritionImagePrediction> {
  const preparedImage = await prepareNutritionImage(image);
  const response = await fetch(`${API_BASE}/chat/nutrition-images`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': preparedImage.type || 'application/octet-stream',
      Authorization: `Bearer ${token}`,
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
