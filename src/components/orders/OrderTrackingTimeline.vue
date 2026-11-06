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
  Thermometer,
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
      title: 'Kiểm định & Giữ lạnh 4°C',
      desc: 'Bếp NutriMate đóng gói vào thùng cách nhiệt 4°C bảo quản tươi sống.',
      time: '+15 phút',
      isCompleted: isPacking,
      isCurrent: o.status === 'confirmed' || o.status === 'packing',
      icon: Package,
    },
    {
      step: 3,
      title: 'Đang trên đường giao đến bạn',
      desc: 'Tài xế đang vận chuyển an toàn, giữ vững nhiệt độ lạnh tiêu chuẩn.',
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

const driver = computed(() => {
  if (props.order?.driver) return props.order.driver;
  return {
    name: 'Trần Văn Hùng',
    phone: '0909 123 456',
    vehiclePlate: '59F1-882.34',
    coolingCondition: 'Thùng giữ mát 4°C chuyên dụng',
  };
});
</script>

<template>
  <div v-if="order" class="bg-white p-6 sm:p-7 rounded-3xl border border-[#CCD7BC] shadow-sm space-y-6">
    <!-- Header Tracking -->
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-bold text-[#4D6A34] flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          Theo dõi vận chuyển trực tiếp
        </span>
        <span class="text-xs font-mono font-bold text-[#242424]">#{{ order.orderCode }}</span>
      </div>
      <p class="text-xs text-[#7A866E]">
        Phương thức:
        <strong class="text-[#242424]">
          {{ order.shippingMethod === 'express_2h' ? 'Giao Siêu Tốc 2H (Giữ mát 4°C)' : 'Giao Tiêu Chuẩn Cách Nhiệt' }}
        </strong>
      </p>
    </div>

    <!-- Thông tin tài xế & Nhiệt độ bảo quản (CN_23) -->
    <div class="p-4 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4] space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#EBF7E5] text-[#4D6A34] font-bold text-sm flex items-center justify-center border border-[#CCD7BC]">
            TH
          </div>
          <div>
            <h4 class="font-heading text-sm font-bold text-[#242424]">{{ driver.name }}</h4>
            <p class="text-xs text-[#7A866E]">Xe máy {{ driver.vehiclePlate }}</p>
          </div>
        </div>

        <a
          :href="`tel:${driver.phone}`"
          class="w-9 h-9 rounded-xl bg-[#4D6A34] text-white flex items-center justify-center hover:bg-[#3B4E24] shadow-xs cursor-pointer transition-colors"
          title="Gọi điện cho tài xế"
          aria-label="Gọi điện cho tài xế"
        >
          <Phone class="w-4 h-4" />
        </a>
      </div>

      <!-- Nhiệt độ thùng giữ lạnh 4°C (CN_23) -->
      <div class="pt-2.5 border-t border-[#E8ECE2] flex items-center justify-between text-xs text-[#4E5C3E]">
        <div class="flex items-center gap-1.5 font-bold text-[#4D6A34]">
          <Thermometer class="w-4 h-4 text-sky-600" />
          <span>{{ driver.coolingCondition }}</span>
        </div>
        <span class="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 font-semibold text-[10px] border border-sky-200">
          ❄ 3.8°C Đạt Chuẩn
        </span>
      </div>
    </div>

    <!-- Stepper 4 bước tiến trình giao hàng (CN_23) -->
    <div class="space-y-5 relative pl-7 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#CCD7BC]">
      <div
        v-for="s in steps"
        :key="s.step"
        class="relative"
        :class="{ 'opacity-60': !s.isCompleted && !s.isCurrent }"
      >
        <!-- Icon Marker -->
        <span
          class="absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
          :class="
            s.isCompleted
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : s.isCurrent
              ? 'bg-[#4D6A34] text-white ring-4 ring-[#EBF7E5]'
              : 'bg-[#EBF7E5] text-[#7A866E] border border-[#CCD7BC]'
          "
        >
          <span v-if="s.isCompleted">✓</span>
          <span v-else>{{ s.step }}</span>
        </span>

        <!-- Step Content -->
        <div :class="s.isCurrent ? 'p-3 bg-[#F6F8F3] rounded-2xl border border-[#CCD7BC]' : ''">
          <div class="flex items-center justify-between text-xs sm:text-sm">
            <span class="font-bold" :class="s.isCurrent ? 'text-[#3B4E24]' : 'text-[#242424]'">
              {{ s.title }}
            </span>
            <span class="text-[11px] text-[#7A866E] font-medium">{{ s.time }}</span>
          </div>
          <p class="text-xs text-[#7A866E] mt-0.5 leading-relaxed">
            {{ s.desc }}
          </p>
        </div>
      </div>
    </div>

    <!-- Địa chỉ nhận hàng -->
    <div class="pt-4 border-t border-[#F0F3EC] space-y-1 text-xs">
      <span class="font-bold text-[#242424] flex items-center gap-1.5">
        <MapPin class="w-3.5 h-3.5 text-[#4D6A34]" />
        <span>Giao đến:</span>
      </span>
      <p class="text-[#576449] pl-5 font-semibold">{{ order.customer.address }}</p>
      <p class="text-[#7A866E] pl-5">{{ order.customer.name }} ({{ order.customer.phone }})</p>
    </div>

    <!-- Nút Hỏi NutriBot Tra Cứu Đơn (CN_23) -->
    <div class="pt-4 border-t border-[#F0F3EC] space-y-2">
      <button
        type="button"
        @click="chatStore.askAboutOrder(order.orderCode)"
        class="w-full py-3 rounded-2xl bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#4D6A34] font-bold text-xs border border-[#CCD7BC] flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
      >
        <Bot class="w-4 h-4 text-[#4D6A34]" />
        <span>Hỏi NutriBot tra cứu đơn hàng này</span>
      </button>

      <div class="flex items-center justify-between text-[11px] text-[#7A866E] px-1">
        <a href="tel:19008899" class="hover:text-[#4D6A34] flex items-center gap-1">
          <Phone class="w-3 h-3" /> Hotline 1900 8899
        </a>
        <span class="flex items-center gap-1 text-[#4D6A34]">
          <ShieldCheck class="w-3 h-3" /> Bảo đảm tươi sống 100%
        </span>
      </div>
    </div>
  </div>
</template>
