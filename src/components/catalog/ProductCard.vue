<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Product } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useToastStore } from '../../stores/toastStore';
import { ShoppingBag, Heart, Star } from 'lucide-vue-next';

const props = defineProps<{
  product: Product;
}>();

const router = useRouter();
const cartStore = useCartStore();
const toastStore = useToastStore();
const isLiked = ref(false);

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Kiểm tra tình trạng tồn kho
const isInStock = computed(() => (props.product.stock ?? 0) > 0);

function toggleLike() {
  isLiked.value = !isLiked.value;
  if (isLiked.value) {
    toastStore.show('Đã lưu vào danh sách yêu thích', 'success', props.product.name);
  }
}

function handleAddToCart() {
  if (!isInStock.value) return;
  cartStore.addItem(props.product, 1);
  toastStore.show('Đã thêm vào giỏ hàng', 'success', props.product.name);
}

function goToDetail() {
  router.push(`/product/${props.product.id}`);
}
</script>

<template>
  <div
    class="group relative flex flex-col bg-white rounded-xl border border-[#E3E8DC] hover:border-[#4D6A34] hover:shadow-xl transition-all duration-200 overflow-hidden"
    :class="{ 'opacity-85': !isInStock }"
  >
    <!-- Product Image -->
    <div class="relative aspect-4/3 w-full bg-[#FAF9F5] overflow-hidden cursor-pointer" @click="goToDetail">
      <img
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        :class="{ 'grayscale-25': !isInStock }"
      />

      <!-- <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <span
          v-if="!isInStock"
          class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-xs flex items-center gap-1"
        >
          <AlertCircle class="w-3 h-3" />
          Hết hàng
        </span>
        <span
          v-else-if="isLowStock"
          class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs"
        >
          Chỉ còn {{ product.stock }}
        </span>
        <span
          v-for="badge in product?.badges.slice(0, 2)"
          :key="badge"
          class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF9F5]/95 backdrop-blur-xs text-[#242424] border border-[#CCD7BC] shadow-2xs"
        >
          {{ badge }}
        </span>
      </div> -->

      <!-- Favorite Button -->
      <button
        type="button"
        @click.stop="toggleLike"
        class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs border border-[#CCD7BC] text-[#7A866E] hover:text-rose-500 flex items-center justify-center shadow-xs transition-colors z-10 cursor-pointer"
        :class="{ 'text-rose-500 fill-rose-500': isLiked }"
        aria-label="Yêu thích sản phẩm"
      >
        <Heart class="w-4 h-4" :class="{ 'fill-rose-500 text-rose-500': isLiked }" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-5 flex-1 flex flex-col justify-between space-y-3.5">
      <!-- Category & Rating -->
      <div class="flex items-center justify-between text-xs text-[#576449]">
        <span class="text-[11px] font-semibold truncate max-w-[150px]" :title="product.categoryName">
          {{ product.categoryName }}
        </span>
        <div class="flex items-center gap-1 font-bold text-[#2D3B1E] shrink-0">
          <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{{ product.rating ?? 5.0 }}</span>
          <span class="text-[#7A866E] font-medium text-[11px]">({{ product.reviewCount ?? 0 }})</span>
        </div>
      </div>

      <!-- Name -->
      <h3
        @click="goToDetail"
        class="font-heading text-base font-bold text-[#242424] hover:text-[#4D6A34] transition-colors cursor-pointer line-clamp-2 leading-snug"
        :title="product.name"
        >
        {{ product.name }}
      </h3>

      <!-- 4 Trụ Cột Dinh Dưỡng -->
      <div class="grid grid-cols-4 gap-1 p-2 rounded-[8px] bg-[#F6F8F3] border border-[#E3E8DC] text-center">
        <!-- 1. Calories -->
        <div class="px-1">
          <span class="text-[10px] text-[#7A866E] uppercase block font-semibold">Calo</span>
          <span class="text-sm font-extrabold text-[#2D3B1E]">{{ product.nutrition?.calories ?? 0 }}</span>
        </div>
        <!-- 2. Protein -->
        <div class="px-1 border-l border-[#E3E8DC]">
          <span class="text-[10px] text-[#7A866E] uppercase block font-semibold">Đạm</span>
          <span class="text-sm font-extrabold text-[#4D6A34]">{{ product.nutrition?.protein ?? 0 }}g</span>
        </div>
        <!-- 3. Carbs (Mới thêm chuẩn Class Diagram) -->
        <div class="px-1 border-l border-[#E3E8DC]">
          <span class="text-[10px] text-[#7A866E] uppercase block font-semibold">Carb</span>
          <span class="text-sm font-extrabold text-[#2D3B1E]">{{ product.nutrition?.carbs ?? 0 }}g</span>
        </div>
        <!-- 4. Sugar -->
        <div class="px-1 border-l border-[#E3E8DC]">
          <span class="text-[10px] text-[#7A866E] uppercase block font-semibold">Đường</span>
          <span class="text-sm font-extrabold text-[#2D3B1E]">{{ product.nutrition?.sugar ?? 0 }}g</span>
        </div>
      </div>

      <!-- Price & Add to Cart -->
      <div class="pt-2.5 flex items-center justify-between border-t border-[#F0F3EC]">
        <div>
          <span class="font-heading text-base sm:text-lg font-black text-[#242424]">
            {{ formatVnd(product.price) }}
          </span>
        </div>

        <button
          type="button"
          :disabled="!isInStock"
          @click.stop="handleAddToCart"
          class="w-10 h-10 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          :title="!isInStock ? 'Sản phẩm tạm hết hàng' : 'Thêm vào giỏ'"
          :aria-label="!isInStock ? 'Sản phẩm tạm hết hàng' : 'Thêm vào giỏ'"
        >
          <ShoppingBag class="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  </div>
</template>
