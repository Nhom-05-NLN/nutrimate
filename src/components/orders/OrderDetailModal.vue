<script setup lang="ts">
import { Order } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import {
  X,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  Flame,
  Dumbbell,
  Bot,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  order: Order | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'reorder', order: Order): void;
}>();

const chatStore = useChatStore();

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

function getStatusBadge(status: Order['status']) {
  switch (status) {
    case 'delivered':
      return { text: 'Đã giao thành công', class: 'bg-[#EBF7E5] text-[#4D6A34] border-[#CCD7BC]' };
    case 'shipping':
      return { text: 'Đang vận chuyển 2H', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'packing':
      return { text: 'Đang đóng thùng giữ lạnh', class: 'bg-sky-50 text-sky-800 border-sky-200' };
    case 'confirmed':
      return { text: 'Đã xác nhận đơn', class: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    case 'cancelled':
      return { text: 'Đã hủy', class: 'bg-rose-50 text-rose-800 border-rose-200' };
    default:
      return { text: 'Chờ xác nhận', class: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
}
</script>

<template>
  <div
    v-if="open && order"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    aria-label="Chi tiết đơn hàng"
  >
    <div
      class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E3E8DC] overflow-hidden my-6 transition-all"
    >
      <!-- Header -->
      <div class="p-6 bg-[#FAF9F5] border-b border-[#E8ECE2] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center border border-[#CCD7BC]">
            <Package class="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-heading text-lg font-black text-[#242424]">Đơn hàng #{{ order.orderCode }}</h3>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                :class="getStatusBadge(order.status).class"
              >
                {{ getStatusBadge(order.status).text }}
              </span>
            </div>
            <p class="text-xs text-[#7A866E] flex items-center gap-1.5 mt-0.5">
              <Calendar class="w-3.5 h-3.5" />
              <span>Đặt lúc {{ formatDate(order.createdAt) }}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="w-10 h-10 rounded-2xl bg-white hover:bg-[#EBF7E5] text-[#7A866E] hover:text-[#242424] flex items-center justify-center border border-[#E3E8DC] transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
          aria-label="Đóng"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body Content -->
      <div class="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
        <!-- Nutrition Banner -->
        <div class="p-4 rounded-2xl bg-[#232722] text-white flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <Flame class="w-4 h-4 text-amber-300" />
            <span>Tổng calo nạp vào: <strong class="text-white">{{ order.totalCalories }} kcal</strong></span>
          </div>
          <div class="h-4 w-px bg-slate-700"></div>
          <div class="flex items-center gap-2">
            <Dumbbell class="w-4 h-4 text-emerald-400" />
            <span>Tổng đạm: <strong class="text-white">{{ order.totalProtein }}g Đạm</strong></span>
          </div>
        </div>

        <!-- Thông tin giao hàng & người nhận -->
        <div class="p-4 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4] space-y-2 text-xs sm:text-sm">
          <div class="flex items-start gap-2 text-[#242424]">
            <MapPin class="w-4 h-4 text-[#4D6A34] shrink-0 mt-0.5" />
            <div>
              <span class="font-bold block">{{ order.customer.name }} ({{ order.customer.phone }})</span>
              <p class="text-[#576449] mt-0.5">{{ order.customer.address }}</p>
              <p v-if="order.notes" class="text-xs text-[#7A866E] italic mt-1">Ghi chú: {{ order.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Danh sách sản phẩm chi tiết -->
        <div class="space-y-3">
          <h4 class="font-heading text-sm font-bold text-[#242424] border-b border-[#F0F3EC] pb-2">
            Danh sách món ăn kiêng ({{ order.items.length }} sản phẩm)
          </h4>

          <div class="divide-y divide-[#F0F3EC]">
            <div
              v-for="item in order.items"
              :key="item.productId"
              class="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <img
                  v-if="item.productImage"
                  :src="item.productImage"
                  :alt="item.productName"
                  class="w-14 h-14 rounded-2xl object-cover border border-[#E8ECE2] shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <h5 class="font-bold text-[#242424] truncate">{{ item.productName }}</h5>
                  <div class="text-xs text-[#7A866E] mt-0.5 flex items-center gap-2">
                    <span v-if="item.portion" class="font-medium text-[#242424]">{{ item.portion }}</span>
                    <span>•</span>
                    <span>Số lượng: x{{ item.quantity }}</span>
                    <span>•</span>
                    <span class="text-[#4D6A34] font-semibold">{{ item.calories * item.quantity }} kcal</span>
                  </div>
                </div>
              </div>

              <span class="font-heading font-black text-[#242424] shrink-0">
                {{ formatVnd(item.price * item.quantity) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Chi tiết thanh toán -->
        <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] space-y-2 text-xs sm:text-sm text-[#576449]">
          <div class="flex justify-between">
            <span>Phương thức thanh toán:</span>
            <span class="font-bold text-[#242424] uppercase">{{ order.paymentMethod }}</span>
          </div>
          <div class="flex justify-between">
            <span>Trạng thái thanh toán:</span>
            <span
              class="font-bold px-2 py-0.5 rounded-full text-xs"
              :class="order.paymentStatus === 'paid' ? 'bg-[#EBF7E5] text-[#4D6A34]' : 'bg-amber-100 text-amber-800'"
            >
              {{ order.paymentStatus === 'paid' ? '✓ Đã thanh toán (PAID)' : 'Chờ thanh toán (COD)' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span class="font-bold text-[#242424]">{{ formatVnd(order.shippingFee) }}</span>
          </div>
          <div v-if="order.discountAmount" class="flex justify-between text-[#4D6A34] font-semibold">
            <span>Giảm giá voucher ({{ order.voucherCode }}):</span>
            <span>-{{ formatVnd(order.discountAmount) }}</span>
          </div>
          <div class="pt-2 border-t border-[#DEE5D4] flex justify-between text-base font-black text-[#242424]">
            <span>Tổng thanh toán:</span>
            <span class="text-[#4D6A34] font-heading">{{ formatVnd(order.totalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="p-5 bg-white border-t border-[#E8ECE2] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          @click="chatStore.askAboutOrder(order.orderCode)"
          class="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] hover:bg-[#EBF7E5] flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
        >
          <Bot class="w-4 h-4" />
          <span>Hỏi NutriBot về đơn</span>
        </button>

        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-white border border-[#E3E8DC] text-xs font-bold text-[#576449] hover:bg-[#FAF9F5] transition-colors cursor-pointer min-h-[44px]"
          >
            Đóng
          </button>
          <button
            type="button"
            @click="emit('reorder', order)"
            class="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <RotateCcw class="w-4 h-4" />
            <span>Mua lại đơn này</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
