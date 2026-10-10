<script setup lang="ts">
import { ref } from 'vue';
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

function toggleLike() {
  isLiked.value = !isLiked.value;
  if (isLiked.value) {
    toastStore.show('Đã lưu vào danh sách yêu thích', 'success', props.product.name);
  }
}

function goToDetail() {
  router.push(`/product/${props.product.id}`);
}
</script>

<template>
  <div
    class="group relative flex flex-col bg-white rounded-3xl border border-[#E3E8DC] hover:border-[#4D6A34] hover:shadow-xl transition-all duration-200 overflow-hidden"
  >
    <!-- Product Image & Badges -->
    <div class="relative aspect-4/3 w-full bg-[#FAF9F5] overflow-hidden cursor-pointer" @click="goToDetail">
      <img
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <!-- Badges Stack -->
      <div class="absolute top-3 left-3 flex flex-col gap-1 z-10">
        <span
          v-for="badge in product.badges.slice(0, 2)"
          :key="badge"
          class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF9F5]/90 backdrop-blur-xs text-[#2D3B1E] border border-[#CCD7BC] shadow-2xs"
        >
          {{ badge }}
        </span>
      </div>

      <!-- Favorite Button -->
      <button
        type="button"
        @click.stop="toggleLike"
        class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[#CCD7BC] text-[#7A866E] hover:text-rose-500 flex items-center justify-center transition-colors z-10"
        :class="{ 'text-rose-500 fill-rose-500': isLiked }"
        aria-label="Yêu thích sản phẩm"
      >
        <Heart class="w-4 h-4" :class="{ 'fill-rose-500': isLiked }" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
      <!-- Category & Rating -->
      <div class="flex items-center justify-between text-xs text-[#7A866E]">
        <span>{{ product.categoryName }} • {{ product.nutrition.servingSize }}</span>
        <div class="flex items-center gap-1 font-bold text-[#2D3B1E]">
          <Star class="w-3.5 h-3.5 fill-[#E8A020] text-[#E8A020]" />
          <span>{{ product.rating }}</span>
          <span class="text-[#8C9484] text-[11px]">({{ product.reviewCount }})</span>
        </div>
      </div>

      <!-- Name -->
      <h3
        @click="goToDetail"
        class="font-heading text-sm font-bold text-[#2D3B1E] hover:text-[#4D6A34] transition-colors cursor-pointer line-clamp-2 leading-snug"
      >
        {{ product.name }}
      </h3>

      <!-- Macro 3 Columns -->
      <div class="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-[#F6F8F3] border border-[#E8ECE2] text-center">
        <div>
          <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Năng lượng</span>
          <span class="text-xs font-bold text-[#2D3B1E]">{{ product.nutrition.calories }} kcal</span>
        </div>
        <div>
          <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Protein</span>
          <span class="text-xs font-bold text-[#4D6A34]">{{ product.nutrition.protein }}g</span>
        </div>
        <div>
          <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Đường</span>
          <span class="text-xs font-bold text-[#2D3B1E]">{{ product.nutrition.sugar }}g</span>
        </div>
      </div>

      <!-- Price & Add to Cart -->
      <div class="pt-2 flex items-center justify-between border-t border-[#F0F3EC]">
        <div>
          <span class="font-heading text-base font-extrabold text-[#2D3B1E]">
            {{ formatVnd(product.price) }}
          </span>
        </div>

        <button
          type="button"
          @click="cartStore.addItem(product, 1)"
          class="w-10 h-10 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white flex items-center justify-center transition-all shadow-xs"
          title="Thêm vào giỏ"
          aria-label="Thêm vào giỏ"
        >
          <ShoppingBag class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
