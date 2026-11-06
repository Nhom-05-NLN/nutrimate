<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCartStore } from '../stores/cartStore';
import { useToastStore } from '../stores/toastStore';
import { fetchOrders, cancelOrderApi } from '../services/api';
import { Order, Product } from '../types';
import OrderCard from '../components/orders/OrderCard.vue';
import OrderTrackingTimeline from '../components/orders/OrderTrackingTimeline.vue';
import OrderDetailModal from '../components/orders/OrderDetailModal.vue';
import VietQrModal from '../components/checkout/VietQrModal.vue';
import MomoPaymentModal from '../components/checkout/MomoPaymentModal.vue';
import {
  ChevronRight,
  Search,
  X,
  PackageX,
  ShoppingBag,
  Sparkles,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const toastStore = useToastStore();

const orders = ref<Order[]>([]);
const isLoading = ref<boolean>(true);
const activeTab = ref<'all' | 'pending' | 'shipping' | 'delivered' | 'cancelled'>('all');
const searchQuery = ref('');

const selectedOrderForTracking = ref<Order | null>(null);
const selectedOrderForDetail = ref<Order | null>(null);
const isDetailModalOpen = ref(false);

const selectedOrderForQr = ref<Order | null>(null);
const showVietQrModal = ref(false);
const showMomoModal = ref(false);

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

function applyTrackingSelection() {
  const queryCode = (route.query.code as string) || (route.query.orderCode as string);
  if (queryCode && orders.value.length > 0) {
    const matched = orders.value.find(
      (o) => o.orderCode.toLowerCase() === queryCode.toLowerCase() || o.id === queryCode
    );
    if (matched) {
      selectedOrderForTracking.value = matched;
      return;
    }
  }

  // Mặc định chọn đơn mới nhất (vừa đặt) hoặc đơn đầu tiên trong danh sách
  selectedOrderForTracking.value = orders.value[0] || null;
}

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
    applyTrackingSelection();
  }
}

watch(
  () => [route.query.code, route.query.orderCode],
  () => {
    applyTrackingSelection();
  }
);

onMounted(() => {
  loadUserOrders();
});

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Lọc đơn hàng theo tab trạng thái và tìm kiếm (CN_22)
const filteredOrders = computed(() => {
  let list = orders.value;

  const rawQ = searchQuery.value.trim();

  if (rawQ) {
    const qLower = rawQ.toLowerCase();
    const qCleanAlphanumeric = qLower.replace(/[^a-z0-9]/gi, '');
    const qNoTones = removeVietnameseTones(qLower);

    list = list.filter((o) => {
      // 1. Khớp mã đơn hàng (hỗ trợ #NM-123456, NM123456, 123456, NM 123456)
      const orderCodeLower = o.orderCode.toLowerCase();
      const orderCodeAlphanumeric = orderCodeLower.replace(/[^a-z0-9]/gi, '');
      const matchCode =
        orderCodeLower.includes(qLower) ||
        `#${orderCodeLower}`.includes(qLower) ||
        (qCleanAlphanumeric.length > 0 && orderCodeAlphanumeric.includes(qCleanAlphanumeric));

      // 2. Khớp tên món ăn (hỗ trợ tiếng Việt có dấu và không dấu)
      const matchItem = o.items?.some((i) => {
        if (!i.productName) return false;
        const nameLower = i.productName.toLowerCase();
        const nameNoTones = removeVietnameseTones(nameLower);
        return nameLower.includes(qLower) || nameNoTones.includes(qNoTones);
      });

      // 3. Khớp thông tin khách hàng nếu có
      const customerNameLower = o.customer?.name?.toLowerCase() || '';
      const customerNameNoTones = removeVietnameseTones(customerNameLower);
      const customerPhone = o.customer?.phone?.replace(/[^0-9]/g, '') || '';
      const matchCustomer =
        customerNameLower.includes(qLower) ||
        customerNameNoTones.includes(qNoTones) ||
        (qCleanAlphanumeric.length >= 3 && customerPhone.includes(qCleanAlphanumeric));

      return Boolean(matchCode || matchItem || matchCustomer);
    });

    // Nếu đang ở tab trạng thái cụ thể, lọc tiếp theo tab nếu tab đó có kết quả
    if (activeTab.value !== 'all') {
      const tabFiltered = list.filter((o) => {
        if (activeTab.value === 'shipping') {
          return o.status === 'shipping' || o.status === 'packing' || o.status === 'confirmed';
        }
        return o.status === activeTab.value;
      });
      // Nếu tab hiện tại có kết quả thì dùng tabFiltered, ngược lại giữ list để không làm người dùng tưởng mất đơn
      if (tabFiltered.length > 0) {
        list = tabFiltered;
      }
    }
  } else if (activeTab.value !== 'all') {
    if (activeTab.value === 'shipping') {
      list = list.filter((o) => o.status === 'shipping' || o.status === 'packing' || o.status === 'confirmed');
    } else {
      list = list.filter((o) => o.status === activeTab.value);
    }
  }

  return list;
});

