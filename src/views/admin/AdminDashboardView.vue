<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

const route = useRoute();
const router = useRouter();
const dashboard = ref<AdminDashboardData | null>(null);
const isLoading = ref(true);
const loadError = ref('');
const categoryColors = ['#4D6A34', '#7F9C5B', '#A8C28E', '#D4E2C4'];
const currentWeekStart = getCurrentWeekStart();
const selectedPeriod = ref<'week' | 'month' | 'year'>(
  route.query.period === 'month' || route.query.period === 'year' ? route.query.period : 'week',
);
let dashboardRequestId = 0;
const selectedWeekStart = computed(() => {
  const week = route.query.week;
  return typeof week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(week) && week <= currentWeekStart
    ? week
    : currentWeekStart;
});
const selectedPeriodStart = computed(() => {
  if (selectedPeriod.value === 'week') return selectedWeekStart.value;
  if (selectedPeriod.value === 'month') {
    const month = typeof route.query.month === 'string' ? route.query.month : new Date().toISOString().slice(0, 7);
    return /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : new Date().toISOString().slice(0, 8).concat('01');
  }
  const year = typeof route.query.year === 'string' ? route.query.year : String(new Date().getUTCFullYear());
  return /^\d{4}$/.test(year) ? `${year}-01-01` : `${new Date().getUTCFullYear()}-01-01`;
});

const peakSalesDay = computed(() =>
  dashboard.value?.weeklySales.reduce(
    (peak, day) => (day.revenue > peak.revenue ? day : peak),
    { date: '', revenue: 0, orders: 0 },
  ),
);
const averageOtherDayRevenue = computed(() => {
  const days = dashboard.value?.weeklySales.filter(
    (day) => day.date !== peakSalesDay.value?.date && day.revenue > 0,
  ) ?? [];
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
const hasWeeklyRevenue = computed(() =>
  dashboard.value?.weeklySales.some((day) => day.revenue > 0) ?? false,
);
const periodLabelForCopy = computed(() =>
  selectedPeriod.value === 'year'
    ? 'năm'
    : selectedPeriod.value === 'month'
      ? 'tháng'
      : 'tuần',
);
const areaChart = computed(() => {
  const sales = dashboard.value?.weeklySales ?? [];
  const width = 700;
  const left = 58;
  const right = 18;
  const top = 18;
  const bottom = 174;
  const plotWidth = width - left - right;
  const plotHeight = bottom - top;
  const rawMax = Math.max(1, ...sales.map((day) => day.revenue));
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(rawMax)) - 1);
  const maxRevenue = Math.ceil(rawMax / magnitude) * magnitude;

  const points = sales.map((day, index) => {
    const x = sales.length > 1
      ? left + (plotWidth * index) / (sales.length - 1)
      : left + plotWidth / 2;
    const y = bottom - (day.revenue / maxRevenue) * plotHeight;
    return { x, y, ...day };
  });

  const linePath = points.length
    ? points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const middleX = (previous.x + point.x) / 2;
      return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
    }, '')
    : '';
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`
    : '';

  return { width, left, right, top, bottom, plotWidth, plotHeight, maxRevenue, points, linePath, areaPath };
});
const selectedWeekLabel = computed(() => {
  const start = new Date(`${selectedWeekStart.value}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const startLabel = new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(start);
  const endLabel = new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(end);
  return `${startLabel} – ${endLabel}`;
});
const selectedPeriodLabel = computed(() => {
  const start = new Date(`${selectedPeriodStart.value}T00:00:00.000Z`);
  if (selectedPeriod.value === 'year') {
    return `Năm ${start.getUTCFullYear()}`;
  }
  if (selectedPeriod.value === 'month') {
    return new Intl.DateTimeFormat('vi-VN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(start);
  }
  return selectedWeekLabel.value;
});

async function loadDashboard() {
  const requestId = ++dashboardRequestId;
  isLoading.value = true;
  loadError.value = '';
  dashboard.value = null;
  try {
    const result = await fetchAdminDashboard(selectedPeriodStart.value, selectedPeriod.value);
    if (requestId === dashboardRequestId) dashboard.value = result;
  } catch (error: unknown) {
    if (requestId === dashboardRequestId) {
      loadError.value = error instanceof Error
        ? error.message
        : 'Không thể tải dữ liệu dashboard.';
    }
  } finally {
    if (requestId === dashboardRequestId) isLoading.value = false;
  }
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - ((now.getUTCDay() + 6) % 7),
  ));
  return monday.toISOString().slice(0, 10);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatAxisVnd(amount: number): string {
  if (amount >= 1_000_000) {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(amount / 1_000_000)} tr`;
  }
  if (amount >= 1_000) {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount / 1_000)}k`;
  }
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount);
}

