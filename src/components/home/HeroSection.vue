<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useChatStore } from '../../stores/chatStore';
import { fetchProducts } from '../../services/api';
import type { Product } from '../../types';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Bot,
  Star,
} from 'lucide-vue-next';

const chatStore = useChatStore();
const featuredProducts = ref<Product[]>([]);
const isLoading = ref(true);
const loadError = ref('');
const activeSlide = ref(0);
let slideTimer: number | null = null;
const currentProduct = computed(() => featuredProducts.value[activeSlide.value] ?? null);

function showSlide(index: number) {
  const slideCount = featuredProducts.value.length;
  if (!slideCount) return;
  activeSlide.value = (index + slideCount) % slideCount;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function startSlideShow() {
  if (
    featuredProducts.value.length < 2 ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) return;
  slideTimer = window.setInterval(() => {
    showSlide(activeSlide.value + 1);
  }, 5000);
}

onMounted(async () => {
  try {
    const result = await fetchProducts({ sort: 'sold_desc', limit: 5 });
    featuredProducts.value = result.products.filter((product) => product.image.trim());
    startSlideShow();
  } catch (error: unknown) {
    loadError.value = error instanceof Error
      ? error.message
      : 'Không thể tải sản phẩm nổi bật.';
    console.error('[HeroSection] Không thể tải sản phẩm nổi bật:', error);
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  if (slideTimer !== null) window.clearInterval(slideTimer);
});
</script>

<template>
  <section class="w-full border-b border-[#D5DFC8] bg-linear-to-b from-[#EDEDE1] to-[#DFE3CE] py-8 lg:flex lg:min-h-[calc(100svh-82px)] lg:items-center lg:py-6">
    <div class="relative mx-auto w-full max-w-[1316px] px-4 sm:px-8">
      <div class="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-10">
        <!-- Cột Trái: Thông điệp & CTA -->
        <div class="space-y-4 lg:col-span-7 lg:space-y-5">
          <!-- Badge Topic -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF7E5] border border-[#CCD7BC] text-[#3B4E24] text-xs font-bold">
            <Sparkles class="w-3.5 h-3.5 text-[#6B7A3A]" />
            <span>Dinh dưỡng chuẩn hóa & Công nghệ AI thông minh</span>
          </div>

          <!-- Headline -->
          <h1 class="font-heading text-3xl sm:text-5xl lg:text-[48px] font-black tracking-tight text-[#242424] leading-[1.12]">
            Ăn lành mạnh hơn, sống khỏe hơn cùng <span class="text-[#6B7A3A]">NutriMate</span>
          </h1>

          <!-- Subtitle -->
          <p class="max-w-xl text-sm leading-relaxed text-[#576449] sm:text-base">
            Khám phá thực phẩm ăn kiêng chất lượng cao, tính toán dinh dưỡng tự động và nhận thực đơn cá nhân hóa từ trợ lý ảo NutriBot.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center">
            <RouterLink
              to="/catalog"
              class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#6B7A3A] hover:bg-[#536124] text-white font-bold text-sm shadow-md transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EA675] focus-visible:ring-offset-2"
            >
              <span>Khám phá sản phẩm</span>
              <ArrowRight class="w-4 h-4" />
            </RouterLink>

            <button
              type="button"
              @click="chatStore.openChat()"
              class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FAF9F5] hover:border-[#AAB793] hover:shadow-md text-[#242424] font-bold text-sm border border-[#D0D3BE] shadow-2xs transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EA675] focus-visible:ring-offset-2"
            >
              <Bot class="w-4 h-4 text-[#6B7A3A]" />
              <span>Hỏi NutriBot AI</span>
            </button>
          </div>

          <div v-if="featuredProducts.length" class="flex items-center gap-2 pt-1 text-sm font-semibold text-[#576449]">
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[#6B7A3A]">
              <Sparkles class="h-4 w-4" />
            </span>
            {{ featuredProducts.length }} sản phẩm nổi bật từ cửa hàng
          </div>
        </div>

        <!-- Cột Phải: Sản phẩm nổi bật từ cửa hàng -->
        <div class="lg:col-span-5 relative">
          <div
            class="hero-product-card relative h-[360px] overflow-hidden rounded-[2rem] border border-white/70 bg-[#DCE4D2] shadow-2xl sm:h-[420px] lg:h-[clamp(360px,calc(100svh-230px),500px)]"
            role="region"
            aria-roledescription="carousel"
            aria-label="Sản phẩm nổi bật"
          >
            <Transition v-if="currentProduct" name="hero-slide">
              <img
                :key="currentProduct.id"
                :src="currentProduct.image"
                :alt="currentProduct.name"
                class="hero-photo-drift absolute inset-0 h-full w-full object-cover"
              />
            </Transition>
            <div v-if="currentProduct" class="absolute inset-0 bg-linear-to-t from-[#10190F]/95 via-[#172013]/30 to-transparent"></div>
            <div v-if="currentProduct" class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-[#C5E29B]/20"></div>

            <div v-if="currentProduct" class="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#26351E]/45 px-3.5 py-2 text-xs font-bold tracking-wide text-white shadow-lg backdrop-blur-md">
              <Sparkles class="h-3.5 w-3.5 text-[#D4F0A7]" />
              SẢN PHẨM NỔI BẬT
            </div>

            <div v-if="currentProduct && featuredProducts.length > 1" class="absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-2 backdrop-blur-md">
              <button
                v-for="(product, index) in featuredProducts"
                :key="product.id"
                type="button"
                :aria-label="`Hiển thị sản phẩm ${index + 1}: ${product.name}`"
                :aria-current="activeSlide === index ? 'true' : undefined"
                class="h-2.5 rounded-full bg-white/70 shadow transition-all duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                :class="activeSlide === index ? 'w-7 bg-white' : 'w-2.5'"
                @click="showSlide(index)"
              />
            </div>

            <button
              v-if="featuredProducts.length > 1"
              type="button"
              aria-label="Sản phẩm trước"
              class="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[#2D3B1E] shadow-lg backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7A3A]"
              @click="showSlide(activeSlide - 1)"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>
            <button
              v-if="featuredProducts.length > 1"
              type="button"
              aria-label="Sản phẩm tiếp theo"
              class="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[#2D3B1E] shadow-lg backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7A3A]"
              @click="showSlide(activeSlide + 1)"
            >
              <ChevronRight class="h-5 w-5" />
            </button>

            <div v-if="currentProduct" class="absolute inset-x-5 bottom-4 z-10 text-white sm:inset-x-7 sm:bottom-5">
              <Transition name="hero-copy" mode="out-in">
                <div :key="currentProduct.id" class="hero-product-copy">
                  <div class="mb-3 flex flex-wrap items-center gap-2">
                    <span class="inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                      <span class="h-2 w-2 shrink-0 rounded-full bg-[#C5E29B]"></span>
                      <span class="truncate">{{ currentProduct.categoryName || 'Sản phẩm nổi bật' }}</span>
                    </span>
                    <span v-if="currentProduct.stock > 0" class="rounded-full bg-[#D4F0A7] px-3 py-1.5 text-[11px] font-bold text-[#26351E]">
                      Còn hàng
                    </span>
                  </div>

                  <h2 class="line-clamp-2 font-heading text-2xl font-black leading-tight drop-shadow-lg sm:text-3xl">
                    {{ currentProduct.name }}
                  </h2>

                  <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                    <span class="font-heading text-lg font-extrabold text-[#D4F0A7]">{{ formatVnd(currentProduct.price) }}</span>
                    <span class="inline-flex items-center gap-1">
                      <Star class="h-3.5 w-3.5 fill-[#F6C85F] text-[#F6C85F]" />
                      {{ currentProduct.rating.toFixed(1) }} ({{ currentProduct.reviewCount }} đánh giá)
                    </span>
                  </div>

                  <div class="mt-4 grid grid-cols-3 gap-2 border-t border-white/25 pt-4">
                    <div class="rounded-2xl border border-white/20 bg-white/15 px-3 py-2.5 backdrop-blur-md">
                      <span class="block text-[10px] font-medium text-white/75">Năng lượng</span>
                      <span class="text-sm font-bold">{{ currentProduct.nutrition.calories }} kcal</span>
                    </div>
                    <div class="rounded-2xl border border-white/20 bg-white/15 px-3 py-2.5 backdrop-blur-md">
                      <span class="block text-[10px] font-medium text-white/75">Protein</span>
                      <span class="text-sm font-bold">{{ currentProduct.nutrition.protein }}g</span>
                    </div>
                    <div class="rounded-2xl border border-white/20 bg-white/15 px-3 py-2.5 backdrop-blur-md">
                      <span class="block text-[10px] font-medium text-white/75">Đường</span>
                      <span class="text-sm font-bold">{{ currentProduct.nutrition.sugar }}g</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
            <div
              v-if="!currentProduct"
              class="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-[#576449]"
              :role="loadError ? 'alert' : 'status'"
            >
              {{ loadError || (isLoading ? 'Đang tải sản phẩm nổi bật...' : 'Chưa có sản phẩm nổi bật để hiển thị.') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-product-card {
  isolation: isolate;
  animation: hero-card-enter 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.hero-photo-drift {
  animation: hero-photo-drift 6s ease-in-out infinite alternate;
}

.hero-product-copy {
  animation: hero-copy-enter 450ms ease-out both;
}

@keyframes hero-card-enter {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes hero-photo-drift {
  from {
    transform: scale(1.02);
  }
  to {
    transform: scale(1.1);
  }
}

@keyframes hero-copy-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-slide-enter-active,
.hero-slide-leave-active {
  transition: opacity 700ms ease, transform 1800ms ease;
}

.hero-slide-enter-from,
.hero-slide-leave-to {
  opacity: 0;
  transform: scale(1.04);
}

.hero-copy-enter-active,
.hero-copy-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.hero-copy-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.hero-copy-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .hero-slide-enter-active,
  .hero-slide-leave-active,
  .hero-copy-enter-active,
  .hero-copy-leave-active,
  .hero-product-card,
  .hero-photo-drift,
  .hero-product-copy {
    transition: none;
    animation: none;
  }
}
</style>
