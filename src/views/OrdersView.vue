<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cartStore';
import { useToastStore } from '../stores/toastStore';
import { fetchOrders } from '../services/api';
import { Order, Product } from '../types';
import OrderCard from '../components/orders/OrderCard.vue';
import OrderTrackingTimeline from '../components/orders/OrderTrackingTimeline.vue';
import OrderDetailModal from '../components/orders/OrderDetailModal.vue';
import {
  ChevronRight,
  Search,
  PackageX,
  ShoppingBag,
  Sparkles,
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();
const toastStore = useToastStore();

const orders = ref<Order[]>([]);
const isLoading = ref<boolean>(true);
const activeTab = ref<'all' | 'pending' | 'shipping' | 'delivered' | 'cancelled'>('all');
const searchQuery = ref('');

const selectedOrderForTracking = ref<Order | null>(null);
const selectedOrderForDetail = ref<Order | null>(null);
const isDetailModalOpen = ref(false);

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-mock-1',
    orderCode: 'NM-98234',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    customer: {
      name: 'Nguyễn Minh Anh',
      phone: '0912 345 678',
      email: 'minhanh.fit@gmail.com',
      address: 'Số 45 Đường D2, P. 25, Q. Bình Thạnh, TP. Hồ Chí Minh',
      note: 'Giao giờ hành chính giúp mình',
    },
    items: [
      {
        productId: 'prod-granola',
        productName: 'Granola Yến Mạch Hạt Dinh Dưỡng Siêu Hạt 500g',
        productImage: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
        price: 185000,
        quantity: 1,
        calories: 152,
        protein: 14,
        portion: 'Hũ 500g',
      },
      {
        productId: 'prod-chicken',
        productName: 'Ức Gà Sấy Giòn Vị Thảo Mộc Tự Nhiên 200g',
        productImage: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
        price: 110000,
        quantity: 2,
        calories: 145,
        protein: 32,
        portion: 'Gói 200g',
      },
      {
        productId: 'prod-peanut',
        productName: 'Bơ Đậu Phộng Mịn Thuần Chay 350g',
        productImage: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
        price: 90000,
        quantity: 1,
        calories: 190,
        protein: 8,
        portion: 'Hũ 350g',
      },
    ],
    totalAmount: 495000,
    totalCalories: 632,
    totalProtein: 86,
    shippingFee: 0,
    shippingMethod: 'express_2h',
    paymentMethod: 'vietqr',
    paymentStatus: 'paid',
    status: 'shipping',
    notes: 'Gọi trước 15 phút',
  },
  {
    id: 'ord-mock-2',
    orderCode: 'NM-97412',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    customer: {
      name: 'Nguyễn Minh Anh',
      phone: '0912 345 678',
      email: 'minhanh.fit@gmail.com',
      address: 'Số 45 Đường D2, P. 25, Q. Bình Thạnh, TP. Hồ Chí Minh',
    },
    items: [
      {
        productId: 'prod-rye-bread',
        productName: 'Bánh Mì Đen Lúa Mạch Nguyên Cám',
        productImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        price: 85000,
        quantity: 1,
        calories: 180,
        protein: 8,
        portion: 'Ổ 450g',
      },
      {
        productId: 'prod-cashew',
        productName: 'Hạt Điều Rang Củi Không Muối Hữu Cơ 300g',
        productImage: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80',
        price: 135000,
        quantity: 1,
        calories: 310,
        protein: 11,
        portion: 'Hũ 300g',
      },
    ],
    totalAmount: 220000,
    totalCalories: 490,
    totalProtein: 19,
    shippingFee: 25000,
    shippingMethod: 'standard',
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    status: 'delivered',
  },
];

async function loadUserOrders() {
  isLoading.value = true;
  try {
    const data = await fetchOrders();
    if (data && data.length > 0) {
      orders.value = data;
    } else {
      orders.value = DEFAULT_ORDERS;
    }
  } catch {
    orders.value = DEFAULT_ORDERS;
  } finally {
    isLoading.value = false;
    // Mặc định chọn đơn đang giao hoặc đơn đầu tiên để hiển thị tracking widget
    const shippingOrder = orders.value.find((o) => o.status === 'shipping' || o.status === 'packing');
    selectedOrderForTracking.value = shippingOrder || orders.value[0] || null;
  }
}

