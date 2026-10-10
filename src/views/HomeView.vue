<script setup lang="ts">
import { onMounted } from 'vue';
import { useProductStore } from '../stores/productStore';
import HeroSection from '../components/home/HeroSection.vue';
import DietCategories from '../components/home/DietCategories.vue';
import FeaturedProducts from '../components/home/FeaturedProducts.vue';
import WhyChooseUs from '../components/home/WhyChooseUs.vue';
import AiAssistantFeature from '../components/home/AiAssistantFeature.vue';
import TestimonialsSection from '../components/home/TestimonialsSection.vue';

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
  <div class="space-y-6">
    <HeroSection />
    <DietCategories />
    <FeaturedProducts />
    <WhyChooseUs />
    <AiAssistantFeature />
    <TestimonialsSection />
  </div>
</template>
