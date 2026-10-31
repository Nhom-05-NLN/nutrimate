<script setup lang="ts">
import { computed } from 'vue';
import { Order } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import {
  Truck,
  RotateCcw,
  Bot,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  QrCode,
  XCircle,
} from 'lucide-vue-next';

const props = defineProps<{
  order: Order;
  isSelectedForTracking?: boolean;
}>();

const emit = defineEmits<{
  (e: 'viewDetail', order: Order): void;
  (e: 'trackOrder', order: Order): void;
  (e: 'reorder', order: Order): void;
  (e: 'payNow', order: Order): void;
  (e: 'cancelOrder', order: Order): void;
}>();

const chatStore = useChatStore();

const isPendingQrPayment = computed(() => {
  return (
    props.order.status === 'pending' &&
    props.order.paymentStatus === 'pending' &&
    (props.order.paymentMethod === 'vietqr' || props.order.paymentMethod === 'momo')
  );
});

const remainingMinutes = computed(() => {
  const createdTime = new Date(props.order.createdAt).getTime();
  if (isNaN(createdTime)) return 0;
  const diffMs = 30 * 60 * 1000 - (Date.now() - createdTime);
  return Math.max(0, Math.ceil(diffMs / (60 * 1000)));
});

const isExpired30Min = computed(() => {
  return isPendingQrPayment.value && remainingMinutes.value <= 0;
});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(order: Order) {
  if (order.status === 'cancelled') {
    const isTimeout = order.notes?.includes('quá hạn') || order.notes?.includes('30 phút');
    return {
      text: isTimeout ? '✕ Đã hủy (Quá hạn thanh toán)' : '✕ Đã hủy',
      class: 'bg-rose-50 text-rose-800 border-rose-200',
    };
  }

  switch (order.status) {
    case 'delivered':
      return { text: '✓ Đã giao thành công', class: 'bg-[#EBF7E5] text-[#4D6A34] border-[#CCD7BC]' };
    case 'shipping':
      return { text: '🛵 Đang vận chuyển 2H', class: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' };
    case 'packing':
      return { text: '📦 Đang đóng thùng mát', class: 'bg-sky-50 text-sky-800 border-sky-200' };
    case 'confirmed':
      return { text: '✓ Đã xác nhận đơn', class: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    default:
      if (order.paymentStatus === 'pending' && (order.paymentMethod === 'vietqr' || order.paymentMethod === 'momo')) {
        return { text: '⏳ Chờ thanh toán QR', class: 'bg-amber-50 text-amber-800 border-amber-200' };
      }
      return { text: '⏳ Chờ xác nhận', class: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
}
</script>

<template>
  <div
    class="bg-white rounded-3xl p-6 sm:p-7 shadow-2xs space-y-5 transition-all"
    :class="
      isSelectedForTracking
        ? 'border-2 border-[#4D6A34] shadow-md ring-4 ring-[#EBF7E5]'
        : 'border border-[#E3E8DC] hover:border-[#CCD7BC]'
    "
  >
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F3EC] pb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center border border-[#CCD7BC]">
          <Truck class="w-5 h-5 stroke-[1.8]" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-heading text-base font-black text-[#242424]">#{{ order.orderCode }}</h3>
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
              :class="getStatusBadge(order).class"
            >
              {{ getStatusBadge(order).text }}
            </span>
          </div>
          <p class="text-xs text-[#7A866E] flex items-center gap-1 mt-0.5">
            <Calendar class="w-3.5 h-3.5" />
            <span>{{ formatDate(order.createdAt) }}</span>
          </p>
        </div>
      </div>

      <div class="text-left sm:text-right">
        <span class="text-xs text-[#7A866E] block">Tổng thanh toán:</span>
        <span class="font-heading text-lg font-black text-[#242424]">
          {{ formatVnd(order.totalAmount) }}
        </span>
      </div>
    </div>

    <!-- Items Preview (Tối đa 3 món) -->
    <div class="space-y-3">
      <div
        v-for="item in order.items.slice(0, 3)"
        :key="item.productId"
        class="flex items-center justify-between gap-4 text-xs sm:text-sm"
      >
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <img
            v-if="item.productImage"
            :src="item.productImage"
            :alt="item.productName"
            class="w-13 h-13 rounded-2xl object-cover border border-[#E8ECE2] shrink-0"
            loading="lazy"
          />
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-[#242424] truncate">{{ item.productName }}</h4>
            <div class="text-xs text-[#7A866E] mt-0.5 flex items-center gap-2">
              <span v-if="item.portion" class="font-medium text-[#242424]">{{ item.portion }}</span>
              <span>•</span>
              <span>SL: x{{ item.quantity }}</span>
              <span>•</span>
              <span class="text-[#4D6A34] font-semibold">{{ item.calories * item.quantity }} kcal</span>
            </div>
          </div>
        </div>

        <span class="font-bold text-sm text-[#242424] shrink-0">
          {{ formatVnd(item.price * item.quantity) }}
        </span>
      </div>

      <p v-if="order.items.length > 3" class="text-xs text-[#7A866E] italic pt-1">
        + và {{ order.items.length - 3 }} sản phẩm khác trong đơn hàng...
      </p>
    </div>

    <!-- Pending QR Payment Alert Bar (Khi đơn chờ thanh toán QR trong vòng 30 phút) -->
    <div
      v-if="isPendingQrPayment && !isExpired30Min"
      class="p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
      :class="order.paymentMethod === 'momo' ? 'bg-pink-50/80 border border-pink-200 text-pink-950' : 'bg-[#EBF7E5]/70 border border-[#CCD7BC] text-[#242424]'"
    >
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 shrink-0" :class="order.paymentMethod === 'momo' ? 'text-[#D82D8B]' : 'text-[#4D6A34]'" />
        <span>
          Đơn hàng đang chờ thanh toán qua <strong>{{ order.paymentMethod === 'momo' ? 'Ví MoMo' : 'VietQR' }}</strong>.
          Tự động hủy sau: <strong class="font-mono font-black" :class="order.paymentMethod === 'momo' ? 'text-[#D82D8B]' : 'text-[#4D6A34]'">{{ remainingMinutes }} phút</strong>
        </span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="emit('payNow', order)"
          class="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer min-h-[32px]"
          :class="order.paymentMethod === 'momo' ? 'bg-[#D82D8B] hover:bg-[#A50064]' : 'bg-[#4D6A34] hover:bg-[#3B4E24]'"
        >
          <QrCode class="w-3.5 h-3.5" />
          <span>Thanh toán ngay</span>
        </button>
        <button
          type="button"
          @click="emit('cancelOrder', order)"
          class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 transition-colors cursor-pointer min-h-[32px]"
        >
          Hủy đơn
        </button>
      </div>
    </div>

    <!-- Actions Row -->
    <div class="pt-4 border-t border-[#F0F3EC] flex flex-wrap items-center justify-between gap-3">
      <!-- NutriBot Button (CN_23) -->
      <button
        type="button"
        @click="chatStore.askAboutOrder(order.orderCode)"
        class="px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] hover:bg-[#EBF7E5] flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
      >
        <Bot class="w-4 h-4" />
        <span>Hỏi NutriBot</span>
      </button>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <button
          v-if="order.status === 'pending' && !isPendingQrPayment"
          type="button"
          @click="emit('cancelOrder', order)"
          class="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 transition-colors cursor-pointer min-h-[36px]"
        >
          Hủy đơn
        </button>

        <button
          type="button"
          @click="emit('viewDetail', order)"
          class="px-3.5 py-2 rounded-xl bg-white border border-[#E3E8DC] text-xs font-bold text-[#576449] hover:bg-[#FAF9F5] transition-colors cursor-pointer min-h-[36px]"
        >
          Xem chi tiết
        </button>

        <button
          type="button"
          @click="emit('trackOrder', order)"
          class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
          :class="
            isSelectedForTracking
              ? 'bg-[#232722] text-white shadow-xs'
              : 'bg-[#EBF7E5] text-[#4D6A34] hover:bg-[#4D6A34] hover:text-white'
          "
        >
          <Truck class="w-3.5 h-3.5" />
          <span>Theo dõi đơn</span>
        </button>

        <!-- Re-order button (CN_22) -->
        <button
          type="button"
          @click="emit('reorder', order)"
          class="px-4 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[36px]"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Mua lại</span>
        </button>
      </div>
    </div>
  </div>
</template>
