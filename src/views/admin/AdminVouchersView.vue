<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVoucherStore } from '../../stores/voucherStore';
import { useToastStore } from '../../stores/toastStore';
import { Voucher, CreateVoucherPayload, VoucherDiscountType, VoucherTargetType } from '../../types';
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Trash2,
  Power,
  RotateCcw,
  AlertCircle,
  Percent,
  DollarSign,
  Users,
} from 'lucide-vue-next';

const voucherStore = useVoucherStore();
const toastStore = useToastStore();

const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive' | 'expired'>('all');
const showCreateModal = ref(false);
const isSubmitting = ref(false);

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

onMounted(() => {
  voucherStore.loadVouchers(true);
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
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn voucher ${voucher.code}?`)) {
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
        <div class="flex items-center gap-2 text-xs font-bold text-[#536124] uppercase tracking-wider mb-1">
          <Ticket class="w-4 h-4" />
          <span>PHÂN HỆ M3 – KHUYẾN MÃI & CHIẾT KHẤU</span>
        </div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Quản Lý Voucher & Mã Giảm Giá
        </h1>
        <p class="text-xs sm:text-sm text-[#7A866E] mt-1">
          Thiết lập mã khuyến mãi kích cầu đơn hàng, ưu đãi khách mới và tri ân khách hàng.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="voucherStore.loadVouchers(true)"
          class="p-2.5 rounded-2xl bg-white border border-[#E3E8DC] text-[#576449] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          title="Tải lại dữ liệu"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <button
          type="button"
          @click="openCreateModal"
          class="px-5 py-3 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Tạo mã mới</span>
        </button>
      </div>
    </div>

    <!-- 4 KPIs Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-[#7A866E]">
          <span>Tổng số mã</span>
          <div class="w-8 h-8 rounded-xl bg-[#F0F4E8] text-[#536124] flex items-center justify-center">
            <Ticket class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          {{ totalVouchers }}
        </div>
        <span class="text-[11px] text-[#7A866E] block">Đang lưu trữ trên hệ thống</span>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-[#7A866E]">
          <span>Đang hoạt động</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl sm:text-3xl font-black text-emerald-700">
          {{ activeCount }}
        </div>
        <span class="text-[11px] text-emerald-600 font-semibold block">Khả dụng tại Checkout</span>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-[#7A866E]">
          <span>Lượt đã áp dụng</span>
          <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          {{ totalUsed }}
        </div>
        <span class="text-[11px] text-[#7A866E] block">Lượt áp dụng trên các đơn hàng</span>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-[#7A866E]">
          <span>Mã khách hàng mới</span>
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          {{ firstOrderCount }}
        </div>
        <span class="text-[11px] text-[#7A866E] block">Dành riêng cho đơn đầu tiên</span>
      </div>
    </div>

    <!-- Toolbar: Search & Status Filter -->
    <div class="bg-white p-4 sm:p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="relative w-full md:w-80">
        <Search class="w-4 h-4 text-[#7A866E] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Tìm theo mã hoặc tiêu đề..."
          class="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm text-[#2D3B1E] placeholder:text-[#7A866E] outline-none focus:border-[#536124] transition-colors"
        />
      </div>

      <div class="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
        <button
          type="button"
          @click="statusFilter = 'all'"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          :class="statusFilter === 'all' ? 'bg-[#536124] text-white shadow-2xs' : 'bg-[#FAF9F5] text-[#576449] hover:bg-[#EBF7E5]'"
        >
          Tất cả ({{ voucherStore.vouchers.length }})
        </button>

        <button
          type="button"
          @click="statusFilter = 'active'"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          :class="statusFilter === 'active' ? 'bg-[#536124] text-white shadow-2xs' : 'bg-[#FAF9F5] text-[#576449] hover:bg-[#EBF7E5]'"
        >
          Đang chạy ({{ activeCount }})
        </button>

        <button
          type="button"
          @click="statusFilter = 'inactive'"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          :class="statusFilter === 'inactive' ? 'bg-[#536124] text-white shadow-2xs' : 'bg-[#FAF9F5] text-[#576449] hover:bg-[#EBF7E5]'"
        >
          Tạm dừng
        </button>

        <button
          type="button"
          @click="statusFilter = 'expired'"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          :class="statusFilter === 'expired' ? 'bg-[#536124] text-white shadow-2xs' : 'bg-[#FAF9F5] text-[#576449] hover:bg-[#EBF7E5]'"
        >
          Hết hạn / Hết lượt
        </button>
      </div>
    </div>

    <!-- Bảng danh sách Voucher -->
    <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-[#FAF9F5] text-[#576449] border-b border-[#E3E8DC] font-bold">
            <tr>
              <th class="py-3.5 px-4 sm:px-6">MÃ & TIÊU ĐỀ</th>
              <th class="py-3.5 px-4">MỨC GIẢM</th>
              <th class="py-3.5 px-4">ĐIỀU KIỆN ÁP DỤNG</th>
              <th class="py-3.5 px-4">TIẾN ĐỘ SỬ DỤNG</th>
              <th class="py-3.5 px-4">HẠN DÙNG</th>
              <th class="py-3.5 px-4">TRẠNG THÁI</th>
              <th class="py-3.5 px-4 sm:px-6 text-right">THAO TÁC</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F0F3EC]">
            <tr
              v-for="v in filteredVouchers"
              :key="v.id"
              class="hover:bg-[#FAF9F5] transition-colors"
            >
              <!-- Cột 1: Mã & Tiêu đề -->
              <td class="py-4 px-4 sm:px-6">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-2xl bg-[#F0F4E8] text-[#536124] flex items-center justify-center shrink-0">
                    <Ticket class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
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
                    <div class="text-xs text-[#7A866E] truncate max-w-xs mt-0.5" :title="v.title">
                      {{ v.title }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Cột 2: Mức giảm -->
              <td class="py-4 px-4">
                <div v-if="v.discountType === 'fixed'" class="font-bold text-[#2D3B1E]">
                  -{{ formatVnd(v.discountValue) }}
                </div>
                <div v-else class="space-y-0.5">
                  <span class="font-bold text-amber-700">-{{ v.discountValue }}%</span>
                  <div v-if="v.maxDiscountAmount" class="text-[11px] text-[#7A866E]">
                    Tối đa {{ formatVnd(v.maxDiscountAmount) }}
                  </div>
                </div>
              </td>

              <!-- Cột 3: Điều kiện áp dụng -->
              <td class="py-4 px-4">
                <div class="space-y-0.5">
                  <div class="font-semibold text-[#2D3B1E]">
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
                      :class="v.usedCount >= v.usageLimit ? 'bg-amber-500' : 'bg-[#536124]'"
                      :style="{ width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%` }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- Cột 5: Hạn dùng -->
              <td class="py-4 px-4 text-xs">
                <div class="flex items-center gap-1.5" :class="isExpired(v) ? 'text-rose-600 font-bold' : 'text-[#576449]'">
                  <Clock class="w-3.5 h-3.5" />
                  <span>{{ formatDate(v.endDate) }}</span>
                </div>
              </td>

              <!-- Cột 6: Trạng thái -->
              <td class="py-4 px-4">
                <span
                  v-if="isExpired(v)"
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700"
                >
                  Đã hết hạn
                </span>
                <span
                  v-else-if="isExhausted(v)"
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800"
                >
                  Hết lượt
                </span>
                <span
                  v-else-if="v.isActive"
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EBF7E5] text-[#4D6A34]"
                >
                  ✓ Đang chạy
                </span>
                <span
                  v-else
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-[#576449]"
                >
                  Tạm dừng
                </span>
              </td>

              <!-- Cột 7: Thao tác -->
              <td class="py-4 px-4 sm:px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    @click="handleToggleStatus(v)"
                    class="p-2 rounded-xl transition-colors cursor-pointer"
                    :class="v.isActive ? 'text-[#4D6A34] hover:bg-[#EBF7E5]' : 'text-slate-400 hover:bg-slate-100'"
                    :title="v.isActive ? 'Bấm để tạm dừng' : 'Bấm để kích hoạt'"
                  >
                    <Power class="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    @click="handleDeleteVoucher(v)"
                    class="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                    title="Xóa voucher"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredVouchers.length === 0">
              <td colspan="7" class="py-12 text-center text-[#7A866E]">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <AlertCircle class="w-8 h-8 text-[#CCD7BC]" />
                  <span class="text-sm font-semibold">Không tìm thấy voucher nào phù hợp.</span>
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
            <div class="w-9 h-9 rounded-2xl bg-[#F0F4E8] text-[#536124] flex items-center justify-center">
              <Ticket class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-heading text-lg font-black text-[#2D3B1E]">Tạo Mã Giảm Giá Mới</h3>
              <span class="text-xs text-[#7A866E]">Cung cấp thông tin chiết khấu cho khách</span>
            </div>
          </div>
          <button
            type="button"
            @click="showCreateModal = false"
            class="p-1 rounded-xl text-[#7A866E] hover:bg-[#FAF9F5] transition-colors"
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
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm font-black uppercase text-[#2D3B1E] outline-none focus:border-[#536124]"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#576449] mb-1">Tiêu đề khuyến mãi *</label>
            <input
              type="text"
              v-model="newVoucher.title"
              placeholder="VD: Giảm 20.000đ cho đơn thực phẩm Eat-Clean"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm text-[#2D3B1E] outline-none focus:border-[#536124]"
              required
            />
          </div>

          <!-- Loại giảm giá -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Hình thức giảm</label>
              <select
                v-model="newVoucher.discountType"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm font-semibold text-[#2D3B1E] outline-none focus:border-[#536124]"
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
                class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm font-bold text-[#2D3B1E] outline-none focus:border-[#536124]"
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
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm text-[#2D3B1E] outline-none focus:border-[#536124]"
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
                class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm font-bold text-[#2D3B1E] outline-none focus:border-[#536124]"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Đối tượng áp dụng</label>
              <select
                v-model="newVoucher.targetType"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm font-semibold text-[#2D3B1E] outline-none focus:border-[#536124]"
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
                class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm font-bold text-[#2D3B1E] outline-none focus:border-[#536124]"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#576449] mb-1">Ngày hết hạn *</label>
              <input
                type="date"
                v-model="newVoucher.endDate"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs sm:text-sm font-semibold text-[#2D3B1E] outline-none focus:border-[#536124]"
                required
              />
            </div>
          </div>

          <!-- Nút bấm Modal -->
          <div class="pt-4 border-t border-[#F0F3EC] flex items-center justify-end gap-3">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-5 py-2.5 rounded-2xl border border-[#E3E8DC] text-xs font-bold text-[#576449] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {{ isSubmitting ? 'Đang lưu...' : 'Lưu Voucher' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
