<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fetchOrders, patchOrderStatus, patchOrderPaymentStatus } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { Order, OrderStatus } from '../../types';
import AdminOrderTable from '../../components/admin/orders/AdminOrderTable.vue';
import {
  ShoppingCart,
  Package,
  Truck,
  Bot,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const toastStore = useToastStore();
const orders = ref<Order[]>([]);
const isLoading = ref<boolean>(true);
const activeTab = ref<'all' | 'pending' | 'confirmed' | 'packing' | 'shipping' | 'delivered' | 'cancelled'>('all');
const searchQuery = ref('');

async function loadOrders(isManual = false) {
  isLoading.value = true;
  try {
    orders.value = await fetchOrders(authStore.accessToken);
    if (isManual) {
      toastStore.show('Đã cập nhật danh sách đơn hàng mới nhất', 'success');
    }
  } catch (err: unknown) {
    orders.value = [];
    const message = err instanceof Error ? err.message : 'Lỗi khi tải danh sách đơn hàng';
    toastStore.show(message, 'error');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadOrders();
});

// 4 KPIs thời gian thực (CN_24 / Figma 12)
const totalOrdersCount = computed(() => orders.value.length);

const pendingAndPackingCount = computed(() => {
  return orders.value.filter((o) => o.status === 'pending' || o.status === 'packing' || o.status === 'confirmed').length;
});

// Cảnh báo đơn 2H cần giao gấp (CN_24)
const urgentExpressCount = computed(() => {
  return orders.value.filter(
    (o) =>
      o.shippingMethod === 'express_2h' &&
      (o.status === 'pending' || o.status === 'confirmed' || o.status === 'packing')
  ).length;
});

const shippingCount = computed(() => {
  return orders.value.filter((o) => o.status === 'shipping').length;
});

const aiOrVietQrOrdersCount = computed(() => {
  return orders.value.filter((o) => o.paymentMethod === 'vietqr' || o.paymentMethod === 'momo').length;
});

// Lọc đơn hàng theo Tab và Tìm kiếm
const filteredOrders = computed(() => {
  let list = orders.value;

  if (activeTab.value !== 'all') {
    list = list.filter((o) => o.status === activeTab.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((o) => {
      const matchCode = o.orderCode.toLowerCase().includes(q);
      const matchCustomer = o.customer.name.toLowerCase().includes(q);
      const matchPhone = o.customer.phone.includes(q);
      return matchCode || matchCustomer || matchPhone;
    });
  }

  return list;
});

// Cập nhật trạng thái đơn hàng (CN_24)
async function handleUpdateStatus(payload: { orderId: string; status: OrderStatus }) {
  try {
    const updated = await patchOrderStatus(payload.orderId, payload.status);

    // Cập nhật state local
    const idx = orders.value.findIndex((o) => o.id === payload.orderId || o.orderCode === payload.orderId);
    if (idx !== -1) {
      if (updated) {
        orders.value[idx] = { ...orders.value[idx], ...updated };
      } else {
        orders.value[idx].status = payload.status;
      }

      // Khi giao hàng thành công, tự động hiểu và cập nhật đã thanh toán (Đã thu)
      if (payload.status === 'delivered') {
        orders.value[idx].paymentStatus = 'paid';
        patchOrderPaymentStatus(payload.orderId, 'paid').catch(() => {});
      }
    }

    toastStore.show(
      'Cập nhật thành công!',
      'success',
      `Đơn #${updated?.orderCode || payload.orderId} chuyển sang ${payload.status}`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái';
    toastStore.show(msg, 'error');
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Title -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Quản lý đơn hàng & Vận chuyển
        </h1>
        <p class="text-xs text-[#7A866E] mt-1">
          Giám sát đơn đặt hàng, điều phối đóng gói và giao siêu tốc 2H.
        </p>
      </div>

      <button
        type="button"
        :disabled="isLoading"
        @click="loadOrders(true)"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] hover:bg-[#FAF9F5] transition-colors cursor-pointer shadow-2xs self-start sm:self-auto disabled:opacity-60 disabled:cursor-wait"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
        <span>Làm mới dữ liệu</span>
      </button>
    </div>

    <!-- 4 Cards KPIs Thời Gian Thực (Figma 12 / CN_24) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- KPI 1 -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng đơn toàn hệ thống</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <ShoppingCart class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ totalOrdersCount }} <span class="text-xs font-normal text-[#7A866E]">đơn</span>
        </div>
        <span class="text-xs text-[#4D6A34] font-bold block">+12% so với hôm qua</span>
      </div>

      <!-- KPI 2: Cảnh báo đơn 2H cần giao gấp (CN_24) -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Chờ xác nhận & đóng gói</span>
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Package class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-amber-700">
          {{ pendingAndPackingCount }} <span class="text-xs font-normal text-[#7A866E]">đơn</span>
        </div>
        <span class="text-[11px] text-rose-600 font-bold flex items-center gap-1">
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>{{ urgentExpressCount }} đơn giao siêu tốc 2H cần xử lý gấp</span>
        </span>
      </div>

      <!-- KPI 3 -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đang vận chuyển 2H</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Truck class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ shippingCount }} <span class="text-xs font-normal text-[#7A866E]">đơn</span>
        </div>
        <span class="text-xs text-[#7A866E] block">Tỉ lệ giao thành công: <strong>98.5%</strong></span>
      </div>

      <!-- KPI 4 -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Thanh toán số (VietQR / MoMo)</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ aiOrVietQrOrdersCount }} <span class="text-xs font-normal text-[#7A866E]">đơn</span>
        </div>
        <span class="text-xs text-[#4D6A34] font-bold block">Tự động kích hoạt Napas</span>
      </div>
    </div>

    <!-- Orders Filter Tabs, Search & Table (Figma 12 / CN_24) -->
    <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs p-6 space-y-6">
      <!-- Top Bar: Tabs & Search -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F0F3EC] pb-4">
        <!-- Status Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            @click="activeTab = 'all'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="activeTab === 'all' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Tất cả ({{ orders.length }})
          </button>
          <button
            type="button"
            @click="activeTab = 'pending'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="activeTab === 'pending' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Chờ xác nhận ({{ orders.filter(o => o.status === 'pending').length }})
          </button>
          <button
            type="button"
            @click="activeTab = 'confirmed'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="activeTab === 'confirmed' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Đã duyệt ({{ orders.filter(o => o.status === 'confirmed').length }})
          </button>
          <button
            type="button"
            @click="activeTab = 'packing'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="activeTab === 'packing' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Đang đóng gói ({{ orders.filter(o => o.status === 'packing').length }})
          </button>
          <button
            type="button"
            @click="activeTab = 'shipping'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="activeTab === 'shipping' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Đang giao hàng ({{ orders.filter(o => o.status === 'shipping').length }})
          </button>
          <button
            type="button"
            @click="activeTab = 'delivered'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="activeTab === 'delivered' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Giao thành công ({{ orders.filter(o => o.status === 'delivered').length }})
          </button>
          <button
            type="button"
            @click="activeTab = 'cancelled'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
            :class="activeTab === 'cancelled' ? 'bg-[#4D6A34] text-white shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Đã hủy ({{ orders.filter(o => o.status === 'cancelled').length }})
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full md:w-72">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm theo mã đơn, tên, SĐT..."
            class="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs text-[#2D3B1E] placeholder:text-[#7A866E] outline-none focus:border-[#4D6A34] transition-colors"
          />
        </div>
      </div>

      <!-- Admin Order Table Component (CN_24) -->
      <AdminOrderTable
        :orders="filteredOrders"
        :is-loading="isLoading"
        @update-status="handleUpdateStatus"
      />
    </div>
  </div>
</template>
