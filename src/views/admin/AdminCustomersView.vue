<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  HeartPulse,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Save,
  ShoppingBag,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-vue-next';
import { AdminCustomer, AdminCustomerListResponse } from '../../types';
import {
  AdminCustomerMutationInput,
  AdminCustomerQuery,
  createAdminCustomer,
  deleteAdminCustomer,
  fetchAdminCustomers,
  updateAdminCustomer,
} from '../../services/api';

const searchQuery = ref('');
const activeSegment = ref<NonNullable<AdminCustomerQuery['segment']>>('all');
const nutritionGoalFilter = ref<NonNullable<AdminCustomerQuery['nutritionGoal']>>('all');
const bmiProfileFilter = ref<NonNullable<AdminCustomerQuery['bmiProfile']>>('all');
const orderFilter = ref<NonNullable<AdminCustomerQuery['orders']>>('all');
const page = ref(1);
const pageData = ref<AdminCustomerListResponse | null>(null);
const isLoading = ref(false);
const isExporting = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const isFormOpen = ref(false);
const pendingDeleteCustomer = ref<AdminCustomer | null>(null);
const isDeleting = ref(false);
const deleteError = ref('');
const editingCustomer = ref<AdminCustomer | null>(null);
const selectedCustomer = ref<AdminCustomer | null>(null);
const formError = ref('');
const failedAvatarIds = ref(new Set<string>());
const customerForm = ref<AdminCustomerMutationInput>(emptyCustomerForm());
const totalPages = computed(() => Math.max(pageData.value?.totalPages ?? 0, 1));
const firstVisibleRow = computed(() =>
  pageData.value?.customers.length ? (page.value - 1) * pageData.value.limit + 1 : 0,
);
const lastVisibleRow = computed(() =>
  pageData.value ? firstVisibleRow.value + pageData.value.customers.length - 1 : 0,
);
const summaryCards = computed(() => [
  {
    label: 'Tổng khách hàng',
    value: pageData.value?.totalCustomers.toLocaleString('vi-VN') ?? '—',
    detail: 'Đếm trực tiếp từ bảng customers',
    icon: Users,
  },
  {
    label: 'Đã thiết lập mục tiêu BMI',
    value: pageData.value?.bmiGoalCustomerCount.toLocaleString('vi-VN') ?? '—',
    detail: pageData.value
      ? `${pageData.value.totalCustomers
        ? Math.round((pageData.value.bmiGoalCustomerCount / pageData.value.totalCustomers) * 100)
        : 0}% tổng khách hàng · dữ liệu Neon`
      : 'health_profiles liên kết với customers',
    icon: Activity,
  },
  {
    label: 'Tương tác với NutriBot thường xuyên',
    value: pageData.value?.frequentChatCustomerCount.toLocaleString('vi-VN') ?? '—',
    detail: '≥5 tin nhắn khách trong 30 ngày · dữ liệu Neon',
    icon: MessageCircle,
  },
]);

function emptyCustomerForm(): AdminCustomerMutationInput {
  return {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    heightCm: null,
    weightKg: null,
    nutritionGoal: null,
  };
}

function currentFilters(): AdminCustomerQuery {
  return {
    search: searchQuery.value,
    segment: activeSegment.value,
    nutritionGoal: nutritionGoalFilter.value,
    bmiProfile: bmiProfileFilter.value,
    orders: orderFilter.value,
    page: page.value,
  };
}

let requestId = 0;
async function loadCustomers() {
  const currentRequestId = ++requestId;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const result = await fetchAdminCustomers(currentFilters());
    if (currentRequestId === requestId) {
      pageData.value = result;
      failedAvatarIds.value = new Set<string>();
      if (selectedCustomer.value) {
        selectedCustomer.value = result.customers.find(
          (customer) => customer.id === selectedCustomer.value?.id,
        ) ?? selectedCustomer.value;
      }
    }
  } catch (error: unknown) {
    if (currentRequestId === requestId) {
      errorMessage.value = error instanceof Error
        ? error.message
        : 'Không thể tải danh sách khách hàng.';
    }
  } finally {
    if (currentRequestId === requestId) isLoading.value = false;
  }
}

watch([searchQuery, activeSegment, nutritionGoalFilter, bmiProfileFilter, orderFilter], (_value, _oldValue, onCleanup) => {
  page.value = 1;
  const currentRequestId = ++requestId;
  isLoading.value = true;
  errorMessage.value = '';
  const timeoutId = window.setTimeout(async () => {
    if (currentRequestId === requestId) await loadCustomers();
  }, 250);
  onCleanup(() => window.clearTimeout(timeoutId));
});

watch(page, () => {
  void loadCustomers();
});

onMounted(() => {
  void loadCustomers();
});

function formatCsvCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function formatChatDate(value: string | null): string {
  if (!value) return 'Chưa chat trong 30 ngày';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatNumber(value: number | null, maximumFractionDigits = 1): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(value);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNutritionGoal(goal: string | null): string {
  if (!goal) return 'Chưa thiết lập mục tiêu';
  const labels: Record<string, string> = {
    lose_weight: 'Giảm cân',
    maintain_weight: 'Duy trì cân nặng',
    gain_weight: 'Tăng cân',
  };
  return labels[goal] ?? goal;
}

function getCustomerInitials(name: string | null, id: string): string {
  if (!name?.trim()) return id.slice(-2);
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi-VN');
}

function openCreateCustomer() {
  selectedCustomer.value = null;
  editingCustomer.value = null;
  customerForm.value = emptyCustomerForm();
  isFormOpen.value = true;
  formError.value = '';
  errorMessage.value = '';
}

function openEditCustomer(customer: AdminCustomer) {
  selectedCustomer.value = null;
  editingCustomer.value = customer;
  customerForm.value = {
    fullName: customer.name ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    heightCm: customer.heightCm,
    weightKg: customer.weightKg,
    nutritionGoal: customer.nutritionGoal === 'lose_weight'
      || customer.nutritionGoal === 'maintain_weight'
      || customer.nutritionGoal === 'gain_weight'
      ? customer.nutritionGoal
      : null,
  };
  isFormOpen.value = true;
  formError.value = '';
  errorMessage.value = '';
}

function showCustomerDetails(customer: AdminCustomer) {
  selectedCustomer.value = customer;
}

function handleCustomerRowKeydown(event: KeyboardEvent, customer: AdminCustomer) {
  if (event.target !== event.currentTarget) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    showCustomerDetails(customer);
  }
}

function updateFormMeasurement(field: 'heightCm' | 'weightKg', event: Event) {
  const value = (event.target as HTMLInputElement).value;
  customerForm.value[field] = value === '' ? null : Number(value);
}

async function submitCustomerForm() {
  isSaving.value = true;
  formError.value = '';
  try {
    const payload: AdminCustomerMutationInput = {
      ...customerForm.value,
      heightCm: customerForm.value.heightCm === null ? null : Number(customerForm.value.heightCm),
      weightKg: customerForm.value.weightKg === null ? null : Number(customerForm.value.weightKg),
      ...(editingCustomer.value ? { password: undefined } : {}),
    };
    if (editingCustomer.value) {
      await updateAdminCustomer(editingCustomer.value.id, payload);
    } else {
      await createAdminCustomer(payload);
    }
    isFormOpen.value = false;
    pageData.value = null;
    await loadCustomers();
  } catch (error: unknown) {
    formError.value = error instanceof Error ? error.message : 'Không thể lưu thông tin khách hàng.';
  } finally {
    isSaving.value = false;
  }
}

function removeCustomer(customer: AdminCustomer) {
  pendingDeleteCustomer.value = customer;
  deleteError.value = '';
}

async function confirmRemoveCustomer() {
  const customer = pendingDeleteCustomer.value;
  if (!customer || isDeleting.value) return;
  isDeleting.value = true;
  deleteError.value = '';
  errorMessage.value = '';
  try {
    await deleteAdminCustomer(customer.id);
    pendingDeleteCustomer.value = null;
    const remaining = Math.max((pageData.value?.total ?? 1) - 1, 0);
    page.value = Math.min(page.value, Math.max(Math.ceil(remaining / (pageData.value?.limit ?? 20)), 1));
    pageData.value = null;
    await loadCustomers();
  } catch (error: unknown) {
    deleteError.value = error instanceof Error ? error.message : 'Không thể xóa khách hàng.';
  } finally {
    isDeleting.value = false;
  }
}

function markAvatarFailed(id: string) {
  failedAvatarIds.value.add(id);
}

