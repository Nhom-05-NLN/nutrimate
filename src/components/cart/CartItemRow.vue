<script setup lang="ts">
import { computed } from 'vue';
import { CartItem } from '../../types';
import { Trash2, Plus, Minus } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    item: CartItem;
    compact?: boolean;
    selectable?: boolean;
    selected?: boolean;
  }>(),
  {
    compact: false,
    selectable: false,
    selected: false,
  }
);

const emit = defineEmits<{
  (e: 'toggleSelect'): void;
  (e: 'updateQuantity', quantity: number): void;
  (e: 'remove'): void;
}>();

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const itemTotal = computed(() => props.item.product.price * props.item.quantity);
const itemCalories = computed(() => Math.round(props.item.product.nutrition.calories * props.item.quantity));
const itemProtein = computed(() => Math.round(props.item.product.nutrition.protein * props.item.quantity * 10) / 10);
</script>

<template>
  <!-- 1. COMPACT MODE (Dành cho Cart Drawer) -->
  <div
    v-if="compact"
    class="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[#E3E8DC] bg-white hover:border-[#4D6A34] transition-all shadow-2xs"
  >
    <img
      :src="item.product.image"
      :alt="item.product.name"
      class="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#E8ECE2]"
      loading="lazy"
    />

    <div class="flex-1 min-w-0 space-y-1">
      <h4 class="font-heading text-sm font-bold text-[#242424] truncate" :title="item.product.name">
        {{ item.product.name }}
      </h4>

      <p class="text-xs text-[#7A866E]">
        Phần: <span class="font-semibold text-[#242424]">{{ item.selectedPortion || 'Mặc định' }}</span>
      </p>

      <div class="flex items-center gap-2 text-[11px] text-[#576449]">
        <span class="font-semibold text-[#4D6A34]">⚡ {{ itemCalories }} kcal</span>
        <span>•</span>
        <span class="font-semibold text-[#3B4E24]">{{ itemProtein }}g Đạm</span>
      </div>

      <span class="font-heading text-sm font-black text-[#242424] block">
        {{ formatVnd(itemTotal) }}
      </span>
    </div>

    <!-- Actions: Quantity & Remove -->
    <div class="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
      <button
        type="button"
        @click="emit('remove')"
        class="p-1.5 text-[#8C9484] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
        title="Xóa khỏi giỏ hàng"
        aria-label="Xóa món"
      >
        <Trash2 class="w-4 h-4" />
      </button>

      <div class="flex items-center border border-[#CCD7BC] rounded-xl bg-[#FAF9F5] p-0.5 shadow-2xs">
        <button
          type="button"
          @click="emit('updateQuantity', item.quantity - 1)"
          class="w-7 h-7 flex items-center justify-center text-[#576449] hover:bg-white rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px]"
          aria-label="Giảm số lượng"
        >
          <Minus class="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <span class="w-7 text-center text-xs font-black text-[#242424]">{{ item.quantity }}</span>
        <button
          type="button"
          @click="emit('updateQuantity', item.quantity + 1)"
          class="w-7 h-7 flex items-center justify-center text-[#576449] hover:bg-white rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px]"
          aria-label="Tăng số lượng"
        >
          <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  </div>

  <!-- 2. FULL / TABLE MODE (Dành cho trang CartView) -->
  <div
    v-else
    class="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:bg-[#FAF9F5] transition-colors"
  >
    <!-- Left: Checkbox + Image + Info -->
    <div class="flex items-start gap-4 flex-1 min-w-0">
      <label v-if="selectable" class="flex items-center cursor-pointer pt-2 shrink-0">
        <input
          type="checkbox"
          :checked="selected"
          @change="emit('toggleSelect')"
          class="accent-[#4D6A34] w-5 h-5 rounded cursor-pointer"
          aria-label="Chọn sản phẩm"
        />
      </label>

      <img
        :src="item.product.image"
        :alt="item.product.name"
        class="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover shrink-0 border border-[#E8ECE2] shadow-2xs"
        loading="lazy"
      />

      <div class="space-y-1.5 min-w-0 flex-1">
        <h3 class="font-heading text-base font-bold text-[#242424] leading-snug line-clamp-2">
          {{ item.product.name }}
        </h3>

        <p class="text-xs text-[#7A866E]">
          Phân loại: <strong class="text-[#242424]">{{ item.selectedPortion || 'Mặc định' }}</strong>
        </p>

        <div class="flex flex-wrap items-center gap-2 pt-1">
          <span class="px-2.5 py-1 rounded-full bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#4D6A34]">
            ⚡ {{ item.product.nutrition.calories }} kcal / {{ item.product.nutrition.servingSize }}
          </span>
          <span class="px-2.5 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#3B4E24]">
            {{ item.product.nutrition.protein }}g Đạm
          </span>
        </div>
      </div>
    </div>

    <!-- Right: Price, Quantity controls, Total & Remove Button -->
    <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F0F3EC]">
      <div class="text-sm font-bold text-[#576449] sm:w-24 text-right">
        {{ formatVnd(item.product.price) }}
      </div>

      <!-- Quantity Box -->
      <div class="flex items-center border border-[#CCD7BC] rounded-2xl bg-white p-1 shadow-2xs">
        <button
          type="button"
          @click="emit('updateQuantity', item.quantity - 1)"
          class="w-8 h-8 flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
          aria-label="Giảm số lượng"
        >
          <Minus class="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <span class="w-8 text-center text-sm font-black text-[#242424]">{{ item.quantity }}</span>
        <button
          type="button"
          @click="emit('updateQuantity', item.quantity + 1)"
          class="w-8 h-8 flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
          aria-label="Tăng số lượng"
        >
          <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Line Total -->
      <div class="font-heading text-base font-black text-[#242424] sm:w-28 text-right">
        {{ formatVnd(itemTotal) }}
      </div>

      <!-- Remove Button -->
      <button
        type="button"
        @click="emit('remove')"
        class="p-2 text-[#8C9484] hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="Xóa món khỏi giỏ hàng"
        aria-label="Xóa món"
      >
        <Trash2 class="w-4.5 h-4.5" />
      </button>
    </div>
  </div>
</template>
