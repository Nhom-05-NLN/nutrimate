<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';
import { fetchProducts } from '../../services/api';
import type { Product } from '../../types';
import { ShoppingBag, Sparkles, Star } from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();
const productsPerPage = 4;

const featuredList = ref<Product[]>([]);
const isLoading = ref(true);
const loadError = ref('');
const currentPage = ref(0);
const pageCount = computed(() => Math.ceil(featuredList.value.length / productsPerPage));
let autoRotateInterval: ReturnType<typeof setInterval> | undefined;
const visibleProducts = computed(() =>
  featuredList.value.slice(
    currentPage.value * productsPerPage,
    (currentPage.value + 1) * productsPerPage,
  ),
);

onMounted(async () => {
  try {
    const result = await fetchProducts({ sort: 'sold_desc', limit: 12 });
    featuredList.value = result.products;
    if (pageCount.value > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startAutoRotate();
    }
  } catch (error: unknown) {
    loadError.value = error instanceof Error ? error.message : 'Không thể tải sản phẩm bán chạy.';
    console.error('[FeaturedProducts] Không thể tải sản phẩm bán chạy:', error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(stopAutoRotate);

function startAutoRotate() {
  stopAutoRotate();
  if (pageCount.value < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  autoRotateInterval = setInterval(() => {
    currentPage.value = (currentPage.value + 1) % pageCount.value;
  }, 5000);
}

function stopAutoRotate() {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval);
    autoRotateInterval = undefined;
  }
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleAdd(prod: Product) {
  cartStore.addItem(prod, 1, prod.portions?.[0]?.label || prod.nutrition.servingSize || 'Mặc định');
}

function goToDetail(id: string) {
  router.push(`/product/${id}`);
}

function showProductsPage(page: number) {
  if (page < 0 || page >= pageCount.value || page === currentPage.value) return;
  currentPage.value = page;
}
</script>

<template>
  <section class="w-full bg-[#C0C59F] py-10 sm:py-12">
    <div class="mx-auto max-w-[1316px] px-4 sm:px-8">
      <div class="mb-5 flex flex-col gap-4 border-b border-[#8E966D]/40 pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span class="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3B4E24]">
            <Sparkles class="h-3.5 w-3.5" />
            Lựa chọn hàng đầu
          </span>
          <h2 class="font-heading text-2xl font-black leading-tight text-[#242424] sm:text-3xl">
            Thực phẩm bán chạy nhất <span class="text-[#2D3B1E]">NutriMate</span>
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-[#3E4A2E]">
            Khám phá những sản phẩm được khách hàng yêu thích.
          </p>
        </div>

      </div>

      <p v-if="loadError" role="alert" class="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700">
        {{ loadError }}
      </p>
      <p v-else-if="isLoading" role="status" class="rounded-2xl border border-[#D5DFC8] bg-white/80 p-5 text-sm text-[#3E4A2E]">
        Đang tải sản phẩm bán chạy...
      </p>
      <p v-else-if="featuredList.length === 0" class="rounded-2xl border border-[#D5DFC8] bg-white/80 p-5 text-sm text-[#3E4A2E]">
        Hiện chưa có sản phẩm nổi bật.
      </p>

      <Transition
        v-else
        name="featured-page"
        mode="out-in"
      >
        <div
          :key="currentPage"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          @mouseenter="stopAutoRotate"
          @mouseleave="startAutoRotate"
        >
          <div
            v-for="prod in visibleProducts"
            :key="prod.id"
            class="featured-product-card group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#D5DFC8] bg-white"
          >
          <!-- Image & Badges -->
          <div class="relative overflow-hidden cursor-pointer" @click="goToDetail(prod.id)">
            <img
              :src="prod.image"
              :alt="prod.name"
              class="w-full h-48 object-cover"
            />
            <div v-if="prod.badges.length" class="absolute top-3.5 left-3.5 flex flex-col gap-1 z-10">
              <span
                v-for="badge in prod.badges"
                :key="badge"
                class="px-3 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-xs text-[#242424] border border-[#CCD7BC] shadow-2xs"
              >
                {{ badge }}
              </span>
            </div>
          </div>

          <!-- Info & Macros -->
          <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div class="cursor-pointer" @click="goToDetail(prod.id)">
              <div class="mb-1.5 flex items-center justify-between gap-2 text-xs text-[#576449]">
                <span class="truncate text-[11px] font-semibold" :title="prod.categoryName">
                  {{ prod.categoryName }}
                </span>
                <span class="flex shrink-0 items-center gap-1 font-bold text-[#2D3B1E]">
                  <Star class="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {{ prod.rating.toFixed(1) }}
                  <span class="text-[11px] font-medium text-[#7A866E]">({{ prod.reviewCount }})</span>
                </span>
              </div>
              <h3 class="font-heading text-sm font-bold text-[#242424] group-hover:text-[#6B7A3A] transition-colors line-clamp-2 leading-snug">
                {{ prod.name }}
              </h3>
            </div>

            <div class="grid grid-cols-4 gap-1 p-2 rounded-2xl bg-[#F6F8F3] border border-[#E8ECE2] text-center">
              <div class="px-0.5">
                <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Calo</span>
                <span class="text-xs font-bold text-[#242424]">{{ prod.nutrition.calories }}</span>
              </div>
              <div class="border-l border-[#E8ECE2] px-0.5">
                <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Đạm</span>
                <span class="text-xs font-bold text-[#6B7A3A]">{{ prod.nutrition.protein }}g</span>
              </div>
              <div class="border-l border-[#E8ECE2] px-0.5">
                <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Carb</span>
                <span class="text-xs font-bold text-[#242424]">{{ prod.nutrition.carbs }}g</span>
              </div>
              <div class="border-l border-[#E8ECE2] px-0.5">
                <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Đường</span>
                <span class="text-xs font-bold text-[#242424]">{{ prod.nutrition.sugar }}g</span>
              </div>
            </div>

            <!-- Price & Add Cart Button -->
            <div class="border-t border-[#F0F3EC] pt-2">
              <p class="mb-1.5 text-[11px] text-[#7A866E]">
                Đã bán {{ (prod.soldCount ?? 0).toLocaleString('vi-VN') }}
              </p>
              <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] text-[#7A866E] block font-medium">Giá niêm yết</span>
                <span class="font-heading text-base font-extrabold text-[#242424]">
                  {{ formatVnd(prod.price) }}
                </span>
              </div>

              <button
                type="button"
                @click="handleAdd(prod)"
                class="w-10 h-10 rounded-2xl bg-[#4D6A34] text-white flex items-center justify-center transition-colors duration-200 shadow-sm hover:bg-[#3B4E24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EA675] focus-visible:ring-offset-2"
                title="Thêm vào giỏ hàng"
                aria-label="Thêm vào giỏ hàng"
              >
                <ShoppingBag class="w-4 h-4" />
              </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </Transition>

      <div v-if="pageCount > 1" class="mt-5 flex justify-center">
        <nav class="inline-flex items-center gap-2 rounded-full border border-[#E3E8DC] bg-white/75 px-3 py-2 shadow-sm" aria-label="Điều hướng sản phẩm nổi bật">
          <button
            v-for="page in pageCount"
            :key="page"
            type="button"
            :aria-label="`Hiển thị trang sản phẩm ${page}`"
            :aria-current="currentPage === page - 1 ? 'page' : undefined"
            class="group flex h-7 min-w-3 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#536124] focus-visible:ring-offset-2"
            @click="showProductsPage(page - 1)"
          >
            <span
              class="h-2.5 rounded-full transition-all duration-300 ease-out group-hover:bg-[#536124]"
              :class="currentPage === page - 1 ? 'w-7 bg-[#3B4E24]' : 'w-2.5 bg-[#A6B18E]'"
            ></span>
          </button>
        </nav>
      </div>
    </div>
  </section>
</template>

<style scoped>
.featured-product-card {
  box-shadow: 0 1px 3px rgb(45 59 30 / 8%);
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.featured-product-card:hover,
.featured-product-card:focus-within {
  transform: translateY(-3px);
  border-color: #6b7a3a;
  box-shadow: 0 14px 28px rgb(45 59 30 / 22%);
}

.featured-page-enter-active,
.featured-page-leave-active {
  transition: opacity 250ms ease;
}

.featured-page-enter-from,
.featured-page-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .featured-product-card {
    transition: none;
  }

  .featured-page-enter-active,
  .featured-page-leave-active {
    transition: none;
  }
}
</style>
