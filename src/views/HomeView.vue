<script setup lang="ts">
import { onMounted } from 'vue';
import { useProductStore } from '../stores/productStore';
import HeroSection from '../components/home/HeroSection.vue';
import DietCategories from '../components/home/DietCategories.vue';
import FeaturedProducts from '../components/home/FeaturedProducts.vue';

const productStore = useProductStore();

onMounted(() => {
  if (productStore.products.length === 0) {
    productStore.loadProducts();
  }
  if (productStore.categories.length === 0) {
    productStore.loadCategories();
  }
});
</script>

<template>
  <div class="space-y-4">
    <HeroSection />
    <DietCategories />
    <FeaturedProducts />
  </div>
</template>
