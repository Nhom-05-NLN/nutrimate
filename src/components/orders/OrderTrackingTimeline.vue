<script setup lang="ts">
import { computed } from 'vue';
import { Order } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import {
  Truck,
  Phone,
  Clock,
  CheckCircle2,
  Package,
  MapPin,
  Bot,
  ShieldCheck,
} from 'lucide-vue-next';

const props = defineProps<{
  order: Order | null;
}>();

const chatStore = useChatStore();

const steps = computed(() => {
  const o = props.order;
  if (!o) return [];

  const createdTime = o.createdAt
    ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '09:30';

  const isPending = o.status === 'pending';
  const isConfirmed = ['confirmed', 'packing', 'shipping', 'delivered'].includes(o.status);
  const isPacking = ['packing', 'shipping', 'delivered'].includes(o.status);
  const isShipping = ['shipping', 'delivered'].includes(o.status);
  const isDelivered = o.status === 'delivered';

  return [
    {
      step: 1,
      title: 'Đơn hàng đã được ghi nhận',
      desc: 'Hệ thống tự động kiểm tra giỏ hàng và địa chỉ giao.',
      time: createdTime,
      isCompleted: isConfirmed || isPending,
      isCurrent: isPending,
      icon: Clock,
    },
    {
      step: 2,
      title: 'Kiểm định & Đóng gói',
      desc: 'Bếp NutriMate hoàn tất đóng gói bảo đảm tiêu chuẩn tươi sạch.',
      time: '+15 phút',
      isCompleted: isPacking,
      isCurrent: o.status === 'confirmed' || o.status === 'packing',
      icon: Package,
    },
    {
      step: 3,
      title: 'Đang trên đường giao đến bạn',
      desc: 'Đơn hàng đang được vận chuyển an toàn và nhanh chóng đến bạn.',
      time: '+30 phút',
      isCompleted: isShipping,
      isCurrent: o.status === 'shipping',
      icon: Truck,
    },
    {
      step: 4,
      title: 'Giao hàng thành công',
      desc: 'Đồng kiểm tra độ giòn tươi và hoàn tất bàn giao thực phẩm.',
      time: 'Dự kiến 2H',
      isCompleted: isDelivered,
      isCurrent: isDelivered,
      icon: CheckCircle2,
    },
  ];
});
</script>

<template>
  <div v-if="order" class="bg-white p-5 rounded-3xl border border-[#CCD7BC] shadow-xs space-y-4">
    <!-- Header Tracking -->
    <div>
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-bold text-[#4D6A34] flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Theo dõi vận chuyển trực tiếp
        </span>
        <span class="text-xs font-mono font-bold text-[#242424]">#{{ order.orderCode }}</span>
      </div>
      <p class="text-xs text-[#7A866E]">
        Phương thức:
        <strong class="text-[#242424]">
          {{ order.shippingMethod === 'express_2h' ? 'Giao Siêu Tốc 2H' : 'Giao Tiêu Chuẩn' }}
        </strong>
      </p>
    </div>

    <!-- Stepper 4 bước tiến trình giao hàng (CN_23) -->
    <div class="space-y-3 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#CCD7BC]">
      <div
        v-for="s in steps"
        :key="s.step"
        class="relative"
        :class="{ 'opacity-60': !s.isCompleted && !s.isCurrent }"
      >
        <!-- Icon Marker -->
        <span
          class="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
          :class="
            s.isCompleted
              ? 'bg-[#4D6A34] text-white shadow-2xs'
              : s.isCurrent
              ? 'bg-[#4D6A34] text-white ring-3 ring-[#EBF7E5]'
              : 'bg-[#EBF7E5] text-[#7A866E] border border-[#CCD7BC]'
          "
        >
          <span v-if="s.isCompleted">✓</span>
          <span v-else>{{ s.step }}</span>
        </span>

        <!-- Step Content -->
        <div :class="s.isCurrent ? 'p-2.5 bg-[#F6F8F3] rounded-xl border border-[#CCD7BC]' : ''">
          <div class="flex items-center justify-between text-xs sm:text-sm">
            <span class="font-bold" :class="s.isCurrent ? 'text-[#3B4E24]' : 'text-[#242424]'">
              {{ s.title }}
            </span>
            <span class="text-[11px] text-[#7A866E] font-medium">{{ s.time }}</span>
          </div>
          <p class="text-[11px] text-[#7A866E] mt-0.5 leading-relaxed">
            {{ s.desc }}
          </p>
        </div>
      </div>
    </div>

    <!-- Địa chỉ nhận hàng -->
    <div class="pt-3 border-t border-[#F0F3EC] space-y-1 text-xs">
      <span class="font-bold text-[#242424] flex items-center gap-1.5">
        <MapPin class="w-3.5 h-3.5 text-[#4D6A34] shrink-0" />
        <span>Giao đến:</span>
      </span>
      <p class="text-[#576449] pl-5 font-semibold break-words leading-relaxed">
        {{ order.customer?.address || 'Chưa cập nhật địa chỉ giao hàng' }}
      </p>
      <p v-if="order.customer?.name || order.customer?.phone" class="text-[#7A866E] pl-5">
        {{ order.customer?.name }}
        <span v-if="order.customer?.phone">({{ order.customer.phone }})</span>
      </p>
    </div>

    <!-- Nút Hỏi NutriBot Tra Cứu Đơn (CN_23) -->
    <div class="pt-3 border-t border-[#F0F3EC] space-y-2">
      <button
        type="button"
        @click="chatStore.askAboutOrder(order.orderCode)"
        class="w-full py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#4D6A34] font-bold text-xs border border-[#CCD7BC] flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[38px]"
      >
        <Bot class="w-4 h-4 text-[#4D6A34]" />
        <span>Hỏi NutriBot tra cứu đơn hàng này</span>
      </button>

      <div class="flex items-center justify-between text-[11px] text-[#7A866E] px-1">
        <a href="tel:19008899" class="hover:text-[#4D6A34] flex items-center gap-1">
          <Phone class="w-3 h-3" /> Hotline 1900 8899
        </a>
        <span class="flex items-center gap-1 text-[#4D6A34]">
          <ShieldCheck class="w-3 h-3" /> Cam kết chuẩn tươi 100%
        </span>
      </div>
    </div>
  </div>
</template>
