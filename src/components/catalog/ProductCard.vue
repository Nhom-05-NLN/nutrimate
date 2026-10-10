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
      <div class="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
        <span
          v-for="badge in product.badges.slice(0, 2)"
          :key="badge"
          class="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF9F5]/95 backdrop-blur-xs text-[#242424] border border-[#CCD7BC] shadow-2xs"
        >
          {{ badge }}
        </span>
      </div>

      <!-- Favorite Button -->
      <button
        type="button"
        @click.stop="toggleLike"
        class="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white/95 backdrop-blur-xs border border-[#CCD7BC] text-[#7A866E] hover:text-rose-500 flex items-center justify-center shadow-xs transition-colors z-10"
        :class="{ 'text-rose-500 fill-rose-500': isLiked }"
        aria-label="Yêu thích sản phẩm"
      >
        <Heart class="w-4.5 h-4.5" :class="{ 'fill-rose-500': isLiked }" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
      <!-- Category & Rating -->
      <div class="flex items-center justify-between text-xs font-semibold text-[#576449]">
        <span>{{ product.categoryName }} • {{ product.nutrition.servingSize }}</span>
        <div class="flex items-center gap-1 font-bold text-[#242424]">
          <Star class="w-4 h-4 fill-[#E8A020] text-[#E8A020]" />
          <span>{{ product.rating }}</span>
          <span class="text-[#7A866E] font-medium text-xs">({{ product.reviewCount }})</span>
        </div>
      </div>

      <!-- Name (To rõ dễ đọc) -->
      <h3
        @click="goToDetail"
        class="font-heading text-base font-bold text-[#242424] hover:text-[#4D6A34] transition-colors cursor-pointer line-clamp-2 leading-snug"
      >
        {{ product.name }}
      </h3>

      <!-- Macro 3 Columns (Cân đối dễ nhìn) -->
      <div class="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#F6F8F3] border border-[#E8ECE2] text-center">
        <div>
          <span class="text-[10px] text-[#7A866E] uppercase block font-medium">Năng lượng</span>
          <span class="text-sm font-bold text-[#242424]">{{ product.nutrition.calories }} kcal</span>
        </div>
        <div>
          <span class="text-[10px] text-[#7A866E] uppercase block font-medium">Protein</span>
          <span class="text-sm font-bold text-[#4D6A34]">{{ product.nutrition.protein }}g</span>
        </div>
        <div>
          <span class="text-[10px] text-[#7A866E] uppercase block font-medium">Đường</span>
          <span class="text-sm font-bold text-[#242424]">{{ product.nutrition.sugar }}g</span>
        </div>
      </div>

      <!-- Price & Add to Cart -->
      <div class="pt-3 flex items-center justify-between border-t border-[#F0F3EC]">
        <div>
          <span class="font-heading text-lg font-black text-[#242424]">
            {{ formatVnd(product.price) }}
          </span>
        </div>

        <button
          type="button"
          @click="cartStore.addItem(product, 1)"
          class="w-11 h-11 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
          title="Thêm vào giỏ"
          aria-label="Thêm vào giỏ"
        >
          <ShoppingBag class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