async function exportCsv() {
  isExporting.value = true;
  errorMessage.value = '';
  try {
    const filters = currentFilters();
    const firstPage = await fetchAdminCustomers({
      ...filters,
      page: 1,
      limit: 1000,
      includeAvatars: false,
    });
    const customers = [...firstPage.customers];
    for (let currentPage = 2; currentPage <= firstPage.totalPages; currentPage += 1) {
      const result = await fetchAdminCustomers({
        ...filters,
        page: currentPage,
        limit: 1000,
        includeAvatars: false,
      });
      customers.push(...result.customers);
    }

    const csv = [
      [
        'Mã khách hàng',
        'Họ tên',
        'Email',
        'Số điện thoại',
        'BMI',
        'Chiều cao (cm)',
        'Cân nặng (kg)',
        'Mục tiêu dinh dưỡng',
        'Chi tiêu đơn hoàn tất',
        'Tổng số đơn',
        'Đơn hoàn tất',
        'Tin nhắn khách trong 30 ngày',
        'Cuộc hội thoại',
        'Lần chat gần nhất',
      ],
      ...customers.map((customer) => [
        customer.id,
        customer.name ?? '',
        customer.email ?? '',
        customer.phone ?? '',
        customer.bmi === null ? '' : String(customer.bmi),
        customer.heightCm === null ? '' : String(customer.heightCm),
        customer.weightKg === null ? '' : String(customer.weightKg),
        formatNutritionGoal(customer.nutritionGoal),
        String(customer.totalSpent),
        String(customer.orderCount),
        String(customer.completedOrderCount),
        String(customer.recentChatMessages),
        String(customer.recentChatConversations),
        formatChatDate(customer.lastChatAt),
      ]),
    ].map((row) => row.map(formatCsvCell).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khach-hang-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Không thể xuất danh sách khách hàng.';
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-heading text-2xl font-black text-[#2D3B1E] sm:text-3xl">
          Quản lý khách hàng & Hồ sơ thể trạng
        </h1>
        <p class="mt-1 text-sm text-[#7A866E]">Danh sách khách hàng được lấy trực tiếp từ cơ sở dữ liệu.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          @click="openCreateCustomer"
          class="inline-flex items-center gap-2 rounded-xl bg-[#536124] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#434F1D]"
        >
          <Plus class="h-4 w-4" />
          Thêm khách hàng
        </button>
        <button
          type="button"
          :disabled="isExporting || isLoading"
          @click="exportCsv"
          class="inline-flex items-center gap-2 rounded-xl border border-[#CCD7BC] bg-white px-4 py-2.5 text-xs font-bold text-[#576449] shadow-2xs hover:bg-[#FAF9F5] disabled:cursor-wait disabled:opacity-60"
        >
          <Download class="h-4 w-4" />
          {{ isExporting ? 'Đang xuất…' : 'Xuất CSV' }}
        </button>
        <button
          type="button"
          :disabled="isLoading"
          @click="loadCustomers"
          class="inline-flex items-center gap-2 rounded-xl bg-[#536124] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#434F1D] disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
          Làm mới
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-3xl border border-[#E3E8DC] bg-white p-5 shadow-2xs"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="text-xs text-[#7A866E]">{{ card.label }}</div>
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EBF1E6] text-[#4D6A34]">
            <component :is="card.icon" class="h-4 w-4" />
          </span>
        </div>
        <div class="mt-2 break-all font-heading text-xl font-black text-[#2D3B1E]">{{ card.value }}</div>
        <p class="mt-1 text-[11px] text-[#7A866E]">{{ card.detail }}</p>
      </article>
    </div>

    <section class="space-y-5 rounded-3xl border border-[#E3E8DC] bg-white p-5 shadow-2xs sm:p-6">
      <div class="flex items-center gap-3 border-b border-[#F0F3EC] pb-3">
        <button
          type="button"
          @click="activeSegment = 'all'"
          class="rounded-full px-4 py-2 text-xs font-bold transition-colors"
          :class="activeSegment === 'all' ? 'bg-[#536124] text-white' : 'text-[#7A866E] hover:bg-[#FAF9F5]'"
        >
          Tất cả khách hàng ({{ pageData?.totalCustomers.toLocaleString('vi-VN') ?? '—' }})
        </button>
        <button
          type="button"
          @click="activeSegment = 'frequent'"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors"
          :class="activeSegment === 'frequent' ? 'bg-[#536124] text-white' : 'text-[#7A866E] hover:bg-[#FAF9F5]'"
        >
          <MessageCircle class="h-3.5 w-3.5" />
          Tương tác thường xuyên ({{ pageData?.frequentChatCustomerCount.toLocaleString('vi-VN') ?? '—' }})
        </button>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label class="relative block w-full sm:max-w-md">
          <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A866E]" />
          <input
            v-model="searchQuery"
            type="search"
            maxlength="100"
            placeholder="Tìm tên, số điện thoại, email hoặc mã khách hàng..."
            class="w-full rounded-2xl border border-[#DEE5D4] bg-[#FAF9F5] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#536124] focus:bg-white"
          />
        </label>
        <label class="block">
          <span class="sr-only">Lọc theo mục tiêu dinh dưỡng</span>
          <select
            v-model="nutritionGoalFilter"
            class="w-full rounded-2xl border border-[#DEE5D4] bg-[#FAF9F5] px-3 py-2.5 text-sm text-[#576449] outline-none focus:border-[#536124] focus:bg-white"
          >
            <option value="all">Mục tiêu dinh dưỡng: Tất cả</option>
            <option value="lose_weight">Giảm cân</option>
            <option value="maintain_weight">Duy trì cân nặng</option>
            <option value="gain_weight">Tăng cân</option>
            <option value="unset">Chưa thiết lập mục tiêu</option>
          </select>
        </label>
        <label class="block">
          <span class="sr-only">Lọc theo hồ sơ BMI</span>
          <select
            v-model="bmiProfileFilter"
            class="w-full rounded-2xl border border-[#DEE5D4] bg-[#FAF9F5] px-3 py-2.5 text-sm text-[#576449] outline-none focus:border-[#536124] focus:bg-white"
          >
            <option value="all">Hồ sơ BMI: Tất cả</option>
            <option value="set">Đã có chỉ số BMI</option>
            <option value="unset">Chưa có chỉ số BMI</option>
          </select>
        </label>
        <label class="block">
          <span class="sr-only">Lọc theo đơn hàng</span>
          <select
            v-model="orderFilter"
            class="w-full rounded-2xl border border-[#DEE5D4] bg-[#FAF9F5] px-3 py-2.5 text-sm text-[#576449] outline-none focus:border-[#536124] focus:bg-white"
          >
            <option value="all">Đơn hàng: Tất cả</option>
            <option value="has_orders">Có đơn hàng</option>
            <option value="no_orders">Chưa có đơn hàng</option>
          </select>
        </label>
      </div>

      <p v-if="errorMessage" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </p>

      <div class="overflow-hidden rounded-2xl border border-[#E3E8DC]">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1120px] text-left text-sm">
          <thead class="border-b border-[#E3E8DC] bg-[#FAF9F5] text-[10px] uppercase text-[#7A866E]">
            <tr>
              <th class="w-12 px-3 py-3 text-center font-bold">#</th>
              <th class="min-w-52 px-4 py-3 font-bold">Khách hàng</th>
              <th class="min-w-48 px-4 py-3 font-bold">Chỉ số BMI & thể trạng</th>
              <th class="min-w-44 px-4 py-3 font-bold">Mục tiêu dinh dưỡng</th>
              <th class="min-w-40 px-4 py-3 font-bold">Tổng chi tiêu / đơn</th>
              <th class="min-w-56 px-4 py-3 font-bold">Tương tác NutriBot</th>
              <th class="w-24 px-4 py-3 text-center font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F0F3EC]">
            <tr v-if="isLoading && !pageData">
              <td colspan="7" class="py-12 text-center text-sm text-[#7A866E]">Đang tải khách hàng…</td>
            </tr>
            <tr v-else-if="!pageData?.customers.length">
              <td colspan="7" class="py-12 text-center text-sm text-[#7A866E]">
                {{ isLoading ? 'Đang tải khách hàng…' : activeSegment === 'frequent' ? 'Chưa có khách hàng nào đạt ngưỡng tương tác thường xuyên.' : 'Không tìm thấy khách hàng.' }}
              </td>
            </tr>
            <tr
              v-for="(customer, index) in pageData?.customers"
              :key="customer.id"
              tabindex="0"
              :aria-label="`Xem thông tin chi tiết ${customer.name || `khách hàng ${customer.id}`}`"
              @click="showCustomerDetails(customer)"
              @keydown="handleCustomerRowKeydown($event, customer)"
              class="customer-row cursor-pointer transition-all duration-200 even:bg-[#FCFCFA] hover:bg-[#EBF1E6] focus-visible:bg-[#EBF1E6] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#536124]"
              :class="{ 'is-selected': selectedCustomer?.id === customer.id }"
            >
              <td class="px-3 py-4 text-center text-xs text-[#7A866E]">{{ firstVisibleRow + index }}</td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <span class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#CCD7BC] bg-[#EBF7E5] text-xs font-bold text-[#536124]">
                    {{ getCustomerInitials(customer.name, customer.id) }}
                    <img
                      v-if="customer.avatarUrl && !failedAvatarIds.has(customer.id)"
                      :key="`${customer.id}-${customer.avatarUrl}`"
                      :src="customer.avatarUrl"
                      :alt="`Ảnh đại diện ${customer.name || `khách hàng ${customer.id}`}`"
                      class="absolute inset-0 h-full w-full object-cover"
                      @error="markAvatarFailed(customer.id)"
                    />
                  </span>
                  <div class="min-w-0">
                    <span class="block font-bold text-[#2D3B1E]">{{ customer.name || `Khách hàng #${customer.id}` }}</span>
                    <span class="mt-0.5 block truncate text-[11px] text-[#7A866E]">
                      {{ customer.email || customer.phone || `Mã khách hàng #${customer.id}` }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <span class="block font-bold text-[#2D3B1E]">
                  BMI: {{ customer.bmi === null ? 'Chưa có' : formatNumber(customer.bmi, 1) }}
                </span>
                <span class="mt-1 block text-[11px] text-[#7A866E]">
                  Chiều cao: {{ formatNumber(customer.heightCm) }} cm · Cân nặng: {{ formatNumber(customer.weightKg) }} kg
                </span>
              </td>
              <td class="px-4 py-4 text-xs font-semibold text-[#576449]">{{ formatNutritionGoal(customer.nutritionGoal) }}</td>
              <td class="px-4 py-4">
                <span class="block font-bold text-[#2D3B1E]">{{ formatMoney(customer.totalSpent) }}</span>
                <span class="mt-1 block text-[11px] text-[#7A866E]">
                  {{ customer.orderCount }} đơn · {{ customer.completedOrderCount }} đơn hoàn tất
                </span>
              </td>
              <td class="px-4 py-4">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  :class="customer.lastChatAt ? 'bg-[#EBF7E5] text-[#3B4E24]' : 'bg-[#FAF9F5] text-[#7A866E]'"
                >
                  <MessageCircle class="h-3 w-3" />
                  {{ customer.lastChatAt ? 'Hoạt động' : 'Chưa tương tác' }}
                </span>
                <span class="mt-1 block text-[11px] text-[#7A866E]">
                  {{ formatChatDate(customer.lastChatAt) }} · {{ customer.recentChatMessages }} tin nhắn ·
                  {{ customer.recentChatConversations }} hội thoại
                </span>
              </td>
              <td class="px-3 py-4">
                <div class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    :aria-label="`Sửa khách hàng ${customer.name || customer.id}`"
                    title="Sửa thông tin"
                    @click.stop="openEditCustomer(customer)"
                    class="customer-action-button customer-action-edit rounded-lg p-2 text-[#64734B]"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    :aria-label="`Xóa khách hàng ${customer.name || customer.id}`"
                    :title="customer.orderCount ? 'Không thể xóa khách hàng đã có đơn hàng' : 'Xóa khách hàng'"
                    :disabled="customer.orderCount > 0"
                    @click.stop="removeCustomer(customer)"
                    class="customer-action-button customer-action-delete rounded-lg p-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-col gap-3 border-t border-[#F0F3EC] pt-4 text-sm text-[#7A866E] sm:flex-row sm:items-center sm:justify-between">
        <span>
          {{ pageData?.total ? `Hiển thị ${firstVisibleRow}–${lastVisibleRow} trong tổng số ${pageData.total.toLocaleString('vi-VN')} khách hàng` : 'Chưa có khách hàng' }}
        </span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="page <= 1 || isLoading"
            @click="page -= 1"
            aria-label="Trang trước"
            class="rounded-lg border border-[#DEE5D4] p-2 hover:bg-[#FAF9F5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="min-w-20 text-center font-semibold text-[#576449]">Trang {{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            :disabled="page >= totalPages || isLoading"
            @click="page += 1"
            aria-label="Trang tiếp theo"
            class="rounded-lg border border-[#DEE5D4] p-2 hover:bg-[#FAF9F5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>

    <div
      v-if="selectedCustomer"
      class="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      @click.self="selectedCustomer = null"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-customer-details-title"
        class="my-auto flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(16,24,16,0.28)] sm:max-h-[calc(100vh-3rem)]"
      >
        <div class="relative shrink-0 overflow-hidden bg-linear-to-br from-[#2D3B1E] via-[#536124] to-[#82925B] px-5 py-4 text-white sm:px-7">
          <div class="pointer-events-none absolute -right-10 -top-20 h-48 w-48 rounded-full border border-white/10"></div>
          <div class="pointer-events-none absolute -right-2 -top-12 h-32 w-32 rounded-full border border-white/10"></div>
          <div class="relative flex items-start justify-between gap-4">
            <div class="flex min-w-0 items-center gap-4">
              <div class="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/70 bg-white/15 text-lg font-bold text-white shadow-lg sm:h-16 sm:w-16">
                {{ getCustomerInitials(selectedCustomer.name, selectedCustomer.id) }}
                <img
                  v-if="selectedCustomer.avatarUrl && !failedAvatarIds.has(selectedCustomer.id)"
                  :key="`${selectedCustomer.id}-${selectedCustomer.avatarUrl}-details`"
                  :src="selectedCustomer.avatarUrl"
                  :alt="`Ảnh đại diện ${selectedCustomer.name || `khách hàng ${selectedCustomer.id}`}`"
                  class="absolute inset-0 h-full w-full object-cover"
                  @error="markAvatarFailed(selectedCustomer.id)"
                />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">Hồ sơ khách hàng</p>
                <h2 id="admin-customer-details-title" class="mt-1 truncate font-heading text-xl font-black sm:text-2xl">
                  {{ selectedCustomer.name || `Khách hàng #${selectedCustomer.id}` }}
                </h2>
                <p class="mt-1 truncate text-sm text-white/75">
                  {{ selectedCustomer.email || selectedCustomer.phone || `Mã khách hàng #${selectedCustomer.id}` }}
                </p>
                <span class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white">
                  <span class="h-1.5 w-1.5 rounded-full" :class="selectedCustomer.lastChatAt ? 'bg-[#C7E58B]' : 'bg-white/50'"></span>
                  {{ selectedCustomer.lastChatAt ? 'Đang hoạt động' : 'Chưa tương tác gần đây' }}
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Đóng chi tiết khách hàng"
              @click="selectedCustomer = null"
              class="shrink-0 rounded-xl bg-white/10 p-2.5 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          <p class="relative mt-3 border-t border-white/15 pt-2 text-[11px] text-white/65">
            Mã khách hàng <span class="font-semibold text-white">#{{ selectedCustomer.id }}</span>
          </p>
        </div>

        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          <div class="grid grid-cols-3 gap-2.5">
            <article class="rounded-2xl border border-[#E8ECE3] bg-[#FAF9F5] p-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#536124] shadow-xs">
                <ShoppingBag class="h-3.5 w-3.5" />
              </span>
              <p class="mt-2 text-[10px] font-semibold text-[#7A866E] sm:text-[11px]">Tổng chi tiêu</p>
              <p class="mt-0.5 truncate text-xs font-black text-[#2D3B1E] sm:text-sm">{{ formatMoney(selectedCustomer.totalSpent) }}</p>
            </article>
            <article class="rounded-2xl border border-[#E8ECE3] bg-[#FAF9F5] p-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#536124] shadow-xs">
                <HeartPulse class="h-3.5 w-3.5" />
              </span>
              <p class="mt-2 text-[10px] font-semibold text-[#7A866E] sm:text-[11px]">Chỉ số BMI</p>
              <p class="mt-0.5 truncate text-xs font-black text-[#2D3B1E] sm:text-sm">
                {{ selectedCustomer.bmi === null ? 'Chưa có' : formatNumber(selectedCustomer.bmi, 1) }}
              </p>
            </article>
            <article class="rounded-2xl border border-[#E8ECE3] bg-[#FAF9F5] p-3">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#536124] shadow-xs">
                <MessageCircle class="h-3.5 w-3.5" />
              </span>
              <p class="mt-2 text-[10px] font-semibold text-[#7A866E] sm:text-[11px]">Tin nhắn NutriBot</p>
              <p class="mt-0.5 truncate text-xs font-black text-[#2D3B1E] sm:text-sm">{{ selectedCustomer.recentChatMessages }}</p>
            </article>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <article class="rounded-2xl border border-[#E8ECE3] bg-white p-3.5 sm:p-4">
              <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#536124]">
                <Mail class="h-4 w-4" /> Thông tin liên hệ
              </h3>
              <dl class="mt-3 space-y-3 text-sm">
                <div class="flex gap-3">
                  <Mail class="mt-0.5 h-4 w-4 shrink-0 text-[#9AA58B]" />
                  <div class="min-w-0">
                    <dt class="text-[11px] text-[#7A866E]">Email</dt>
                    <dd class="mt-0.5 break-all font-semibold text-[#2D3B1E]">{{ selectedCustomer.email || 'Chưa cập nhật' }}</dd>
                  </div>
                </div>
                <div class="flex gap-3">
                  <Phone class="mt-0.5 h-4 w-4 shrink-0 text-[#9AA58B]" />
                  <div>
                    <dt class="text-[11px] text-[#7A866E]">Số điện thoại</dt>
                    <dd class="mt-0.5 font-semibold text-[#2D3B1E]">{{ selectedCustomer.phone || 'Chưa cập nhật' }}</dd>
                  </div>
                </div>
              </dl>
            </article>
            <article class="rounded-2xl border border-[#E8ECE3] bg-white p-3.5 sm:p-4">
              <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#536124]">
                <HeartPulse class="h-4 w-4" /> Hồ sơ thể trạng
              </h3>
              <dl class="mt-3 space-y-2.5 text-sm">
                <div>
                  <dt class="text-[11px] text-[#7A866E]">Chiều cao / Cân nặng</dt>
                  <dd class="mt-0.5 font-semibold text-[#2D3B1E]">
                    {{ formatNumber(selectedCustomer.heightCm) }} cm <span class="text-[#A3AC98]">/</span> {{ formatNumber(selectedCustomer.weightKg) }} kg
                  </dd>
                </div>
                <div>
                  <dt class="text-[11px] text-[#7A866E]">Mục tiêu dinh dưỡng</dt>
                  <dd class="mt-0.5 font-semibold text-[#2D3B1E]">{{ formatNutritionGoal(selectedCustomer.nutritionGoal) }}</dd>
                </div>
              </dl>
            </article>
            <article class="rounded-2xl border border-[#E8ECE3] bg-white p-3.5 sm:p-4">
              <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#536124]">
                <ShoppingBag class="h-4 w-4" /> Lịch sử đơn hàng
              </h3>
              <dl class="mt-3 space-y-2.5 text-sm">
                <div>
                  <dt class="text-[11px] text-[#7A866E]">Số đơn hàng</dt>
                  <dd class="mt-0.5 font-semibold text-[#2D3B1E]">{{ selectedCustomer.orderCount }} đơn</dd>
                </div>
                <div>
                  <dt class="text-[11px] text-[#7A866E]">Đơn hoàn tất</dt>
                  <dd class="mt-0.5 font-semibold text-[#2D3B1E]">{{ selectedCustomer.completedOrderCount }} đơn</dd>
                </div>
              </dl>
            </article>
            <article class="rounded-2xl border border-[#E8ECE3] bg-white p-3.5 sm:p-4">
              <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#536124]">
                <Sparkles class="h-4 w-4" /> Tương tác NutriBot · 30 ngày
              </h3>
              <dl class="mt-3 space-y-2.5 text-sm">
                <div>
                  <dt class="text-[11px] text-[#7A866E]">Cuộc hội thoại</dt>
                  <dd class="mt-0.5 font-semibold text-[#2D3B1E]">{{ selectedCustomer.recentChatConversations }}</dd>
                </div>
                <div>
                  <dt class="text-[11px] text-[#7A866E]">Tương tác gần nhất</dt>
                  <dd class="mt-0.5 font-semibold text-[#2D3B1E]">{{ formatChatDate(selectedCustomer.lastChatAt) }}</dd>
                </div>
              </dl>
            </article>
          </div>
        </div>

        <div class="flex shrink-0 flex-col-reverse gap-2 border-t border-[#F0F3EC] bg-[#FCFCFA] px-5 py-3 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            @click="selectedCustomer = null"
            class="rounded-xl border border-[#DEE5D4] bg-white px-4 py-2.5 text-sm font-semibold text-[#576449] transition hover:bg-[#F4F7EF]"
          >
            Đóng
          </button>
          <button
            type="button"
            @click="openEditCustomer(selectedCustomer)"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#536124] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#434F1D] hover:shadow-md"
          >
            <Pencil class="h-4 w-4" />
            Chỉnh sửa thông tin
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="isFormOpen"
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      @click.self="!isSaving && (isFormOpen = false)"
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-customer-form-title"
        @submit.prevent="submitCustomerForm"
        class="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(16,24,16,0.28)]"
      >
        <div class="flex shrink-0 items-start justify-between gap-4 bg-linear-to-r from-[#2D3B1E] to-[#647642] px-5 py-5 text-white sm:px-7">
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Pencil v-if="editingCustomer" class="h-5 w-5" />
              <Users v-else class="h-5 w-5" />
            </span>
            <div class="min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
                {{ editingCustomer ? 'Cập nhật hồ sơ' : 'Quản lý khách hàng' }}
              </p>
              <h2 id="admin-customer-form-title" class="mt-0.5 truncate font-heading text-lg font-black sm:text-xl">
                {{ editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới' }}
              </h2>
              <p class="mt-1 truncate text-xs text-white/75">
                {{ editingCustomer ? `Mã khách hàng #${editingCustomer.id}` : 'Tạo tài khoản và hồ sơ dinh dưỡng.' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="isSaving"
            aria-label="Đóng biểu mẫu"
            @click="isFormOpen = false"
            class="shrink-0 rounded-xl p-2.5 text-white/75 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          <p v-if="formError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ formError }}
          </p>

          <section>
            <h3 class="text-xs font-bold uppercase tracking-wide text-[#536124]">Thông tin tài khoản</h3>
            <div class="mt-3 grid gap-4 sm:grid-cols-2">
              <label class="space-y-1.5 text-sm font-semibold text-[#576449]">
                Họ và tên
                <input
                  v-model="customerForm.fullName"
                  type="text"
                  maxlength="150"
                  required
                  autocomplete="name"
                  class="w-full rounded-xl border border-[#DEE5D4] bg-[#FCFCFA] px-3.5 py-3 font-normal outline-none transition focus:border-[#536124] focus:bg-white focus:ring-2 focus:ring-[#536124]/10"
                />
              </label>
              <label class="space-y-1.5 text-sm font-semibold text-[#576449]">
                Email
                <input
                  v-model="customerForm.email"
                  type="email"
                  maxlength="255"
                  required
                  autocomplete="email"
                  class="w-full rounded-xl border border-[#DEE5D4] bg-[#FCFCFA] px-3.5 py-3 font-normal outline-none transition focus:border-[#536124] focus:bg-white focus:ring-2 focus:ring-[#536124]/10"
                />
              </label>
              <label class="space-y-1.5 text-sm font-semibold text-[#576449]">
                Số điện thoại
                <input
                  v-model="customerForm.phone"
                  type="tel"
                  maxlength="20"
                  autocomplete="tel"
                  class="w-full rounded-xl border border-[#DEE5D4] bg-[#FCFCFA] px-3.5 py-3 font-normal outline-none transition focus:border-[#536124] focus:bg-white focus:ring-2 focus:ring-[#536124]/10"
                />
              </label>
              <label v-if="!editingCustomer" class="space-y-1.5 text-sm font-semibold text-[#576449]">
                Mật khẩu ban đầu
                <input
                  v-model="customerForm.password"
                  type="password"
                  minlength="8"
                  maxlength="128"
                  required
                  autocomplete="new-password"
                  class="w-full rounded-xl border border-[#DEE5D4] bg-[#FCFCFA] px-3.5 py-3 font-normal outline-none transition focus:border-[#536124] focus:bg-white focus:ring-2 focus:ring-[#536124]/10"
                />
              </label>
            </div>
          </section>

          <section class="border-t border-[#F0F3EC] pt-5">
            <h3 class="text-xs font-bold uppercase tracking-wide text-[#536124]">Hồ sơ dinh dưỡng</h3>
            <div class="mt-3 grid gap-4 sm:grid-cols-2">
              <label class="space-y-1.5 text-sm font-semibold text-[#576449]">
                Chiều cao (cm)
                <input
                  :value="customerForm.heightCm ?? ''"
                  type="number"
                  min="1"
                  max="300"
                  step="0.1"
                  @input="updateFormMeasurement('heightCm', $event)"
                  class="w-full rounded-xl border border-[#DEE5D4] bg-[#FCFCFA] px-3.5 py-3 font-normal outline-none transition focus:border-[#536124] focus:bg-white focus:ring-2 focus:ring-[#536124]/10"
                />
              </label>
              <label class="space-y-1.5 text-sm font-semibold text-[#576449]">
                Cân nặng (kg)
                <input
                  :value="customerForm.weightKg ?? ''"
                  type="number"
                  min="1"
                  max="700"
                  step="0.1"
                  @input="updateFormMeasurement('weightKg', $event)"
                  class="w-full rounded-xl border border-[#DEE5D4] bg-[#FCFCFA] px-3.5 py-3 font-normal outline-none transition focus:border-[#536124] focus:bg-white focus:ring-2 focus:ring-[#536124]/10"
                />
              </label>
              <label class="space-y-1.5 text-sm font-semibold text-[#576449] sm:col-span-2">
                Mục tiêu dinh dưỡng
                <select
                  v-model="customerForm.nutritionGoal"
                  class="w-full rounded-xl border border-[#DEE5D4] bg-white px-3.5 py-3 font-normal outline-none transition focus:border-[#536124] focus:ring-2 focus:ring-[#536124]/10"
                >
                  <option :value="null">Chưa thiết lập</option>
                  <option value="lose_weight">Giảm cân</option>
                  <option value="maintain_weight">Duy trì cân nặng</option>
                  <option value="gain_weight">Tăng cân</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        <div class="flex shrink-0 flex-col-reverse justify-end gap-2 border-t border-[#F0F3EC] bg-[#FCFCFA] px-5 py-4 sm:flex-row sm:px-7">
          <button
            type="button"
            :disabled="isSaving"
            @click="isFormOpen = false"
            class="rounded-xl border border-[#DEE5D4] bg-white px-4 py-2.5 text-sm font-semibold text-[#576449] transition hover:bg-[#F4F7EF] disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#536124] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#434F1D] hover:shadow-md disabled:cursor-wait disabled:opacity-60"
          >
            <Save class="h-4 w-4" />
            {{ isSaving ? 'Đang lưu…' : editingCustomer ? 'Lưu thay đổi' : 'Tạo khách hàng' }}
          </button>
        </div>
      </form>
    </div>

    <div
      v-if="pendingDeleteCustomer"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      @click.self="!isDeleting && (pendingDeleteCustomer = null)"
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-customer-delete-title"
        aria-describedby="admin-customer-delete-description"
        class="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(16,24,16,0.28)]"
      >
        <div class="flex items-start gap-4 px-5 pb-4 pt-6 sm:px-6">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle class="h-6 w-6" />
          </span>
          <div class="min-w-0 flex-1">
            <h2 id="admin-customer-delete-title" class="font-heading text-lg font-black text-[#2D3B1E]">
              Xóa khách hàng?
            </h2>
            <p class="mt-1 break-words text-sm font-semibold text-[#536124]">
              {{ pendingDeleteCustomer.name || `Khách hàng #${pendingDeleteCustomer.id}` }}
            </p>
          </div>
          <button
            type="button"
            :disabled="isDeleting"
            aria-label="Đóng xác nhận xóa"
            class="rounded-xl p-2 text-[#7A866E] transition hover:bg-[#F4F7EF] hover:text-[#2D3B1E] disabled:opacity-50"
            @click="pendingDeleteCustomer = null"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="px-5 pb-5 sm:px-6">
          <p id="admin-customer-delete-description" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Thao tác này sẽ xóa tài khoản khách hàng và không thể hoàn tác. Chỉ khách hàng chưa có đơn hàng mới có thể xóa.
          </p>
          <p v-if="deleteError" role="alert" class="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ deleteError }}
          </p>
        </div>
        <div class="flex flex-col-reverse gap-2 border-t border-[#F0F3EC] bg-[#FCFCFA] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            :disabled="isDeleting"
            class="rounded-xl border border-[#DEE5D4] bg-white px-4 py-2.5 text-sm font-semibold text-[#576449] transition hover:bg-[#F4F7EF] disabled:opacity-50"
            @click="pendingDeleteCustomer = null"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="isDeleting"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
            @click="confirmRemoveCustomer"
          >
            <Trash2 class="h-4 w-4" />
            {{ isDeleting ? 'Đang xóa…' : 'Xóa khách hàng' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.customer-row > td {
  transition:
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.customer-row > td:nth-child(2) > div > span {
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.customer-row:hover > td,
.customer-row:focus-visible > td {
  background-color: #ebf1e6;
}

.customer-row:hover > td:nth-child(2) > div > span,
.customer-row:focus-visible > td:nth-child(2) > div > span {
  transform: scale(1.06);
  box-shadow: 0 3px 8px rgb(45 59 30 / 16%);
}

.customer-row.is-selected > td {
  background-color: #ebf1e6;
}

.customer-row:hover > td:first-child,
.customer-row:focus-visible > td:first-child,
.customer-row.is-selected > td:first-child {
  box-shadow: inset 4px 0 0 #536124;
}

.customer-action-button {
  transition:
    background-color 150ms ease,
    color 150ms ease,
    transform 150ms ease,
    box-shadow 150ms ease;
}

.customer-action-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgb(45 59 30 / 12%);
}

.customer-action-edit:hover:not(:disabled) {
  color: #2d3b1e;
  background-color: #dce8d2;
}

.customer-action-delete:hover:not(:disabled) {
  color: #b42318;
  background-color: #fee4e2;
}

.customer-action-button:focus-visible {
  outline: 2px solid #536124;
  outline-offset: 2px;
}
</style>
