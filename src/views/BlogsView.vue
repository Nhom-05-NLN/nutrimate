<script setup lang="ts">
import { ref, computed } from 'vue';
import { NUTRITIONIST_ARTICLES, NutritionistArticle } from '../data/blogData';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import {
  BookOpen,
  UserCheck,
  Clock,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  X,
  ShoppingBag,
} from 'lucide-vue-next';

const productStore = useProductStore();
const cartStore = useCartStore();

const selectedCategory = ref<string>('all');
const readingArticle = ref<NutritionistArticle | null>(null);

const categories = [
  { id: 'all', label: 'Tất Cả Kiến Thức' },
  { id: 'weight_loss', label: 'Khoa Học Đốt Mỡ' },
  { id: 'low_carb', label: 'KETO & Low-Carb' },
  { id: 'sugar_free', label: 'Kiểm Soát Đường Huyết' },
];

const filteredArticles = computed(() => {
  if (selectedCategory.value === 'all') {
    return NUTRITIONIST_ARTICLES;
  }
  return NUTRITIONIST_ARTICLES.filter((a) => a.category === selectedCategory.value);
});

function getRecommendedProducts(productIds: string[]) {
  return productStore.products.filter((p) => productIds.includes(p.id));
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
</script>

<template>
  <div class="space-y-10 py-6 max-w-6xl mx-auto">
    <!-- Header Banner: Nutritionist Profile -->
    <div class="relative overflow-hidden rounded-3xl border border-[#CCD7BC] bg-linear-to-br from-[#2D3B1E] via-[#3B4E24] to-[#536124] p-6 text-white shadow-lg sm:p-9">
      <div class="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#C5E29B]/10 blur-3xl"></div>

      <div class="relative z-10 flex flex-col items-center gap-6 md:flex-row md:gap-8">
        <div class="relative shrink-0">
          <img
            :src="NUTRITIONIST_ARTICLES[0]?.author.avatar"
            :alt="NUTRITIONIST_ARTICLES[0]?.author.name || 'Tác giả NutriMate'"
            class="h-28 w-28 rounded-2xl border-4 border-white/25 object-cover shadow-xl sm:h-32 sm:w-32"
          />
          <div class="absolute -bottom-2 -right-2 rounded-xl border border-[#CCD7BC] bg-[#F7F3E8] p-2 text-[#4D6A34] shadow-md" title="Tác giả chuyên mục">
            <UserCheck class="h-4 w-4" />
          </div>
        </div>

        <div class="flex-1 space-y-3 text-center md:text-left">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#E4EDCF]">
            <Sparkles class="h-3.5 w-3.5 text-[#C5E29B]" />
            <span>GÓC KIẾN THỨC NUTRIMATE</span>
          </div>

          <h1 class="font-heading text-2xl font-black tracking-tight text-white sm:text-4xl">
            Kiến thức dinh dưỡng dễ áp dụng
          </h1>

          <p class="max-w-2xl text-sm leading-relaxed text-white/80">
            Bài viết được biên soạn bởi <strong class="text-white">{{ NUTRITIONIST_ARTICLES[0]?.author.name }}</strong>
            <span v-if="NUTRITIONIST_ARTICLES[0]?.author.title"> — {{ NUTRITIONIST_ARTICLES[0].author.title }}</span>.
            Cùng tìm hiểu cách ăn uống phù hợp với mục tiêu và nhịp sống của bạn.
          </p>

          <div class="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-[#E4EDCF] md:justify-start">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <BookOpen class="h-3.5 w-3.5 text-[#C5E29B]" /> {{ NUTRITIONIST_ARTICLES.length }} bài viết
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <CheckCircle2 class="h-3.5 w-3.5 text-[#C5E29B]" /> Nội dung tham khảo
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Filter Tabs -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-[#6B7A3A]">Khám phá theo chủ đề</p>
        <h2 class="mt-1 font-heading text-xl font-black text-[#242424] sm:text-2xl">Bài viết mới nhất</h2>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Lọc bài viết theo chủ đề">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        @click="selectedCategory = cat.id"
        class="min-h-11 shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm"
        :class="
          selectedCategory === cat.id
            ? 'bg-[#4D6A34] text-white shadow-md shadow-[#3B4E24]/20'
            : 'border border-[#E3E8DC] bg-white text-[#576449] hover:border-[#9EAB83] hover:bg-[#F7F9F4]'
        "
      >
        {{ cat.label }}
      </button>
      </div>
    </div>

    <!-- Articles Grid -->
    <div v-if="filteredArticles.length" class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="article in filteredArticles"
        :key="article.id"
        class="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E3E8DC] bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-[#9EAB83] hover:shadow-lg"
      >
        <div>
          <!-- Thumbnail -->
          <button type="button" class="relative block aspect-16/10 w-full cursor-pointer overflow-hidden bg-[#F0F3EC] text-left" @click="readingArticle = article" :aria-label="`Đọc bài viết: ${article.title}`">
            <img
              :src="article.thumbnail"
              :alt="article.title"
              loading="lazy"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span class="absolute left-3 top-3 rounded-full border border-white/30 bg-[#26351E]/75 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
              {{ article.categoryLabel }}
            </span>
          </button>

          <!-- Content snippet -->
          <div class="space-y-3 p-5">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7A866E]">
              <span class="inline-flex items-center gap-1">
                <Clock class="h-3.5 w-3.5" /> {{ article.readTime }}
              </span>
              <span class="inline-flex items-center gap-1">
                <Calendar class="h-3.5 w-3.5" /> {{ article.publishedDate }}
              </span>
            </div>

            <h3 class="line-clamp-2 font-heading text-base font-bold leading-snug text-[#242424] transition-colors group-hover:text-[#4D6A34] sm:text-lg">
              {{ article.title }}
            </h3>

            <p class="line-clamp-3 text-xs leading-relaxed text-[#576449] sm:text-sm">
              {{ article.excerpt }}
            </p>
          </div>
        </div>

        <!-- Read Action -->
        <div class="px-5 pb-5">
          <button
            type="button"
            @click="readingArticle = article"
            class="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#CCD7BC] bg-[#F7F9F4] py-2.5 text-xs font-bold text-[#3B4E24] transition-colors hover:border-[#6B7A3A] hover:bg-[#EBF1E3] sm:text-sm"
          >
            <BookOpen class="h-4 w-4" />
            <span>Đọc bài viết chi tiết</span>
            <ArrowRight class="h-4 w-4" />
          </button>
        </div>
      </article>
    </div>
    <div v-else class="rounded-3xl border border-[#E3E8DC] bg-white px-6 py-12 text-center">
      <BookOpen class="mx-auto h-8 w-8 text-[#8E966D]" />
      <p class="mt-3 font-heading font-bold text-[#2D3B1E]">Chưa có bài viết trong chủ đề này</p>
      <p class="mt-1 text-sm text-[#7A866E]">Hãy chọn một chủ đề khác để tiếp tục khám phá.</p>
    </div>

    <!-- Article Detail Modal -->
    <div
      v-if="readingArticle"
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1D2819]/65 p-4 backdrop-blur-sm sm:p-6"
      @click.self="readingArticle = null"
    >
      <div
        class="relative my-8 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#D5DFC8] bg-[#FDFCF8] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-[#E3E8DC] bg-[#F7F9F4] px-5 py-4 sm:px-7">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#536124]">
            <BookOpen class="h-4 w-4" />
            <span>{{ readingArticle.categoryLabel }}</span>
          </div>

          <button
            type="button"
            @click="readingArticle = null"
            class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#576449] shadow-sm transition-colors hover:bg-[#EBF1E3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7A3A]"
            aria-label="Đóng bài viết"
          >
            <X             class="h-5 w-5" />
          </button>
        </div>

        <!-- Modal Scrollable Content -->
        <div class="space-y-6 overflow-y-auto p-5 sm:p-8">
          <h2 class="font-heading text-2xl font-black leading-snug text-[#242424] sm:text-3xl">
            {{ readingArticle.title }}
          </h2>

          <!-- Author Box -->
          <div class="flex items-center gap-3 rounded-2xl border border-[#D5DFC8] bg-[#F1F5EB] p-3.5">
            <img
              :src="readingArticle.author.avatar"
              :alt="readingArticle.author.name"
              class="h-12 w-12 rounded-xl border border-[#CCD7BC] object-cover"
            />
            <div>
              <strong class="block text-xs font-bold text-[#242424] sm:text-sm">{{ readingArticle.author.name }}</strong>
              <span class="block text-[11px] text-[#7A866E]">{{ readingArticle.author.title }} • {{ readingArticle.author.hospital }}</span>
            </div>
          </div>

          <!-- Featured Thumbnail -->
          <img
            :src="readingArticle.thumbnail"
            :alt="readingArticle.title"
            class="aspect-16/9 w-full rounded-2xl border border-[#E3E8DC] object-cover"
          />

          <!-- Key Takeaways Callout -->
          <div class="space-y-2 rounded-2xl border border-[#D9DFC4] bg-[#F4F5EA] p-5">
            <strong class="flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-[#3B4E24]">
              <CheckCircle2 class="h-4 w-4 text-[#6B7A3A]" />
              Điểm cốt lõi cần nhớ:
            </strong>
            <ul class="space-y-1.5 pl-2 text-xs text-[#576449] sm:text-sm">
              <li v-for="point in readingArticle.keyTakeaways" :key="point" class="flex items-start gap-2">
                <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8E966D]"></span>
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>

          <!-- Paragraphs -->
          <div class="space-y-4 text-sm leading-relaxed text-[#3E4A2E] sm:text-base">
            <p v-for="(para, idx) in readingArticle.contentParagraphs" :key="idx">
              {{ para }}
            </p>
          </div>

          <!-- Recommended Foods in Article -->
          <div class="space-y-4 border-t border-[#E3E8DC] pt-6">
            <h3 class="font-heading text-sm font-bold uppercase tracking-wider text-[#2D3B1E]">
              Thực phẩm đề xuất trong bài viết:
            </h3>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                v-for="prod in getRecommendedProducts(readingArticle.recommendedProductIds)"
                :key="prod.id"
                class="flex flex-col justify-between rounded-2xl border border-[#E3E8DC] bg-white p-3"
              >
                <img :src="prod.image" :alt="prod.name" class="mb-2 aspect-4/3 w-full rounded-xl object-cover" />
                <h4 class="line-clamp-1 font-heading text-xs font-bold text-[#242424]">{{ prod.name }}</h4>
                <div class="mt-2 flex items-center justify-between text-xs">
                  <span class="font-bold text-[#4D6A34]">{{ formatVnd(prod.price) }}</span>
                  <button
                    type="button"
                    @click="cartStore.addItem(prod, 1)"
                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4D6A34] text-white transition-colors hover:bg-[#3B4E24]"
                    title="Thêm vào giỏ"
                  >
                    <ShoppingBag class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