onMounted(() => {
  loadUserOrders();
});

// Lọc đơn hàng theo tab trạng thái và tìm kiếm (CN_22)
const filteredOrders = computed(() => {
  let list = orders.value;

  if (activeTab.value !== 'all') {
    if (activeTab.value === 'shipping') {
      list = list.filter((o) => o.status === 'shipping' || o.status === 'packing' || o.status === 'confirmed');
    } else {
      list = list.filter((o) => o.status === activeTab.value);
    }
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((o) => {
      const matchCode = o.orderCode.toLowerCase().includes(q);
      const matchItem = o.items.some((i) => i.productName.toLowerCase().includes(q));
      return matchCode || matchItem;
    });
  }

  return list;
});

// Counts cho từng tab
const pendingCount = computed(() => orders.value.filter((o) => o.status === 'pending').length);
const shippingCount = computed(() => orders.value.filter((o) => ['shipping', 'packing', 'confirmed'].includes(o.status)).length);
const deliveredCount = computed(() => orders.value.filter((o) => o.status === 'delivered').length);
const cancelledCount = computed(() => orders.value.filter((o) => o.status === 'cancelled').length);

function handleSelectForTracking(order: Order) {
  selectedOrderForTracking.value = order;
}

function handleOpenDetail(order: Order) {
  selectedOrderForDetail.value = order;
  isDetailModalOpen.value = true;
}