function formatWeekday(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(
    new Date(year, month - 1, day),
  );
}

function formatMonthDay(dateValue: string): number {
  return Number(dateValue.slice(-2));
}

function formatAreaLabel(dateValue: string): string {
  if (selectedPeriod.value === 'year') {
    const month = Number(dateValue.slice(5, 7));
    return `T${month}`;
  }
  return String(formatMonthDay(dateValue));
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

watch([selectedWeekStart, selectedPeriod, selectedPeriodStart], () => {
  void loadDashboard();
}, { immediate: true });

watch(
  () => route.query.period,
  (period) => {
    selectedPeriod.value = period === 'month' || period === 'year' ? period : 'week';
  },
);

function setDashboardPeriod(period: 'week' | 'month' | 'year'): void {
  selectedPeriod.value = period;
  void router.replace({
    query: {
      ...route.query,
      period: period === 'week' ? undefined : period,
    },
  });
}
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

    <div class="flex flex-col gap-3 rounded-2xl border border-[#E3E8DC] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="font-heading text-base font-black text-[#2D3B1E] sm:text-lg">Thống kê</p>
        <p class="mt-1 text-sm text-[#7A866E]">Chọn khoảng thời gian hiển thị dữ liệu</p>
      </div>
      <div class="flex items-center gap-1.5 rounded-xl bg-[#F6F8F3] p-1.5">
        <button
          v-for="option in ([
            { value: 'week', label: 'Theo tuần' },
            { value: 'month', label: 'Theo tháng' },
            { value: 'year', label: 'Theo năm' },
          ] as const)"
          :key="option.value"
          type="button"
          @click="setDashboardPeriod(option.value)"
          class="rounded-lg px-4 py-2.5 text-sm font-bold transition-colors"
          :class="selectedPeriod === option.value
            ? 'bg-[#536124] text-white shadow-xs'
            : 'text-[#7A866E] hover:bg-white hover:text-[#2D3B1E]'"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Top 4 KPIs Cards (Figma 10) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- 1. Doanh thu -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Doanh thu · {{ selectedPeriodLabel }}</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <DollarSign class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ dashboard ? formatVnd(dashboard.summary.weeklyRevenue) : '—' }}
        </div>
        <div class="flex items-center gap-1.5 text-xs font-bold" :class="(dashboard?.summary.revenueChangePercent ?? 0) >= 0 ? 'text-[#4D6A34]' : 'text-rose-700'">
          <span>{{ dashboard?.summary.revenueChangePercent === null ? 'Chưa có dữ liệu so sánh' : dashboard ? `${dashboard.summary.revenueChangePercent >= 0 ? '+' : ''}${dashboard.summary.revenueChangePercent.toFixed(1)}%` : 'Đang tải…' }}</span>
          <span v-if="dashboard && dashboard.summary.revenueChangePercent !== null" class="text-[#7A866E] font-normal">so với {{ periodLabelForCopy }} trước</span>
        </div>
      </div>

      <!-- 2. Đơn hàng trong tuần, không tính đơn đã hủy -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Đơn hàng · {{ selectedPeriodLabel }}</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <ShoppingCart class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ dashboard ? formatNumber(dashboard.summary.totalOrders) : '—' }} <span class="text-xs font-normal text-[#7A866E]">đơn</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>{{ dashboard ? `${dashboard.summary.deliveredOrderPercent.toFixed(1)}% đã giao` : 'Đang tải…' }}</span>
          <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">{{ dashboard ? `${formatNumber(dashboard.summary.pendingOrders)} chờ hiện tại` : '— chờ hiện tại' }}</span>
        </div>
      </div>

      <!-- 3. Khách hàng hoạt động -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Tổng khách hàng hiện tại</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          {{ dashboard ? formatNumber(dashboard.summary.totalCustomers) : '—' }} <span class="text-xs font-normal text-[#7A866E]">khách</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="text-[#4D6A34] font-bold">+{{ dashboard ? formatNumber(dashboard.summary.newCustomers) : '—' }} mới trong {{ periodLabelForCopy }}</span>
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
          {{ dashboard ? formatNumber(dashboard.summary.weeklyChatMessages) : '—' }} <span class="text-xs font-normal text-[#7A866E]">lượt</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tin nhắn NutriBot trong {{ periodLabelForCopy }}</span>
        </div>
      </div>
    </div>

    <!-- Middle Grid: Chart Doanh Thu & Biểu Đồ Phân Bổ Danh Mục (Figma 10) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- Cột Trái: Biến động doanh thu theo tuần -->
      <div class="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F3EC] pb-4">
          <div>
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">
              Doanh thu {{ selectedPeriod === 'week' ? 'theo ngày' : selectedPeriod === 'month' ? 'theo ngày trong tháng' : 'theo tháng trong năm' }} · {{ selectedPeriodLabel }}
            </h3>
            <p class="text-xs text-[#7A866E]">Tổng tiền đơn đã giao; số đơn không tính đơn hủy</p>
          </div>
        </div>

        <div class="relative h-52 overflow-x-auto">
          <svg
            class="h-52 w-full min-w-[700px]"
            viewBox="0 0 700 208"
            preserveAspectRatio="none"
            role="img"
            aria-label="Biểu đồ miền doanh thu theo ngày"
          >
            <defs>
              <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#536124" stop-opacity="0.42" />
                <stop offset="70%" stop-color="#8FA66C" stop-opacity="0.16" />
                <stop offset="100%" stop-color="#DDE5CD" stop-opacity="0.04" />
              </linearGradient>
              <filter id="pointShadow" x="-100%" y="-100%" width="300%" height="300%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#536124" flood-opacity="0.22" />
              </filter>
            </defs>

            <g v-for="step in 5" :key="step">
              <text
                :x="areaChart.left - 10"
                :y="areaChart.bottom - (areaChart.plotHeight * (step - 1)) / 4 + 4"
                text-anchor="end"
                fill="#98A08F"
                font-size="9"
                font-weight="700"
              >{{ formatAxisVnd(areaChart.maxRevenue * (step - 1) / 4) }}</text>
              <line
                :x1="areaChart.left"
                :x2="700 - areaChart.right"
                :y1="areaChart.bottom - (areaChart.plotHeight * (step - 1)) / 4"
                :y2="areaChart.bottom - (areaChart.plotHeight * (step - 1)) / 4"
                :stroke="step === 1 ? '#D9E0CF' : '#EDF1E8'"
                stroke-width="1"
              />
            </g>

            <path
              v-if="areaChart.areaPath"
              :d="areaChart.areaPath"
              fill="url(#revenueArea)"
            />
            <path
              v-if="areaChart.linePath"
              :d="areaChart.linePath"
              fill="none"
              stroke="#4D6A34"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />

            <g v-for="point in areaChart.points" :key="point.date">
              <line
                v-if="point.revenue > 0"
                :x1="point.x"
                :x2="point.x"
                :y1="point.y"
                :y2="areaChart.bottom"
                stroke="#DDE5CD"
                stroke-width="1"
                stroke-dasharray="3 5"
                opacity="0.7"
              />
              <circle
                v-if="peakSalesDay?.date === point.date && point.revenue > 0"
                :cx="point.x"
                :cy="point.y"
                r="9"
                fill="#536124"
                opacity="0.12"
              />
              <circle
                :cx="point.x"
                :cy="point.y"
                r="4"
                fill="#FFFFFF"
                stroke="#4D6A34"
                stroke-width="2.5"
                filter="url(#pointShadow)"
                vector-effect="non-scaling-stroke"
              >
                <title>{{ formatWeekday(point.date) }} {{ formatMonthDay(point.date) }} · {{ formatVnd(point.revenue) }} · {{ formatNumber(point.orders) }} đơn</title>
              </circle>
              <g v-if="peakSalesDay?.date === point.date && point.revenue > 0">
                <rect
                  :x="Math.max(areaChart.left, point.x - 34)"
                  :y="Math.max(4, point.y - 34)"
                  width="68"
                  height="22"
                  rx="8"
                  fill="#26351D"
                />
                <text
                  :x="Math.max(areaChart.left, point.x - 34) + 34"
                  :y="Math.max(4, point.y - 34) + 14"
                  text-anchor="middle"
                  fill="#FFFFFF"
                  font-size="9"
                  font-weight="800"
                >{{ formatAxisVnd(point.revenue) }}</text>
              </g>
              <text
                :x="point.x"
                y="198"
                text-anchor="middle"
                fill="#7A866E"
                font-size="11"
                font-weight="700"
              >{{ formatAreaLabel(point.date) }}</text>
            </g>
          </svg>
          <p
            v-if="!isLoading && dashboard && !hasWeeklyRevenue"
            class="pointer-events-none absolute inset-0 flex items-center justify-center pb-6 text-center text-xs text-[#7A866E]"
          >
            Chưa có doanh thu đơn đã giao trong {{ periodLabelForCopy }} này.
          </p>
        </div>

        <div class="flex flex-col gap-3 border-t border-[#F0F3EC] pt-3 text-xs text-[#7A866E] sm:flex-row sm:items-center sm:justify-between">
          <span class="flex items-start gap-1.5 text-[#2D3B1E]">
            <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-[#4D6A34]" />
            <span v-if="peakSalesDay?.date">
              Doanh số đỉnh {{ formatWeekday(peakSalesDay.date) }} {{ formatMonthDay(peakSalesDay.date) }}: <strong>{{ formatVnd(peakSalesDay.revenue) }}</strong>
              <span v-if="peakRevenueChange !== null" class="text-[#7A866E]">
                (tăng {{ peakRevenueChange.toFixed(0) }}% so với trung bình ngày có doanh thu khác)
              </span>
              <span class="ml-1 text-[#7A866E]">· {{ formatNumber(weeklyOrderCount) }} đơn không hủy trong {{ periodLabelForCopy }}</span>
            </span>
            <span v-else>Chưa có doanh thu đơn đã giao trong {{ periodLabelForCopy }}.</span>
          </span>
          <span class="shrink-0 text-[11px] font-bold text-[#4D6A34]">{{ selectedPeriodLabel }}</span>
        </div>
      </div>

      <!-- Cột Phải: Tỷ lệ phân bổ danh mục -->
      <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">Tỷ lệ phân bổ danh mục</h3>
            <span class="text-[10px] font-bold text-[#7A866E] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E3E8DC]">{{ selectedPeriodLabel }}</span>
          </div>
          <p class="text-xs text-[#7A866E] mt-2">Sản phẩm đã giao trong {{ periodLabelForCopy }}</p>

          <div class="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex mt-4">
            <div
              v-for="(category, index) in dashboard?.categories ?? []"
              :key="category.name"
              :style="{ width: `${category.percentage}%`, backgroundColor: categoryColors[index % categoryColors.length] }"
              :title="`${category.name} ${category.percentage.toFixed(1)}%`"
            ></div>
          </div>

          <div class="max-h-64 space-y-3 overflow-y-auto pt-5 text-xs">
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
              <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">Đơn mới đặt</h3>
              <span class="px-2 py-0.5 rounded-full bg-[#EBF1E6] text-[#4D6A34] text-[10px] font-bold">{{ dashboard ? `${dashboard.urgentOrders.length} đơn gần đây` : '— đơn gần đây' }}</span>
            </div>
            <p class="text-xs text-[#7A866E] mt-0.5">3 đơn được đặt gần đây nhất</p>
          </div>
          <RouterLink to="/admin/orders" class="text-xs font-bold text-[#4D6A34] hover:underline">
            Xem tất cả đơn &gt;
          </RouterLink>
        </div>

        <div class="max-h-[28rem] overflow-auto">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 z-[1] bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
              <tr>
                <th class="py-3 px-3">Mã đơn</th>
                <th class="py-3 px-3">Khách hàng</th>
                <th class="py-3 px-3">Sản phẩm chính</th>
                <th class="py-3 px-3">Tổng tiền</th>
                <th class="py-3 px-3">Thanh toán</th>
                <th class="py-3 px-3 min-w-[110px] whitespace-nowrap">Trạng thái</th>
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
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" :class="order.status === 'pending' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'">
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
                <td colspan="7" class="px-3 py-6 text-center text-xs text-[#7A866E]">Chưa có đơn hàng nào.</td>
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

        <div class="max-h-[32rem] space-y-3 overflow-y-auto">
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
