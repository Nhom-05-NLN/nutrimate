<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { AdminDashboardData } from '../../types';
import { fetchAdminDashboard } from '../../services/api';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-vue-next';

const dashboard = ref<AdminDashboardData | null>(null);
const isLoading = ref(true);
const loadError = ref('');
const categoryColors = ['#4D6A34', '#7F9C5B', '#A8C28E', '#D4E2C4'];

const weeklyRevenueMax = computed(() =>
  Math.max(1, ...(dashboard.value?.weeklySales.map((day) => day.revenue) ?? [])),
);
const peakSalesDay = computed(() =>
  dashboard.value?.weeklySales.reduce(
    (peak, day) => (day.revenue > peak.revenue ? day : peak),
    { date: '', revenue: 0, productRevenue: 0, aiRecommendedRevenue: 0, orders: 0 },
  ),
);
const averageOtherDayRevenue = computed(() => {
  const days = dashboard.value?.weeklySales.filter((day) => day.date !== peakSalesDay.value?.date) ?? [];
  return days.length ? days.reduce((total, day) => total + day.revenue, 0) / days.length : 0;
});
const peakRevenueChange = computed(() => {
  const average = averageOtherDayRevenue.value;
  return average > 0 && peakSalesDay.value
    ? ((peakSalesDay.value.revenue - average) / average) * 100
    : null;
});
const weeklyOrderCount = computed(() =>
  dashboard.value?.weeklySales.reduce((total, day) => total + day.orders, 0) ?? 0,
);
const currentMonthLabel = new Intl.DateTimeFormat('vi-VN', {
  month: 'long',
  year: 'numeric',
}).format(new Date());

