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
  <div class="w-full flex flex-col">
    <!-- Section 1: Hero Section (bg-linear from #EDEDE1 to #DFE3CE) -->
    <HeroSection />

    <!-- Section 2: Danh Mục Chuyên Biệt (bg #F7F3E8) -->
    <DietCategories />

    <!-- Section 3: Thực Phẩm Bán Chạy Nhất (bg #C0C59F) -->
    <FeaturedProducts />

    <!-- Section 4: Tiêu Chuẩn NutriMate (bg #F7F3E8) -->
    <WhyChooseUs />

    <!-- Section 5: Chuyên Gia Dinh Dưỡng AI (bg #C0C59F with container #F7FBF4) -->
    <AiAssistantFeature />

    <!-- Section 6: Cộng Đồng NutriMate (bg #F7F3E8) -->
    <TestimonialsSection />
  </div>
</template>
