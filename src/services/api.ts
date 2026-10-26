import {
  ApiResponse,
  Category,
  CreateOrderPayload,
  KnowledgeBaseEntry,
  KnowledgeBaseEntryPayload,
  KnowledgeImportResult,
  Order,
  Product,
  ProductFilterQuery,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
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
      throw new Error(errorMsg);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
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

export interface ChatbotResponse {
  reply: string;
  suggestedProducts: Product[];
  intent?: string;
}

export async function postChatMessage(message: string): Promise<ChatbotResponse> {
  const res = await fetchJson<ApiResponse<ChatbotResponse>>('/chat/ask', {
    method: 'POST',
    body: JSON.stringify({ message }),
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

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  return fetchJson<{ status: string; service: string }>('/health');
}