async function loadDashboard() {
  isLoading.value = true;
  loadError.value = '';
  try {
    dashboard.value = await fetchAdminDashboard();
  } catch (error: unknown) {
    loadError.value = error instanceof Error
      ? error.message
      : 'Không thể tải dữ liệu dashboard.';
  } finally {
    isLoading.value = false;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatWeekday(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(
    new Date(year, month - 1, day),
  );
}

function formatDayOfMonth(dateValue: string): number {
  return Number(dateValue.slice(-2));
}

function formatCompactVnd(amount: number): string {
  if (amount >= 1_000_000) {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(amount / 1_000_000)} tr`;
  }
  return `${formatNumber(amount / 1_000)}k`;
}

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    cod: 'COD',
    vietqr: 'VietQR',
    momo: 'MoMo',
  };
  return labels[method] ?? method;
}

function formatOrderStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    packing: 'Đang đóng gói',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };
  return labels[status] ?? status;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 3 ? `${'*'.repeat(digits.length - 3)}${digits.slice(-3)}` : phone;
}

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <div class="space-y-8">
    <div
      v-if="loadError"
      class="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
      role="alert"
    >
      <span>{{ loadError }}</span>
      <button type="button" class="shrink-0 font-bold underline" @click="loadDashboard">
        Thử lại
      </button>
    </div>

    <!-- Top 4 KPIs Cards (Figma 10) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- 1. Doanh thu -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Doanh thu tháng này</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <DollarSign class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ dashboard ? formatVnd(dashboard.summary.monthlyRevenue) : '—' }}
        </div>
        <div class="flex items-center gap-1.5 text-xs font-bold" :class="(dashboard?.summary.revenueChangePercent ?? 0) >= 0 ? 'text-[#4D6A34]' : 'text-rose-700'">
          <span>{{ dashboard?.summary.revenueChangePercent === null ? 'Chưa có dữ liệu so sánh' : dashboard ? `${dashboard.summary.revenueChangePercent >= 0 ? '+' : ''}${dashboard.summary.revenueChangePercent.toFixed(1)}%` : 'Đang tải…' }}</span>
          <span v-if="dashboard && dashboard.summary.revenueChangePercent !== null" class="text-[#7A866E] font-normal">so với cùng kỳ tháng trước</span>
        </div>
      </div>

      <!-- 2. Tổng đơn hàng -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Tổng đơn hàng</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <ShoppingCart class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ dashboard ? formatNumber(dashboard.summary.totalOrders) : '—' }} <span class="text-xs font-normal text-[#7A866E]">đơn</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>{{ dashboard ? `${dashboard.summary.deliveredOrderPercent.toFixed(1)}% đã giao` : 'Đang tải…' }}</span>
          <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">{{ dashboard ? `${formatNumber(dashboard.summary.pendingOrders)} chờ duyệt` : '— chờ duyệt' }}</span>
        </div>
      </div>

      <!-- 3. Khách hàng hoạt động -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Tổng khách hàng</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ dashboard ? formatNumber(dashboard.summary.totalCustomers) : '—' }} <span class="text-xs font-normal text-[#7A866E]">khách</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="text-[#4D6A34] font-bold">+{{ dashboard ? formatNumber(dashboard.summary.newCustomers) : '—' }} mới tháng này</span>
          <span>{{ dashboard ? formatNumber(dashboard.summary.customersWithBmi) : '—' }} có BMI</span>
        </div>
      </div>

      <!-- 4. Tương tác NutriBot AI -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Tương tác NutriBot AI</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ dashboard ? formatNumber(dashboard.summary.monthlyChatMessages) : '—' }} <span class="text-xs font-normal text-[#7A866E]">lượt</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tin nhắn NutriBot trong tháng này</span>
        </div>
      </div>
    </div>

    <!-- Middle Grid: Chart Doanh Thu & Biểu Đồ Phân Bổ Danh Mục (Figma 10) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- Cột Trái: Biến động doanh thu tuần qua -->
      <div class="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F3EC] pb-4">
          <div>
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">
              Biến động doanh thu theo ngày (Tuần qua)
            </h3>
            <p class="text-xs text-[#7A866E]">Theo dõi doanh thu thực phẩm tự chọn và sản phẩm được AI gợi ý</p>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-[#7A866E]">
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-[#4D6A34]"></span> Thực phẩm tự chọn</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-[#A3B88C]"></span> Sản phẩm được AI gợi ý</span>
          </div>
        </div>

        <div class="flex h-52 items-end justify-between gap-2 px-2 pt-5 sm:gap-3 sm:px-4">
          <div v-for="day in dashboard?.weeklySales ?? []" :key="day.date" class="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div class="pointer-events-none absolute bottom-12 z-10 hidden min-w-max -translate-y-2 rounded-lg bg-[#26351D] px-3 py-2 text-[10px] text-white shadow-lg group-hover:block">
              <p class="font-bold">{{ formatWeekday(day.date) }} · {{ formatVnd(day.revenue) }}</p>
              <p class="mt-1 text-white/75">Thực phẩm: {{ formatVnd(day.productRevenue) }}</p>
              <p class="text-white/75">Sản phẩm AI gợi ý: {{ formatVnd(day.aiRecommendedRevenue) }}</p>
            </div>
            <span
              v-if="peakSalesDay?.date === day.date && day.revenue > 0"
              class="absolute bottom-[calc(100%-2.5rem)] z-[1] rounded-md bg-[#26351D] px-2 py-1 text-[9px] font-bold text-white"
            >
              Đỉnh: {{ formatCompactVnd(day.revenue) }}
            </span>
            <div class="flex h-36 w-full max-w-[42px] flex-col-reverse overflow-hidden rounded-lg bg-[#F0F4EA] shadow-inner">
              <div
                class="w-full shrink-0 bg-[#4D6A34]"
                :style="{ height: `${(day.productRevenue / weeklyRevenueMax) * 100}%` }"
              ></div>
              <div
                class="w-full shrink-0 bg-[#A3B88C]"
                :style="{ height: `${(day.aiRecommendedRevenue / weeklyRevenueMax) * 100}%` }"
              ></div>
            </div>
            <span class="whitespace-nowrap text-[10px] font-semibold capitalize text-[#7A866E] sm:text-[11px]">
              {{ formatWeekday(day.date) }} {{ formatDayOfMonth(day.date) }}
            </span>
          </div>
          <p v-if="!isLoading && dashboard && !dashboard.weeklySales.length" class="w-full self-center text-center text-xs text-[#7A866E]">
            Chưa có đơn hàng trong tuần.
          </p>
        </div>

        <div class="flex flex-col gap-3 border-t border-[#F0F3EC] pt-3 text-xs text-[#7A866E] sm:flex-row sm:items-center sm:justify-between">
          <span class="flex items-start gap-1.5 text-[#2D3B1E]">
            <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-[#4D6A34]" />
            <span v-if="peakSalesDay?.date">
              Doanh số đỉnh {{ formatWeekday(peakSalesDay.date) }}: <strong>{{ formatVnd(peakSalesDay.revenue) }}</strong>
              <span v-if="peakRevenueChange !== null" class="text-[#7A866E]">
                (tăng {{ peakRevenueChange.toFixed(0) }}% so với trung bình các ngày còn lại)
              </span>
              <span class="ml-1 text-[#7A866E]">· {{ formatNumber(weeklyOrderCount) }} đơn trong tuần</span>
            </span>
            <span v-else>Chưa có doanh thu đơn đã giao trong tuần.</span>
          </span>
          <RouterLink to="/admin/orders" class="shrink-0 font-bold text-[#4D6A34] hover:underline">Xem lịch sử tuần &gt;</RouterLink>
        </div>
      </div>

      <!-- Cột Phải: Tỷ lệ phân bổ danh mục -->
      <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">Tỷ lệ phân bổ danh mục</h3>
            <span class="text-[10px] font-bold text-[#7A866E] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E3E8DC]">{{ currentMonthLabel }}</span>
          </div>
          <p class="text-xs text-[#7A866E] mt-2">Sản phẩm đã giao trong tháng này</p>

          <div class="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex mt-4">
            <div
              v-for="(category, index) in dashboard?.categories ?? []"
              :key="category.name"
              :style="{ width: `${category.percentage}%`, backgroundColor: categoryColors[index % categoryColors.length] }"
              :title="`${category.name} ${category.percentage.toFixed(1)}%`"
            ></div>
          </div>

          <div class="space-y-3 pt-5 text-xs">
            <div v-for="(category, index) in dashboard?.categories ?? []" :key="category.name" class="flex items-center justify-between gap-2">
              <span class="flex min-w-0 items-center gap-2">
                <span class="w-2.5 h-2.5 shrink-0 rounded-full" :style="{ backgroundColor: categoryColors[index % categoryColors.length] }"></span>
                <span class="truncate">{{ category.name }}</span>
              </span>
              <div class="shrink-0 space-x-1.5">
                <span class="font-bold text-[#2D3B1E]">{{ category.percentage.toFixed(1) }}%</span>
                <span class="text-[10px] text-[#7A866E]">{{ formatNumber(category.unitsSold) }} sp</span>
              </div>
            </div>
            <p v-if="!isLoading && dashboard && !dashboard.categories.length" class="text-xs text-[#7A866E]">Chưa có sản phẩm bán ra.</p>
          </div>
        </div>

        <div v-if="dashboard?.categories[0]" class="p-3 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] text-[11px] text-[#3B4E24] leading-relaxed">
          Danh mục bán chạy nhất: <strong>{{ dashboard.categories[0].name }}</strong> với {{ formatNumber(dashboard.categories[0].unitsSold) }} sản phẩm đã giao.
        </div>
        <div v-else class="p-3 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] text-[11px] text-[#3B4E24] leading-relaxed">
          Chưa có dữ liệu đơn hàng hoàn tất để phân tích danh mục.
        </div>
      </div>
    </div>

    <!-- Bottom Grid: Đơn hàng mới cần xử lý gấp & Cảnh báo tồn kho (Figma 10) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Cột Trái: Bảng Đơn hàng mới cần xử lý gấp -->
      <div class="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">Đơn hàng mới cần xử lý gấp</h3>
              <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">{{ dashboard ? `${formatNumber(dashboard.summary.pendingOrders)} đơn chờ` : '— đơn chờ' }}</span>
            </div>
            <p class="text-xs text-[#7A866E] mt-0.5">Các đơn mới nhất đang chờ xác nhận</p>
          </div>
          <RouterLink to="/admin/orders" class="text-xs font-bold text-[#4D6A34] hover:underline">
            Xem tất cả đơn &gt;
          </RouterLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
              <tr>
                <th class="py-3 px-3">Mã đơn</th>
                <th class="py-3 px-3">Khách hàng</th>
                <th class="py-3 px-3">Sản phẩm chính</th>
                <th class="py-3 px-3">Tổng tiền</th>
                <th class="py-3 px-3">Thanh toán</th>
                <th class="py-3 px-3">Trạng thái</th>
                <th class="py-3 px-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F0F3EC]">
              <tr v-for="order in dashboard?.urgentOrders ?? []" :key="order.id" class="hover:bg-[#FAF9F5]">
                <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">{{ order.orderCode }}</td>
                <td class="py-3.5 px-3">
                  <div class="font-bold text-[#2D3B1E]">{{ order.customerName }}</div>
                  <span class="text-[10px] text-[#7A866E]">{{ maskPhone(order.customerPhone) }}</span>
                </td>
                <td class="py-3.5 px-3 max-w-[160px] truncate">{{ order.mainProduct }}</td>
                <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">{{ formatVnd(order.total) }}</td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold" :class="order.paymentMethod === 'vietqr' ? 'bg-[#EBF1E6] text-[#4D6A34]' : 'bg-slate-100 text-slate-700'">
                    {{ formatPaymentMethod(order.paymentMethod) }}
                  </span>
                </td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="order.status === 'pending' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'">
                    {{ formatOrderStatus(order.status) }}
                  </span>
                </td>
                <td class="py-3.5 px-3 text-right">
                  <RouterLink to="/admin/orders" class="inline-block px-2.5 py-1 rounded-xl bg-[#4D6A34] text-white text-[10px] font-bold hover:bg-[#3B4E24]">
                    Xử lý
                  </RouterLink>
                </td>
              </tr>
              <tr v-if="!isLoading && dashboard && !dashboard.urgentOrders.length">
                <td colspan="7" class="px-3 py-6 text-center text-xs text-[#7A866E]">Không có đơn hàng cần xử lý.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cột Phải: Cảnh báo tồn kho & Hạn bảo quản -->
      <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-amber-600" />
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">Cảnh báo tồn kho</h3>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">{{ dashboard ? `${dashboard.lowStockProducts.length} mục` : '— mục' }}</span>
        </div>
        <p class="text-xs text-[#7A866E]">Sản phẩm đang có tồn kho không quá 30 đơn vị</p>

        <div v-for="product in dashboard?.lowStockProducts ?? []" :key="product.id" class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC] space-y-2">
          <div class="flex justify-between items-start text-xs">
            <div>
              <h4 class="font-bold text-[#2D3B1E]">{{ product.name }}</h4>
              <span class="text-[10px] text-[#7A866E]">SKU: {{ product.code }}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full font-bold text-[10px]" :class="product.stock <= product.threshold / 2 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'">Còn {{ formatNumber(product.stock) }}</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full rounded-full" :class="product.stock <= product.threshold / 2 ? 'bg-rose-500' : 'bg-amber-500'" :style="{ width: `${Math.min((product.stock / product.threshold) * 100, 100)}%` }"></div>
          </div>
          <span class="text-[10px] text-[#7A866E] block">Ngưỡng cảnh báo: {{ product.threshold }} • <strong :class="product.stock <= product.threshold / 2 ? 'text-rose-600' : 'text-amber-700'">{{ product.stock === 0 ? 'Hết hàng' : 'Sắp hết hàng' }}</strong></span>
        </div>

        <p v-if="!isLoading && dashboard && !dashboard.lowStockProducts.length" class="rounded-2xl bg-[#F6F8F3] p-4 text-xs text-[#7A866E]">Hiện không có sản phẩm dưới ngưỡng cảnh báo.</p>

        <RouterLink
          to="/admin/products"
          class="w-full py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Plus class="w-4 h-4" />
          <span>Quản lý kho sản phẩm</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
