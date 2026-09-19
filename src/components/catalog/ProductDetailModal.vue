<script setup lang="ts">
import { ref } from 'vue';
import { useProductStore } from '../../stores/productStore';
import { useCartStore } from '../../stores/cartStore';
import {
  X,
  ShoppingBag,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  CandyOff,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Minus,
} from 'lucide-vue-next';

const productStore = useProductStore();
const cartStore = useCartStore();

const quantity = ref(1);

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleAddToCart() {
  if (productStore.selectedProduct) {
    cartStore.addItem(productStore.selectedProduct, quantity.value);
    productStore.clearSelectedProduct();
    quantity.value = 1;
  }
}
</script>

<template>
  <div
    v-if="productStore.selectedProduct"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    @click.self="productStore.clearSelectedProduct()"
  >
    <div
      class="relative w-full max-w-3xl bg-white rounded-4xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      role="dialog"
      aria-modal="true"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click="productStore.clearSelectedProduct()"
        class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
        aria-label="Đóng cửa sổ"
      >
        <X class="w-5 h-5" />
      </button>

      <div class="grid grid-cols-1 md:grid-cols-2">
        <!-- Image & Gallery Area -->
        <div class="relative bg-slate-100 p-6 flex flex-col justify-between">
          <div class="aspect-square w-full rounded-2xl overflow-hidden shadow-xs">
            <img
              :src="productStore.selectedProduct.image"
              :alt="productStore.selectedProduct.name"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Badges & Highlights -->
          <div class="mt-4 flex flex-wrap gap-1.5">
            <span
              v-for="b in productStore.selectedProduct.badges"
              :key="b"
              class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900"
            >
              {{ b }}
            </span>
          </div>
        </div>

        <!-- Details & Nutrition Facts -->
        <div class="p-6 sm:p-8 flex flex-col max-h-[80vh] overflow-y-auto">
          <div class="mb-4">
            <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
              <span>{{ productStore.selectedProduct.categoryName }}</span>
              <span>•</span>
              <span class="font-mono text-slate-400">{{ productStore.selectedProduct.code }}</span>
            </div>
            <h2 class="font-heading text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {{ productStore.selectedProduct.name }}
            </h2>
            <div class="flex items-baseline gap-3 mt-2">
              <span class="font-heading text-2xl font-bold text-emerald-700">
                {{ formatVnd(productStore.selectedProduct.price) }}
              </span>
              <span
                v-if="productStore.selectedProduct.originalPrice"
                class="text-sm text-slate-400 line-through"
              >
                {{ formatVnd(productStore.selectedProduct.originalPrice) }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <p class="text-sm text-slate-600 leading-relaxed mb-5">
            {{ productStore.selectedProduct.description }}
          </p>

          <!-- Best For Callout -->
          <div class="mb-6 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong class="font-semibold block mb-0.5">Khuyên dùng cho:</strong>
              <span>{{ productStore.selectedProduct.bestFor }}</span>
            </div>
          </div>

          <!-- NUTRITION FACTS CARD (Clinical Standard) -->
          <div class="mb-6 rounded-2xl border-2 border-slate-900 p-4 bg-slate-50/50">
            <div class="border-b-4 border-slate-900 pb-1 mb-2">
              <h3 class="font-heading text-lg font-black tracking-tight text-slate-900 uppercase">
                Nutrition Facts
              </h3>
              <p class="text-[11px] text-slate-500 font-medium">
                Khẩu phần tiêu chuẩn: <strong>{{ productStore.selectedProduct.nutrition.servingSize }}</strong>
              </p>
            </div>

            <!-- Calories Big Row -->
            <div class="flex items-baseline justify-between border-b-2 border-slate-900 py-1.5 mb-2">
              <div class="flex items-center gap-1.5 font-bold text-slate-900">
                <Flame class="w-4 h-4 text-amber-500" />
                <span>Năng lượng (Calories)</span>
              </div>
              <span class="font-heading text-xl font-extrabold text-slate-900">
                {{ productStore.selectedProduct.nutrition.calories }} kcal
              </span>
            </div>

            <!-- Detailed Grid -->
            <div class="space-y-1.5 text-xs text-slate-700">
              <div class="flex justify-between py-1 border-b border-slate-200">
                <span class="flex items-center gap-1.5 font-medium">
                  <Dumbbell class="w-3.5 h-3.5 text-emerald-600" />
                  <strong>Chất đạm (Protein)</strong>
                </span>
                <span class="font-bold text-emerald-800">{{ productStore.selectedProduct.nutrition.protein }}g</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-200">
                <span class="flex items-center gap-1.5 font-medium">
                  <Wheat class="w-3.5 h-3.5 text-amber-600" />
                  <span>Tinh bột (Carbohydrates)</span>
                </span>
                <span class="font-semibold">{{ productStore.selectedProduct.nutrition.carbs }}g</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-200 pl-4 text-slate-500">
                <span class="flex items-center gap-1.5">
                  <CandyOff class="w-3.5 h-3.5 text-rose-500" />
                  <span>Đường (Sugar)</span>
                </span>
                <span>{{ productStore.selectedProduct.nutrition.sugar }}g</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-200">
                <span class="flex items-center gap-1.5 font-medium">
                  <Droplet class="w-3.5 h-3.5 text-sky-600" />
                  <span>Chất béo (Fat)</span>
                </span>
                <span class="font-semibold">{{ productStore.selectedProduct.nutrition.fat }}g</span>
              </div>
              <div v-if="productStore.selectedProduct.nutrition.fiber" class="flex justify-between py-1 border-b border-slate-200">
                <span>Chất xơ (Dietary Fiber)</span>
                <span class="font-semibold">{{ productStore.selectedProduct.nutrition.fiber }}g</span>
              </div>
              <div v-if="productStore.selectedProduct.nutrition.sodium" class="flex justify-between py-1">
                <span>Natri (Sodium)</span>
                <span class="font-semibold">{{ productStore.selectedProduct.nutrition.sodium }}mg</span>
              </div>
            </div>
          </div>

          <!-- Ingredients List -->
          <div v-if="productStore.selectedProduct.ingredients && productStore.selectedProduct.ingredients.length" class="mb-6 text-xs text-slate-600">
            <strong class="text-slate-900 block mb-1.5 font-semibold">Thành phần tự nhiên:</strong>
            <p class="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              {{ productStore.selectedProduct.ingredients.join(', ') }}
            </p>
          </div>

          <!-- Quantity Selector & Add to Cart -->
          <div class="mt-auto pt-4 border-t border-slate-200 flex items-center gap-4">
            <!-- Quantity Counter -->
            <div class="flex items-center border border-slate-300 rounded-2xl p-1 bg-white">
              <button
                type="button"
                @click="quantity = Math.max(1, quantity - 1)"
                class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px]"
                aria-label="Giảm số lượng"
              >
                <Minus class="w-4 h-4" />
              </button>
              <span class="w-8 text-center text-sm font-bold text-slate-900">{{ quantity }}</span>
              <button
                type="button"
                @click="quantity++"
                class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px]"
                aria-label="Tăng số lượng"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="handleAddToCart"
              class="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/25 transition-all min-h-[44px]"
            >
              <ShoppingBag class="w-5 h-5" />
              <span>Thêm vào giỏ • {{ formatVnd(productStore.selectedProduct.price * quantity) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
