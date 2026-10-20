<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
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
  CheckCircle2,
  Plus,
  Minus,
  Check,
} from 'lucide-vue-next';

const productStore = useProductStore();
const cartStore = useCartStore();

const quantity = ref(1);
const selectedPortion = ref<string>('Khẩu phần chuẩn');

watch(
  () => productStore.selectedProduct,
  (prod) => {
    if (prod) {
      quantity.value = 1;
      if (prod.portions && prod.portions.length > 0) {
        selectedPortion.value = prod.portions[0].label;
      } else {
        selectedPortion.value = prod.nutrition.servingSize || 'Khẩu phần chuẩn';
      }
    }
  },
  { immediate: true }
);

const currentPrice = computed(() => {
  const prod = productStore.selectedProduct;
  if (!prod) return 0;
  if (prod.portions && prod.portions.length > 0) {
    const found = prod.portions.find((p) => p.label === selectedPortion.value);
    if (found) return found.price;
  }
  return prod.price;
});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function closeModal() {
  productStore.clearSelectedProduct();
  quantity.value = 1;
}

function handleAddToCart() {
  if (productStore.selectedProduct) {
    cartStore.addItem(
      {
        ...productStore.selectedProduct,
        price: currentPrice.value,
      },
      quantity.value,
      selectedPortion.value
    );
    closeModal();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && productStore.selectedProduct) {
    closeModal();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    v-if="productStore.selectedProduct"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    @click.self="closeModal"
    role="dialog"
    aria-modal="true"
    :aria-label="productStore.selectedProduct.name"
  >
    <div
      class="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click="closeModal"
        class="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] shadow-xs cursor-pointer"
        aria-label="Đóng cửa sổ"
      >
        <X class="w-5 h-5" />
      </button>

      <div class="grid grid-cols-1 md:grid-cols-2">
        <!-- Image & Gallery Area -->
        <div class="relative bg-[#FAF9F5] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E3E8DC]">
          <div class="aspect-square w-full rounded-2xl overflow-hidden shadow-xs border border-[#E8ECE2]">
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
              class="px-3 py-1 rounded-full text-xs font-bold bg-[#EBF7E5] text-[#4D6A34] border border-[#CCD7BC]"
            >
              {{ b }}
            </span>
          </div>
        </div>

        <!-- Details & Nutrition Facts -->
        <div class="p-6 sm:p-8 flex flex-col max-h-[85vh] overflow-y-auto space-y-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-[#4D6A34] uppercase tracking-wider mb-1">
              <span>{{ productStore.selectedProduct.categoryName }}</span>
              <span>•</span>
              <span class="font-mono text-slate-400">{{ productStore.selectedProduct.code }}</span>
            </div>
            <h2 class="font-heading text-xl sm:text-2xl font-black text-[#242424] leading-snug">
              {{ productStore.selectedProduct.name }}
            </h2>
            <div class="flex items-baseline gap-3 mt-2">
              <span class="font-heading text-2xl font-black text-[#4D6A34]">
                {{ formatVnd(currentPrice) }}
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
          <p class="text-sm text-[#576449] leading-relaxed">
            {{ productStore.selectedProduct.description }}
          </p>

          <!-- Portion Selector (CN_17 / CN_18) -->
          <div v-if="productStore.selectedProduct.portions && productStore.selectedProduct.portions.length > 0" class="space-y-2">
            <span class="text-xs font-bold text-[#242424] block uppercase">Chọn phân loại khẩu phần:</span>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="p in productStore.selectedProduct.portions"
                :key="p.label"
                type="button"
                @click="selectedPortion = p.label"
                class="p-2.5 rounded-xl border text-left transition-all relative cursor-pointer"
                :class="
                  selectedPortion === p.label
                    ? 'border-2 border-[#4D6A34] bg-[#EBF7E5] text-[#242424] font-bold shadow-2xs'
                    : 'border-[#E3E8DC] bg-white text-[#576449] hover:border-[#CCD7BC]'
                "
              >
                <div v-if="selectedPortion === p.label" class="absolute top-1.5 right-1.5 text-[#4D6A34]">
                  <Check class="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div class="text-xs font-bold leading-tight">{{ p.label }}</div>
                <div class="text-[11px] font-semibold text-[#4D6A34] mt-0.5">{{ formatVnd(p.price) }}</div>
              </button>
            </div>
          </div>

          <!-- Best For Callout -->
          <div class="p-3.5 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4] text-xs text-[#3B4E24] flex items-start gap-2.5">
            <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0 mt-0.5" />
            <div>
              <strong class="font-semibold block mb-0.5">Khuyên dùng cho:</strong>
              <span>{{ productStore.selectedProduct.bestFor }}</span>
            </div>
          </div>

          <!-- NUTRITION FACTS CARD (Clinical Standard) -->
          <div class="rounded-2xl border-2 border-[#242424] p-4 bg-white shadow-2xs">
            <div class="border-b-4 border-[#242424] pb-1 mb-2">
              <h3 class="font-heading text-base font-black tracking-tight text-[#242424] uppercase">
                Nutrition Facts
              </h3>
              <p class="text-[11px] text-[#7A866E] font-medium">
                Khẩu phần tiêu chuẩn: <strong>{{ productStore.selectedProduct.nutrition.servingSize }}</strong>
              </p>
            </div>

            <!-- Calories Big Row -->
            <div class="flex items-baseline justify-between border-b-2 border-[#242424] py-1.5 mb-2">
              <div class="flex items-center gap-1.5 font-bold text-[#242424]">
                <Flame class="w-4 h-4 text-amber-500" />
                <span>Năng lượng (Calories)</span>
              </div>
              <span class="font-heading text-lg font-black text-[#242424]">
                {{ productStore.selectedProduct.nutrition.calories }} kcal
              </span>
            </div>

            <!-- Detailed Grid -->
            <div class="space-y-1 text-xs text-[#4E5C3E]">
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="flex items-center gap-1.5 font-medium">
                  <Dumbbell class="w-3.5 h-3.5 text-[#4D6A34]" />
                  <strong>Chất đạm (Protein)</strong>
                </span>
                <span class="font-bold text-[#4D6A34]">{{ productStore.selectedProduct.nutrition.protein }}g</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="flex items-center gap-1.5 font-medium">
                  <Wheat class="w-3.5 h-3.5 text-amber-600" />
                  <span>Tinh bột (Carbs)</span>
                </span>
                <span class="font-semibold">{{ productStore.selectedProduct.nutrition.carbs }}g</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100 pl-4 text-slate-500">
                <span class="flex items-center gap-1.5">
                  <CandyOff class="w-3.5 h-3.5 text-rose-500" />
                  <span>Đường (Sugar)</span>
                </span>
                <span>{{ productStore.selectedProduct.nutrition.sugar }}g</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="flex items-center gap-1.5 font-medium">
                  <Droplet class="w-3.5 h-3.5 text-sky-600" />
                  <span>Chất béo (Fat)</span>
                </span>
                <span class="font-semibold">{{ productStore.selectedProduct.nutrition.fat }}g</span>
              </div>
            </div>
          </div>

          <!-- Quantity Selector & Add to Cart -->
          <div class="pt-4 border-t border-[#E3E8DC] flex items-center gap-3">
            <!-- Quantity Counter -->
            <div class="flex items-center border border-[#CCD7BC] rounded-2xl p-1 bg-white shadow-2xs">
              <button
                type="button"
                @click="quantity = Math.max(1, quantity - 1)"
                class="w-8 h-8 rounded-xl flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5] min-h-[44px] min-w-[44px] cursor-pointer"
                aria-label="Giảm số lượng"
              >
                <Minus class="w-4 h-4" />
              </button>
              <span class="w-8 text-center text-sm font-black text-[#242424]">{{ quantity }}</span>
              <button
                type="button"
                @click="quantity++"
                class="w-8 h-8 rounded-xl flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5] min-h-[44px] min-w-[44px] cursor-pointer"
                aria-label="Tăng số lượng"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>

            <!-- Submit Button -->
            <button
              type="button"
              @click="handleAddToCart"
              class="flex-1 px-5 py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all min-h-[44px] cursor-pointer"
            >
              <ShoppingBag class="w-5 h-5" />
              <span>Thêm vào giỏ • {{ formatVnd(currentPrice * quantity) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
