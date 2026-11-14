<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVoucherStore } from '../../stores/voucherStore';
import { useToastStore } from '../../stores/toastStore';
import { Voucher, CreateVoucherPayload, UpdateVoucherPayload } from '../../types';
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  Power,
  RefreshCw,
  AlertCircle,
  Users,
  Pencil,
} from 'lucide-vue-next';

const voucherStore = useVoucherStore();
const toastStore = useToastStore();

const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive' | 'expired'>('all');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingVoucherId = ref<string | null>(null);
const isSubmitting = ref(false);
const isLoading = ref(false);

const newVoucher = ref<CreateVoucherPayload>({
  code: '',
  title: '',
  description: '',
  discountType: 'fixed',
  discountValue: 20000,
  minOrderAmount: 150000,
  maxDiscountAmount: undefined,
  targetType: 'all',
  usageLimit: 100,
  endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
  isActive: true,
});

const editingVoucher = ref<{
  code: string;
  title: string;
  description: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | undefined;
  targetType: 'all' | 'first_order';
  usageLimit: number;
  endDate: string;
  isActive: boolean;
}>({
  code: '',
  title: '',
  description: '',
  discountType: 'fixed',
  discountValue: 20000,
  minOrderAmount: 150000,
  maxDiscountAmount: undefined,
  targetType: 'all',
  usageLimit: 100,
  endDate: new Date().toISOString().split('T')[0],
  isActive: true,
});

async function handleRefresh(isManual = false) {
  isLoading.value = true;
  try {
    await voucherStore.loadVouchers(true);
    if (voucherStore.error) {
      toastStore.show(voucherStore.error, 'error');
    } else if (isManual) {
      toastStore.show('Đã cập nhật danh sách voucher mới nhất', 'success');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách voucher';
    toastStore.show(msg, 'error');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void handleRefresh();
});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Không giới hạn';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isExpired(voucher: Voucher): boolean {
  if (!voucher.endDate) return false;
  return new Date(voucher.endDate).getTime() < Date.now();
}

function isExhausted(voucher: Voucher): boolean {
  return voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit;
}

// Thống kê nhanh KPIs
const totalVouchers = computed(() => voucherStore.vouchers.length);
const activeCount = computed(() => voucherStore.vouchers.filter((v) => v.isActive && !isExpired(v) && !isExhausted(v)).length);
const inactiveCount = computed(() => voucherStore.vouchers.filter((v) => !v.isActive).length);
const expiredCount = computed(() => voucherStore.vouchers.filter((v) => isExpired(v) || isExhausted(v)).length);
const totalUsed = computed(() => voucherStore.vouchers.reduce((sum, v) => sum + v.usedCount, 0));
const firstOrderCount = computed(() => voucherStore.vouchers.filter((v) => v.targetType === 'first_order').length);

// Lọc voucher
const filteredVouchers = computed(() => {
  return voucherStore.vouchers.filter((v) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchQuery = !q || v.code.toLowerCase().includes(q) || v.title.toLowerCase().includes(q);
    if (!matchQuery) return false;

    const expired = isExpired(v);
    const exhausted = isExhausted(v);

    if (statusFilter.value === 'active') {
      return v.isActive && !expired && !exhausted;
    }
    if (statusFilter.value === 'inactive') {
      return !v.isActive;
    }
    if (statusFilter.value === 'expired') {
      return expired || exhausted;
    }
    return true;
  });
});

