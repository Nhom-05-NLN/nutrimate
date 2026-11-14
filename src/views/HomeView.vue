<script setup lang="ts">
import HeroSection from '../components/home/HeroSection.vue';
import DietCategories from '../components/home/DietCategories.vue';
import FeaturedProducts from '../components/home/FeaturedProducts.vue';
import WhyChooseUs from '../components/home/WhyChooseUs.vue';
import AiAssistantFeature from '../components/home/AiAssistantFeature.vue';
import TestimonialsSection from '../components/home/TestimonialsSection.vue';
</script>

<template>
  <main class="home-page w-full flex flex-col">
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
  </main>
</template>

<style scoped>
.home-page :deep(button:not(:disabled)),
.home-page :deep(a) {
  transition:
    transform 180ms ease,
    filter 180ms ease,
    box-shadow 180ms ease;
}

.home-page :deep(button:not(:disabled):hover),
.home-page :deep(a:hover) {
  transform: translateY(-4px) scale(1.04);
  filter: brightness(1.08);
  box-shadow: 0 10px 22px rgb(45 59 30 / 24%);
}

@media (prefers-reduced-motion: reduce) {
  .home-page :deep(button),
  .home-page :deep(a) {
    transition: none;
  }
}
</style>
