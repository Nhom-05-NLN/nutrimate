<script setup lang="ts">
import { Product } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import NutritionBadge from './NutritionBadge.vue';
import { ShoppingBag, Eye, Star } from 'lucide-vue-next';

const props = defineProps<{
  product: Product;
}>();

const cartStore = useCartStore();
const productStore = useProductStore();

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
</script>

<template>
  <div
    class="group relative flex flex-col bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/40 shadow-xs hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 overflow-hidden"
  >
    <!-- Product Image & Badges -->
    <div class="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer" @click="productStore.selectProduct(product)">
      <img
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      <!-- Category Tag & Badges -->
      <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[80%]">
        <span
          v-for="badge in product.badges.slice(0, 2)"
          :key="badge"
          class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-emerald-900 shadow-xs backdrop-blur-xs"
        >
          {{ badge }}
        </span>
      </div>

      <!-- Rating Pill -->
      <div class="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/80 text-white text-[11px] font-semibold backdrop-blur-xs">
        <Star class="w-3 h-3 text-amber-400 fill-amber-400" />
        <span>{{ product.rating }}</span>
        <span class="text-slate-400 text-[10px]">({{ product.reviewCount }})</span>
      </div>
    </div>

    <!-- Card Content -->
    <div class="flex-1 flex flex-col p-5">
      <!-- Category & Code -->
      <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
        <span class="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
          {{ product.categoryName }}
        </span>
        <span class="font-mono text-slate-400">{{ product.code }}</span>
      </div>

      <!-- Title -->
      <h3
        @click="productStore.selectProduct(product)"
        class="font-heading text-base font-bold text-slate-900 line-clamp-2 hover:text-emerald-700 transition-colors cursor-pointer mb-2"
        :title="product.name"
      >
        {{ product.name }}
      </h3>

      <!-- Best for snippet -->
      <p class="text-xs text-slate-500 line-clamp-1 mb-3">
        {{ product.bestFor }}
      </p>

      <!-- Nutrition Metrics -->
      <div class="mb-4">
        <NutritionBadge :nutrition="product.nutrition" />
      </div>

      <!-- Price & Actions (Pushed to bottom) -->
      <div class="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <!-- Price -->
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="font-heading text-lg font-bold text-slate-900">
              {{ formatVnd(product.price) }}
            </span>
            <span
              v-if="product.originalPrice && product.originalPrice > product.price"
              class="text-xs text-slate-400 line-through"
            >
              {{ formatVnd(product.originalPrice) }}
            </span>
          </div>
          <span class="text-[11px] text-slate-400 block">/ {{ product.nutrition.servingSize }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1.5">
          <!-- View Detail Button -->
          <button
            type="button"
            @click="productStore.selectProduct(product)"
            class="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Xem bảng dinh dưỡng"
            aria-label="Xem chi tiết dinh dưỡng"
          >
            <Eye class="w-4 h-4" />
          </button>

          <!-- Add to Cart Button -->
          <button
            type="button"
            @click="cartStore.addItem(product, 1)"
            class="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 transition-all min-h-[44px]"
            title="Thêm vào giỏ hàng"
          >
            <ShoppingBag class="w-4 h-4" />
            <span class="hidden sm:inline">Thêm</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
