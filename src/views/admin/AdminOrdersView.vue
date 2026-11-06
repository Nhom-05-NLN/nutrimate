<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fetchOrders, patchOrderStatus } from '../../services/api';
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

const toastStore = useToastStore();
const orders = ref<Order[]>([]);
const isLoading = ref<boolean>(true);
const activeTab = ref<'all' | 'pending' | 'confirmed' | 'packing' | 'shipping' | 'delivered' | 'cancelled'>('all');
const searchQuery = ref('');

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ord-adm-1',
    orderCode: 'NM-98234',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    customer: {
      name: 'Nguyễn Minh Anh',
      phone: '0912.345.678',
      email: 'minhanh.fit@gmail.com',
      address: 'Số 45 Đường D2, P. 25, Q. Bình Thạnh, TP.HCM',
    },
    items: [
      { productId: 'prod-1', productName: 'Granola siêu hạt', productImage: '', price: 185000, quantity: 1, calories: 152, protein: 14, portion: 'Hũ 500g' },
      { productId: 'prod-2', productName: 'Ức gà sấy thảo mộc', productImage: '', price: 110000, quantity: 2, calories: 145, protein: 32, portion: 'Gói 200g' },
      { productId: 'prod-3', productName: 'Bơ đậu phộng mịn', productImage: '', price: 90000, quantity: 1, calories: 190, protein: 8, portion: 'Hũ 350g' },
    ],
    totalAmount: 495000,
    totalCalories: 632,
    totalProtein: 86,
    shippingFee: 0,
    shippingMethod: 'express_2h',
    paymentMethod: 'vietqr',
    paymentStatus: 'paid',
    status: 'shipping',
  },
  {
    id: 'ord-adm-2',
    orderCode: 'NM-98235',
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    customer: {
      name: 'Trần Thanh Tâm',
      phone: '0988.123.456',
      email: 'thanhtam@gmail.com',
      address: 'Chung cư Masteri Thảo Điền, TP. Thủ Đức',
    },
    items: [
      { productId: 'prod-4', productName: 'Combo Eat Clean Giảm Mỡ 7 Ngày', productImage: '', price: 850000, quantity: 1, calories: 1200, protein: 120 },
    ],
    totalAmount: 850000,
    totalCalories: 1200,
    totalProtein: 120,
    shippingFee: 25000,
    shippingMethod: 'standard',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'pending',
  },
  {
    id: 'ord-adm-3',
    orderCode: 'NM-98236',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    customer: {
      name: 'Hoàng Quốc Bảo',
      phone: '0903.456.789',
      email: 'baohq@gmail.com',
      address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM',
    },
    items: [
      { productId: 'prod-5', productName: 'Bột đạm hạt bí hữu cơ', productImage: '', price: 165000, quantity: 2, calories: 310, protein: 40 },
      { productId: 'prod-6', productName: 'Mì Konjac Shirataki', productImage: '', price: 35000, quantity: 5, calories: 50, protein: 0 },
    ],
    totalAmount: 505000,
    totalCalories: 670,
    totalProtein: 80,
    shippingFee: 35000,
    shippingMethod: 'express_2h',
    paymentMethod: 'momo',
    paymentStatus: 'paid',
    status: 'pending',
  },
  {
    id: 'ord-adm-4',
    orderCode: 'NM-97412',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    customer: {
      name: 'Lê Thị Mai',
      phone: '0977.890.123',
      email: 'maile@gmail.com',
      address: '12 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM',
    },
    items: [
      { productId: 'prod-7', productName: 'Bánh mì đen lúa mạch', productImage: '', price: 85000, quantity: 1, calories: 180, protein: 8 },
      { productId: 'prod-8', productName: 'Hạt điều rang củi', productImage: '', price: 135000, quantity: 1, calories: 310, protein: 11 },
    ],
    totalAmount: 220000,
    totalCalories: 490,
    totalProtein: 19,
    shippingFee: 0,
    shippingMethod: 'standard',
    paymentMethod: 'vietqr',
    paymentStatus: 'paid',
    status: 'delivered',
  },
];

async function loadOrders() {
  isLoading.value = true;
  try {
    const data = await fetchOrders();
    if (data && data.length > 0) {
      orders.value = data;
    } else {
      orders.value = INITIAL_MOCK_ORDERS;
    }
  } catch {
    orders.value = INITIAL_MOCK_ORDERS;
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
      orders.value[idx].status = payload.status;
    }

    toastStore.show(
      'Cập nhật thành công!',
      'success',
      `Đơn #${updated.orderCode} chuyển sang ${payload.status}`
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
          Quản lý đơn hàng & Vận chuyển (Admin Portal)
        </h1>
        <p class="text-xs text-[#7A866E] mt-1">
          Giám sát đơn đặt hàng, điều phối đóng thùng mát 4°C và giao siêu tốc 2H.
        </p>
      </div>

      <button
        type="button"
        @click="loadOrders"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] hover:bg-[#FAF9F5] transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
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
          <span>{{ urgentExpressCount }} đơn giữ lạnh 2H cần giao gấp</span>
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
            Đang đóng gói 4°C ({{ orders.filter(o => o.status === 'packing').length }})
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
        </div>

        <!-- Search Input -->
        <div class="relative w-full md:w-64">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm mã đơn, tên, SĐT..."
            class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-medium text-[#242424] placeholder-[#8C9882] focus:bg-white focus:border-[#4D6A34] outline-none transition-all"
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