// Chức năng "Mua lại" (Re-order - CN_22)
function handleReorder(order: Order) {
  for (const item of order.items) {
    const mockProduct: Product = {
      id: item.productId,
      code: 'NM-REORDER',
      name: item.productName,
      category: 'snacks-nuts',
      categoryName: 'Mua lại',
      price: item.price,
      image: item.productImage || 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
      description: item.productName,
      ingredients: ['Tự nhiên'],
      nutrition: {
        servingSize: '1 phần',
        calories: item.calories,
        protein: item.protein,
        carbs: 10,
        fat: 5,
        sugar: 1,
      },
      stock: 50,
      rating: 5.0,
      reviewCount: 100,
      badges: ['Mua lại'],
      bestFor: 'Bữa ăn kiêng',
    };
    cartStore.addItem(mockProduct, item.quantity, item.portion || 'Tiêu chuẩn');
  }

  toastStore.show(
    `Đã nạp lại ${order.items.length} món vào giỏ hàng!`,
    'success',
    `Sao chép từ đơn #${order.orderCode}`,
    'Xem giỏ hàng',
    '/cart'
  );

  router.push('/cart');
}
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm font-medium text-[#7E8B73]" aria-label="Breadcrumb">
      <RouterLink to="/" class="hover:text-[#242424]">Trang chủ</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <RouterLink to="/profile" class="hover:text-[#242424]">Tài khoản cá nhân</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <span class="text-[#242424] font-bold">Đơn hàng của tôi</span>
    </nav>

    <!-- Header & Search (CN_22) -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-5">
      <div>
        <div class="flex items-center gap-3.5">
          <h1 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#242424]">
            Đơn hàng của tôi
          </h1>
          <span class="px-3.5 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34] border border-[#CCD7BC]">
            {{ orders.length }} đơn hàng
          </span>
        </div>
        <p class="text-sm text-[#7A866E] mt-1.5 leading-relaxed">
          Theo dõi hành trình giao thực phẩm giữ lạnh 4°C và quản lý lịch sử dinh dưỡng của bạn.
        </p>
      </div>

      <!-- Ô tìm kiếm mã đơn hoặc món ăn (CN_22) -->
      <div class="relative w-full sm:w-80">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Tìm theo mã đơn #NM..., tên món..."
          class="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#E3E8DC] text-sm text-[#242424] placeholder-[#8C9882] focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none shadow-2xs transition-all"
        />
      </div>
    </div>

    <!-- Status Filter Tabs (CN_22) -->
    <div class="flex items-center gap-2.5 overflow-x-auto pb-1.5 no-scrollbar" role="tablist">
      <button
        type="button"
        @click="activeTab = 'all'"
        class="px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
        :class="activeTab === 'all' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        Tất cả ({{ orders.length }})
      </button>

      <button
        type="button"
        @click="activeTab = 'pending'"
        class="px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
        :class="activeTab === 'pending' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        Chờ xác nhận ({{ pendingCount }})
      </button>

      <button
        type="button"
        @click="activeTab = 'shipping'"
        class="px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer"
        :class="activeTab === 'shipping' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Đang giao ({{ shippingCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'delivered'"
        class="px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
        :class="activeTab === 'delivered' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        Đã giao ({{ deliveredCount }})
      </button>

      <button
        type="button"
        @click="activeTab = 'cancelled'"
        class="px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
        :class="activeTab === 'cancelled' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        Đã hủy ({{ cancelledCount }})
      </button>
    </div>

    <!-- 2 Columns Layout: Orders List & Tracking Widget -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <!-- Cột Trái: Danh sách đơn hàng (OrderCard component - CN_22) -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Empty State nếu không có đơn nào khớp bộ lọc -->
        <div
          v-if="filteredOrders.length === 0"
          class="p-16 text-center bg-white rounded-3xl border border-[#E3E8DC] space-y-4 shadow-2xs"
        >
          <div class="w-16 h-16 rounded-full bg-[#FAF9F5] text-[#7A866E] flex items-center justify-center mx-auto border border-[#E8ECE2]">
            <PackageX class="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 class="font-heading text-lg font-bold text-[#242424]">Không tìm thấy đơn hàng nào</h3>
          <p class="text-xs text-[#7A866E] max-w-sm mx-auto">
            Không có đơn hàng nào khớp với trạng thái hoặc từ khóa tìm kiếm của bạn.
          </p>
          <button
            type="button"
            @click="activeTab = 'all'; searchQuery = ''"
            class="px-5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] hover:bg-[#EBF7E5] transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>

        <!-- Render danh sách thẻ đơn hàng (CN_22) -->
        <OrderCard
          v-for="order in filteredOrders"
          :key="order.id"
          :order="order"
          :is-selected-for-tracking="selectedOrderForTracking?.id === order.id"
          @track-order="handleSelectForTracking"
          @view-detail="handleOpenDetail"
          @reorder="handleReorder"
        />
      </div>

      <!-- Cột Phải: Widget Theo Dõi Vận Chuyển Trực Tiếp (OrderTrackingTimeline - CN_23) -->
      <aside class="lg:col-span-4 sticky top-24">
        <OrderTrackingTimeline
          v-if="selectedOrderForTracking"
          :order="selectedOrderForTracking"
        />

        <div
          v-else
          class="bg-white p-7 rounded-3xl border border-[#E3E8DC] text-center space-y-3 shadow-2xs"
        >
          <div class="w-12 h-12 rounded-full bg-[#FAF9F5] text-[#7A866E] flex items-center justify-center mx-auto">
            <ShoppingBag class="w-6 h-6 stroke-[1.5]" />
          </div>
          <h4 class="font-heading text-sm font-bold text-[#242424]">Chưa chọn đơn theo dõi</h4>
          <p class="text-xs text-[#7A866E]">
            Nhấp nút "Theo dõi đơn" trên bất kỳ đơn hàng nào để xem tiến trình giao hàng trực tiếp.
          </p>
        </div>
      </aside>
    </div>

    <!-- Modal Chi Tiết Đơn Hàng (OrderDetailModal - CN_22 / CN_23) -->
    <OrderDetailModal
      :open="isDetailModalOpen"
      :order="selectedOrderForDetail"
      @close="isDetailModalOpen = false"
      @reorder="handleReorder"
    />
  </div>
</template>
