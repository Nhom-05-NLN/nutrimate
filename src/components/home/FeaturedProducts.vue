<script setup lang="ts">
import { computed } from 'vue';
import { useProductStore } from '../../stores/productStore';
import ProductCard from '../catalog/ProductCard.vue';
import { ArrowRight, Sparkles } from 'lucide-vue-next';

const productStore = useProductStore();

const featuredList = computed(() => {
  const list = productStore.products.filter((p) => p.isFeatured);
  return list.length > 0 ? list.slice(0, 6) : productStore.products.slice(0, 6);
});
</script>

<template>
  <section class="py-10">
    <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
          <Sparkles class="w-4 h-4" />
          <span>Thực Đơn Được Yêu Thích</span>
        </div>
        <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          Sản Phẩm Ăn Kiêng Nổi Bật
        </h2>
      </div>

      <RouterLink
        to="/catalog"
        class="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
      >
        <span>Xem tất cả sản phẩm</span>
        <ArrowRight class="w-4 h-4" />
      </RouterLink>
    </div>

    <!-- Product Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProductCard
        v-for="prod in featuredList"
        :key="prod.id"
        :product="prod"
      />
    </div>
  </section>
</template>
