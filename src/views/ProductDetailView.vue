<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchProductById } from '../services/api';
import { useCartStore } from '../stores/cartStore';
import { Product } from '../types';
import NutritionBadge from '../components/catalog/NutritionBadge.vue';
import {
  ArrowLeft,
  ShoppingBag,
  Flame,
  Dumbbell,
  Wheat,
  CandyOff,
  Droplet,
  CheckCircle2,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const product = ref<Product | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const quantity = ref(1);

onMounted(async () => {
  const id = route.params.id as string;
  try {
    product.value = await fetchProductById(id);
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Không thể tải chi tiết sản phẩm';
  } finally {
    isLoading.value = false;
  }
});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleAddToCart() {
  if (product.value) {
    cartStore.addItem(product.value, quantity.value);
  }
}
</script>

<template>
  <div class="py-8 max-w-5xl mx-auto">
    <!-- Back Button -->
    <button
      type="button"
      @click="router.back()"
      class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors mb-6 min-h-[44px]"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Quay lại danh mục</span>
    </button>

    <!-- Loading -->
    <div v-if="isLoading" class="py-20 text-center space-y-3">
      <div class="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-slate-500">Đang tải thông tin dinh dưỡng...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error || !product" class="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
      <h2 class="font-heading text-xl font-bold text-slate-900">Không tìm thấy sản phẩm</h2>
      <p class="text-sm text-slate-500">{{ error || 'Sản phẩm không tồn tại hoặc đã ngừng phục vụ.' }}</p>
      <RouterLink to="/catalog" class="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm">
        Quay về Thực Đơn
      </RouterLink>
    </div>

    <!-- Content -->
    <div v-else class="bg-white rounded-4xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-2">
      <!-- Image -->
      <div class="p-6 sm:p-8 bg-slate-50 flex items-center justify-center">
        <img
          :src="product.image"
          :alt="product.name"
          class="w-full max-w-md aspect-square object-cover rounded-3xl shadow-md"
        />
      </div>

      <!-- Info & Nutrition -->
      <div class="p-6 sm:p-8 flex flex-col justify-between space-y-6">
        <div>
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md uppercase">
            {{ product.categoryName }}
          </span>
          <h1 class="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {{ product.name }}
          </h1>
          <div class="mt-3 flex items-baseline gap-3">
            <span class="font-heading text-3xl font-extrabold text-emerald-700">
              {{ formatVnd(product.price) }}
            </span>
            <span v-if="product.originalPrice" class="text-sm text-slate-400 line-through">
              {{ formatVnd(product.originalPrice) }}
            </span>
          </div>

          <p class="text-sm text-slate-600 leading-relaxed mt-4">
            {{ product.description }}
          </p>

          <!-- Nutrition Facts Summary -->
          <div class="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 class="font-heading text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Chỉ Số Dinh Dưỡng Chuẩn ({{ product.nutrition.servingSize }})
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="p-2.5 rounded-xl bg-white border border-slate-200">
                <span class="text-[11px] text-slate-500 block">Calo</span>
                <strong class="text-amber-600 text-sm font-bold">{{ product.nutrition.calories }} kcal</strong>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-slate-200">
                <span class="text-[11px] text-slate-500 block">Protein</span>
                <strong class="text-emerald-700 text-sm font-bold">{{ product.nutrition.protein }}g</strong>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-slate-200">
                <span class="text-[11px] text-slate-500 block">Carbs</span>
                <strong class="text-slate-800 text-sm font-bold">{{ product.nutrition.carbs }}g</strong>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-slate-200">
                <span class="text-[11px] text-slate-500 block">Đường</span>
                <strong class="text-rose-600 text-sm font-bold">{{ product.nutrition.sugar }}g</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Add to cart bar -->
        <div class="pt-4 border-t border-slate-200 flex items-center gap-4">
          <button
            type="button"
            @click="handleAddToCart"
            class="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20"
          >
            <ShoppingBag class="w-5 h-5" />
            <span>Thêm Vào Giỏ Hàng</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