async function handleToggleStatus(voucher: Voucher) {
  try {
    await voucherStore.toggleVoucher(voucher.id);
    toastStore.show(
      `Đã ${voucher.isActive ? 'tạm dừng' : 'kích hoạt'} mã ${voucher.code}`,
      'success'
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái';
    toastStore.show(msg, 'error');
  }
}

async function handleDeleteVoucher(voucher: Voucher) {
  let confirmMessage = `Bạn có chắc chắn muốn xóa vĩnh viễn voucher ${voucher.code}?`;
  if (voucher.usedCount > 0) {
    confirmMessage = `CẢNH BÁO: Voucher ${voucher.code} đã có ${voucher.usedCount} lượt sử dụng trong các đơn hàng!\nViệc xóa có thể ảnh hưởng đến lịch sử tra cứu đơn hàng.\n(Gợi ý: bạn nên dùng nút Tạm dừng thay vì xóa).\n\nBạn vẫn muốn tiếp tục xóa vĩnh viễn?`;
  }

  if (!confirm(confirmMessage)) {
    return;
  }
  try {
    const success = await voucherStore.removeVoucher(voucher.id);
    if (success) {
      toastStore.show(`Đã xóa voucher ${voucher.code}`, 'success');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi xóa voucher';
    toastStore.show(msg, 'error');
  }
}

function openCreateModal() {
  newVoucher.value = {
    code: '',
    title: '',
    description: '',
    discountType: 'fixed',
    discountValue: 20000,
    minOrderAmount: 150000,
    maxDiscountAmount: undefined,
    targetType: 'all',
    usageLimit: 100,
    endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    isActive: true,
  };
  showCreateModal.value = true;
}

function openEditModal(voucher: Voucher) {
  editingVoucherId.value = voucher.id;
  editingVoucher.value = {
    code: voucher.code,
    title: voucher.title,
    description: voucher.description || '',
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    minOrderAmount: voucher.minOrderAmount,
    maxDiscountAmount: voucher.maxDiscountAmount,
    targetType: voucher.targetType,
    usageLimit: voucher.usageLimit,
    endDate: voucher.endDate ? voucher.endDate.split('T')[0] : '',
    isActive: voucher.isActive,
  };
  showEditModal.value = true;
}

async function handleUpdateVoucher() {
  if (!editingVoucherId.value) return;
  if (!editingVoucher.value.title.trim()) {
    toastStore.show('Vui lòng nhập tiêu đề khuyến mãi', 'warning');
    return;
  }
  if (editingVoucher.value.discountValue <= 0) {
    toastStore.show('Giá trị giảm phải lớn hơn 0', 'warning');
    return;
  }
  if (editingVoucher.value.discountType === 'percent' && editingVoucher.value.discountValue > 100) {
    toastStore.show('Phần trăm giảm không được vượt quá 100%', 'warning');
    return;
  }

  isSubmitting.value = true;
  try {
    await voucherStore.editVoucher(editingVoucherId.value, {
      title: editingVoucher.value.title.trim(),
      description: editingVoucher.value.description?.trim(),
      discountType: editingVoucher.value.discountType,
      discountValue: editingVoucher.value.discountValue,
      minOrderAmount: editingVoucher.value.minOrderAmount,
      maxDiscountAmount: editingVoucher.value.discountType === 'percent' ? (editingVoucher.value.maxDiscountAmount || null) : null,
      targetType: editingVoucher.value.targetType,
      usageLimit: editingVoucher.value.usageLimit,
      endDate: editingVoucher.value.endDate ? new Date(editingVoucher.value.endDate).toISOString() : undefined,
      isActive: editingVoucher.value.isActive,
    });
    toastStore.show(`Đã cập nhật thành công voucher ${editingVoucher.value.code}`, 'success');
    showEditModal.value = false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật voucher';
    toastStore.show(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
}

async function handleCreateVoucher() {
  if (!newVoucher.value.code.trim()) {
    toastStore.show('Vui lòng nhập mã voucher', 'warning');
    return;
  }
  if (!newVoucher.value.title.trim()) {
    toastStore.show('Vui lòng nhập tiêu đề khuyến mãi', 'warning');
    return;
  }
  if (newVoucher.value.discountValue <= 0) {
    toastStore.show('Giá trị giảm phải lớn hơn 0', 'warning');
    return;
  }
  if (newVoucher.value.discountType === 'percent' && newVoucher.value.discountValue > 100) {
    toastStore.show('Phần trăm giảm không được vượt quá 100%', 'warning');
    return;
  }

  isSubmitting.value = true;
  try {
    await voucherStore.addVoucher({
      ...newVoucher.value,
      code: newVoucher.value.code.trim().toUpperCase(),
      endDate: new Date(newVoucher.value.endDate).toISOString(),
    });
    toastStore.show(`Đã tạo thành công voucher ${newVoucher.value.code.toUpperCase()}`, 'success');
    showCreateModal.value = false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi tạo voucher';
    toastStore.show(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Page & Action -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Quản lý Voucher & Mã giảm giá
        </h1>
        <p class="text-xs text-[#7A866E] mt-1">
          Thiết lập mã khuyến mãi kích cầu đơn hàng, ưu đãi khách mới và tri ân khách hàng.
        </p>
      </div>

      <div class="flex items-center gap-3 self-start sm:self-auto">
        <button
          type="button"
          :disabled="isLoading"
          @click="handleRefresh(true)"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] hover:bg-[#FAF9F5] transition-colors cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-wait"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Làm mới dữ liệu</span>
        </button>

        <button
          type="button"
          @click="openCreateModal"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3D5529] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tạo mã mới</span>
        </button>
      </div>
    </div>

    <!-- 4 Cards KPIs Thời Gian Thực -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- KPI 1 -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng số mã toàn hệ thống</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Ticket class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ totalVouchers }} <span class="text-xs font-normal text-[#7A866E]">mã</span>
        </div>
        <span class="text-xs text-[#4D6A34] font-bold block">Đang lưu trữ trên hệ thống</span>
      </div>

      <!-- KPI 2 -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đang hoạt động</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-emerald-700">
          {{ activeCount }} <span class="text-xs font-normal text-[#7A866E]">mã</span>
        </div>
        <span class="text-xs text-emerald-600 font-bold block">Khả dụng tại Checkout</span>
      </div>

      <!-- KPI 3 -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Lượt đã áp dụng</span>
          <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <Sparkles class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ totalUsed }} <span class="text-xs font-normal text-[#7A866E]">lượt</span>
        </div>
        <span class="text-xs text-[#7A866E] block">Lượt áp dụng trên các đơn hàng</span>
      </div>

      <!-- KPI 4 -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Mã khách hàng mới</span>
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ firstOrderCount }} <span class="text-xs font-normal text-[#7A866E]">mã</span>
        </div>
        <span class="text-xs text-[#4D6A34] font-bold block">Dành riêng cho đơn đầu tiên</span>
      </div>
    </div>

    <!-- Voucher Filter Tabs, Search & Table -->
    <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs p-6 space-y-6">
      <!-- Top Bar: Tabs & Search -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F0F3EC] pb-4">
        <!-- Status Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            @click="statusFilter = 'all'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="statusFilter === 'all' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Tất cả ({{ voucherStore.vouchers.length }})
          </button>

          <button
            type="button"
            @click="statusFilter = 'active'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="statusFilter === 'active' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Đang chạy ({{ activeCount }})
          </button>

          <button
            type="button"
            @click="statusFilter = 'inactive'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="statusFilter === 'inactive' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Tạm dừng ({{ inactiveCount }})
          </button>

          <button
            type="button"
            @click="statusFilter = 'expired'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="statusFilter === 'expired' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Hết hạn / Hết lượt ({{ expiredCount }})
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full md:w-72">
          <Search class="w-4 h-4 text-[#7A866E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm theo mã hoặc tiêu đề..."
            class="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs text-[#2D3B1E] placeholder:text-[#7A866E] outline-none focus:border-[#4D6A34] transition-colors"
          />
        </div>
      </div>

      <!-- Bảng danh sách Voucher -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
            <tr>
              <th class="py-3.5 px-4">Mã & Tiêu đề</th>
              <th class="py-3.5 px-4">Mức giảm</th>
              <th class="py-3.5 px-4">Điều kiện áp dụng</th>
              <th class="py-3.5 px-4">Tiến độ sử dụng</th>
              <th class="py-3.5 px-4">Hạn dùng</th>
              <th class="py-3.5 px-4">Trạng thái</th>
              <th class="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody v-if="filteredVouchers.length === 0" class="text-center">
            <tr>
              <td colspan="7" class="py-12 text-[#7A866E]">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <AlertCircle class="w-8 h-8 text-[#CCD7BC]" />
                  <span class="text-xs font-semibold">Không tìm thấy mã giảm giá nào khớp với bộ lọc.</span>
                </div>
              </td>
            </tr>
          </tbody>

          <tbody v-else class="divide-y divide-[#F0F3EC]">
            <tr
              v-for="v in filteredVouchers"
              :key="v.id"
              class="hover:bg-[#FAF9F5] transition-colors"
            >
              <!-- Cột 1: Mã & Tiêu đề -->
              <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center shrink-0">
                    <Ticket class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-heading font-black text-[#2D3B1E] uppercase text-sm">
                        {{ v.code }}
                      </span>
                      <span
                        v-if="v.targetType === 'first_order'"
                        class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]"
                      >
                        Khách mới
                      </span>
                    </div>
                    <div class="text-[11px] text-[#7A866E] truncate max-w-xs mt-0.5" :title="v.title">
                      {{ v.title }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Cột 2: Mức giảm -->
              <td class="py-4 px-4">
                <div v-if="v.discountType === 'fixed'" class="font-bold text-[#2D3B1E] text-sm">
                  -{{ formatVnd(v.discountValue) }}
                </div>
                <div v-else class="space-y-0.5">
                  <span class="font-bold text-amber-700 text-sm">-{{ v.discountValue }}%</span>
                  <div v-if="v.maxDiscountAmount" class="text-[11px] text-[#7A866E]">
                    Tối đa {{ formatVnd(v.maxDiscountAmount) }}
                  </div>
                </div>
              </td>

              <!-- Cột 3: Điều kiện áp dụng -->
              <td class="py-4 px-4">
                <div class="space-y-0.5">
                  <div class="font-bold text-[#2D3B1E]">
                    Đơn ≥ {{ formatVnd(v.minOrderAmount) }}
                  </div>
                  <div class="text-[11px] text-[#7A866E]">
                    {{ v.targetType === 'first_order' ? 'Chỉ đơn đầu tiên' : 'Toàn bộ khách hàng' }}
                  </div>
                </div>
              </td>

              <!-- Cột 4: Tiến độ sử dụng -->
              <td class="py-4 px-4">
                <div class="space-y-1.5 w-32">
                  <div class="flex justify-between text-[11px]">
                    <span class="font-bold text-[#2D3B1E]">{{ v.usedCount }}/{{ v.usageLimit }}</span>
                    <span class="text-[#7A866E]">
                      {{ Math.min(100, Math.round((v.usedCount / v.usageLimit) * 100)) }}%
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-[#E8ECE2] rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="v.usedCount >= v.usageLimit ? 'bg-amber-500' : 'bg-[#4D6A34]'"
                      :style="{ width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%` }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- Cột 5: Hạn dùng -->
              <td class="py-4 px-4">
                <div class="flex items-center gap-1.5" :class="isExpired(v) ? 'text-rose-600 font-bold' : 'text-[#7A866E]'">
                  <Clock class="w-3.5 h-3.5" />
                  <span class="text-xs">{{ formatDate(v.endDate) }}</span>
                </div>
              </td>

              <!-- Cột 6: Trạng thái -->
              <td class="py-4 px-4">
                <span
                  v-if="isExpired(v)"
                  class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200"
                >
                  Đã hết hạn
                </span>
                <span
                  v-else-if="isExhausted(v)"
                  class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                >
                  Hết lượt
                </span>
                <span
                  v-else-if="v.isActive"
                  class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EBF7E5] text-[#4D6A34] border border-[#CCD7BC]"
                >
                  Đang hoạt động
                </span>
                <span
                  v-else
                  class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200"
                >
                  Tạm dừng
                </span>
              </td>

              <!-- Cột 7: Thao tác -->
              <td class="py-4 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="openEditModal(v)"
                    class="p-2 rounded-xl text-[#4D6A34] border border-[#CCD7BC] bg-white hover:bg-[#EBF7E5] transition-colors cursor-pointer"
                    title="Chỉnh sửa voucher"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    @click="handleToggleStatus(v)"
                    class="p-2 rounded-xl transition-colors cursor-pointer border"
                    :class="v.isActive ? 'text-[#4D6A34] border-[#CCD7BC] bg-white hover:bg-[#EBF7E5]' : 'text-stone-400 border-stone-200 bg-stone-50 hover:bg-stone-100'"
                    :title="v.isActive ? 'Bấm để tạm dừng' : 'Bấm để kích hoạt'"
                  >
                    <Power class="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    @click="handleDeleteVoucher(v)"
                    class="p-2 rounded-xl text-rose-600 border border-rose-200 bg-white hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa voucher"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Tạo Mới Voucher -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#E3E8DC] space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
              <Ticket class="w-4 h-4" />
            </div>
            <div>
              <h3 class="font-heading text-lg font-black text-[#2D3B1E]">Tạo Mã Giảm Giá Mới</h3>
              <span class="text-xs text-[#7A866E]">Cung cấp thông tin chiết khấu cho khách</span>
            </div>
          </div>
          <button
            type="button"
            @click="showCreateModal = false"
            class="p-1.5 rounded-xl text-[#7A866E] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="handleCreateVoucher" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#576449] mb-1">Mã Voucher (Code) *</label>
            <input
              type="text"
              v-model="newVoucher.code"
              placeholder="VD: HELLO_NUTRI, SUMMER20"
              class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm font-black uppercase text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#576449] mb-1">Tiêu đề khuyến mãi *</label>
            <input
              type="text"
              v-model="newVoucher.title"
              placeholder="VD: Giảm 20.000đ cho đơn thực phẩm Eat-Clean"
              class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              required
            />
          </div>

          <!-- Loại giảm giá -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Hình thức giảm</label>
              <select
                v-model="newVoucher.discountType"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              >
                <option value="fixed">Số tiền cố định (VNĐ)</option>
                <option value="percent">Theo phần trăm (%)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">
                Giá trị giảm {{ newVoucher.discountType === 'fixed' ? '(VNĐ)' : '(%)' }} *
              </label>
              <input
                type="number"
                v-model.number="newVoucher.discountValue"
                :min="1"
                :max="newVoucher.discountType === 'percent' ? 100 : undefined"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
                required
              />
            </div>
          </div>

          <!-- Trần giảm giá nếu là % -->
          <div v-if="newVoucher.discountType === 'percent'">
            <label class="block text-xs font-bold text-[#576449] mb-1">Giảm tối đa (VNĐ)</label>
            <input
              type="number"
              v-model.number="newVoucher.maxDiscountAmount"
              placeholder="VD: 40000 (Để trống nếu không giới hạn)"
              class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
            />
          </div>

          <!-- Đơn tối thiểu & Đối tượng -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Đơn hàng tối thiểu (VNĐ)</label>
              <input
                type="number"
                v-model.number="newVoucher.minOrderAmount"
                step="10000"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Đối tượng áp dụng</label>
              <select
                v-model="newVoucher.targetType"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              >
                <option value="all">Mọi khách hàng</option>
                <option value="first_order">Khách hàng mới (Đơn đầu)</option>
              </select>
            </div>
          </div>

          <!-- Số lượng phát hành & Hạn sử dụng -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Số lượt phát hành</label>
              <input
                type="number"
                v-model.number="newVoucher.usageLimit"
                :min="1"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Ngày hết hạn *</label>
              <input
                type="date"
                v-model="newVoucher.endDate"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
                required
              />
            </div>
          </div>

          <!-- Nút bấm Modal -->
          <div class="pt-4 border-t border-[#F0F3EC] flex items-center justify-end gap-3">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 rounded-xl border border-[#CCD7BC] text-xs font-bold text-[#576449] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3D5529] disabled:bg-slate-300 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {{ isSubmitting ? 'Đang lưu...' : 'Lưu Voucher' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Chỉnh Sửa Voucher -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click.self="showEditModal = false"
    >
      <div class="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#E3E8DC] space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
              <Pencil class="w-4 h-4" />
            </div>
            <div>
              <h3 class="font-heading text-lg font-black text-[#2D3B1E]">Chỉnh Sửa Voucher</h3>
              <span class="text-xs text-[#7A866E]">Cập nhật thông số ưu đãi cho mã {{ editingVoucher.code }}</span>
            </div>
          </div>
          <button
            type="button"
            @click="showEditModal = false"
            class="p-1.5 rounded-xl text-[#7A866E] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="handleUpdateVoucher" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#576449] mb-1">Mã Voucher (Không thể sửa)</label>
            <input
              type="text"
              :value="editingVoucher.code"
              disabled
              class="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm font-black uppercase text-slate-500 cursor-not-allowed outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#576449] mb-1">Tiêu đề khuyến mãi *</label>
            <input
              type="text"
              v-model="editingVoucher.title"
              placeholder="VD: Giảm 20.000đ cho đơn thực phẩm Eat-Clean"
              class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#576449] mb-1">Mô tả chi tiết</label>
            <textarea
              v-model="editingVoucher.description"
              rows="2"
              placeholder="Ghi chú thêm về điều kiện áp dụng..."
              class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
            ></textarea>
          </div>

          <!-- Loại giảm giá -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Hình thức giảm</label>
              <select
                v-model="editingVoucher.discountType"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              >
                <option value="fixed">Số tiền cố định (VNĐ)</option>
                <option value="percent">Theo phần trăm (%)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">
                Giá trị giảm {{ editingVoucher.discountType === 'fixed' ? '(VNĐ)' : '(%)' }} *
              </label>
              <input
                type="number"
                v-model.number="editingVoucher.discountValue"
                :min="1"
                :max="editingVoucher.discountType === 'percent' ? 100 : undefined"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
                required
              />
            </div>
          </div>

          <!-- Trần giảm giá nếu là % -->
          <div v-if="editingVoucher.discountType === 'percent'">
            <label class="block text-xs font-bold text-[#576449] mb-1">Giảm tối đa (VNĐ)</label>
            <input
              type="number"
              v-model.number="editingVoucher.maxDiscountAmount"
              placeholder="VD: 40000 (Để trống nếu không giới hạn)"
              class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
            />
          </div>

          <!-- Đơn tối thiểu & Đối tượng -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Đơn hàng tối thiểu (VNĐ)</label>
              <input
                type="number"
                v-model.number="editingVoucher.minOrderAmount"
                step="10000"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Đối tượng áp dụng</label>
              <select
                v-model="editingVoucher.targetType"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
              >
                <option value="all">Mọi khách hàng</option>
                <option value="first_order">Khách hàng mới (Đơn đầu)</option>
              </select>
            </div>
          </div>

          <!-- Số lượng phát hành & Hạn sử dụng -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Số lượt phát hành</label>
              <input
                type="number"
                v-model.number="editingVoucher.usageLimit"
                :min="1"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Ngày hết hạn *</label>
              <input
                type="date"
                v-model="editingVoucher.endDate"
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] outline-none focus:border-[#4D6A34]"
                required
              />
            </div>
          </div>

          <!-- Nút bấm Modal Edit -->
          <div class="pt-4 border-t border-[#F0F3EC] flex items-center justify-end gap-3">
            <button
              type="button"
              @click="showEditModal = false"
              class="px-4 py-2 rounded-xl border border-[#CCD7BC] text-xs font-bold text-[#576449] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3D5529] disabled:bg-slate-300 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {{ isSubmitting ? 'Đang cập nhật...' : 'Cập nhật Voucher' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