// Tự động đồng bộ widget tracking khi kết quả tìm kiếm thay đổi
watch(filteredOrders, (newList) => {
  if (newList.length > 0) {
    const isCurrentInList = newList.some((o) => o.id === selectedOrderForTracking.value?.id);
    if (!isCurrentInList) {
      selectedOrderForTracking.value = newList[0];
    }
  } else {
    selectedOrderForTracking.value = null;
  }
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
    const resolvedId =
      item.productId && item.productId !== 'null' && item.productId !== 'undefined'
        ? item.productId
        : `prod-reorder-${encodeURIComponent(item.productName)}`;

    const mockProduct: Product = {
      id: resolvedId,
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
    cartStore.addItem(mockProduct, item.quantity, item.portion || 'Tiêu chuẩn', true);
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

function handlePayNow(order: Order) {
  selectedOrderForQr.value = order;
  if (order.paymentMethod === 'momo') {
    showMomoModal.value = true;
  } else {
    showVietQrModal.value = true;
  }
}

async function handlePaymentSuccess(updatedOrder: Order) {
  // Modal thanh toán đã phát thông báo duy nhất, chỉ đồng bộ lại dữ liệu đơn hàng
  await loadUserOrders();
  if (selectedOrderForTracking.value?.id === updatedOrder.id) {
    selectedOrderForTracking.value = updatedOrder;
  }
}

async function handleCancelOrder(order: Order) {
  const confirmed = window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${order.orderCode} không?`);
  if (!confirmed) return;

  try {
    await cancelOrderApi(order.id, 'Khách hàng tự hủy trên giao diện');
    toastStore.show('Đã hủy đơn hàng thành công', 'info', `Mã đơn #${order.orderCode}`);
    isDetailModalOpen.value = false;
    await loadUserOrders();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi hủy đơn hàng';
    toastStore.show(msg, 'error');
  }
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
        <h1 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#242424]">
          Đơn hàng của tôi
        </h1>
        <p class="text-sm text-[#7A866E] mt-1.5 leading-relaxed">
          Theo dõi hành trình giao thực phẩm và quản lý lịch sử dinh dưỡng của bạn.
        </p>
      </div>

      <!-- Ô tìm kiếm mã đơn hoặc món ăn (CN_22) -->
      <div class="relative w-full sm:w-80">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Tìm theo mã đơn #NM..., tên món..."
          class="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-[#E3E8DC] text-sm text-[#242424] placeholder-[#8C9882] focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none shadow-2xs transition-all"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A866E] hover:text-[#242424] p-1 cursor-pointer transition-colors"
          aria-label="Xóa từ khóa tìm kiếm"
        >
          <X class="w-4 h-4" />
        </button>
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
          @pay-now="handlePayNow"
          @cancel-order="handleCancelOrder"
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
      @pay-now="handlePayNow"
      @cancel-order="handleCancelOrder"
    />

    <!-- VietQR Payment Modal Component -->
    <VietQrModal
      :open="showVietQrModal"
      :order="selectedOrderForQr"
      @close="showVietQrModal = false"
      @payment-success="handlePaymentSuccess"
    />

    <!-- MoMo Payment Modal Component -->
    <MomoPaymentModal
      :open="showMomoModal"
      :order="selectedOrderForQr"
      @close="showMomoModal = false"
      @payment-success="handlePaymentSuccess"
    />
  </div>
</template>
