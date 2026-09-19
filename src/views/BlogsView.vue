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
    <div class="bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-4xl p-6 sm:p-10 border border-emerald-700/50 shadow-xl relative overflow-hidden">
      <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div class="relative shrink-0">
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80"
            alt="ThS. BS. Nguyễn Minh Châu"
            class="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-emerald-400/40 shadow-2xl"
          />
          <div class="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-md" title="Bác sĩ xác thực">
            <UserCheck class="w-4 h-4" />
          </div>
        </div>

        <div class="space-y-3 text-center md:text-left flex-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
            <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
            <span>Chuyên Mục Cố Vấn Y Khoa NutriMate</span>
          </div>

          <h1 class="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-white">
            Góc Chuyên Gia & Dinh Dưỡng Khoa Học
          </h1>

          <p class="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
            Chủ biên bởi <strong>ThS. BS. Nguyễn Minh Châu</strong> — Chuyên gia Dinh dưỡng Lâm sàng với hơn 12 năm nghiên cứu và tư vấn dinh dưỡng cho người ăn kiêng, thể thao và kiểm soát đường huyết.
          </p>

          <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-emerald-200">
            <span class="flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-400" /> 100% Nghiên cứu y học chứng minh
            </span>
            <span class="flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-400" /> Đã thẩm định chỉ số Macro
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Filter Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        @click="selectedCategory = cat.id"
        class="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[44px]"
        :class="
          selectedCategory === cat.id
            ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        "
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Articles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        v-for="article in filteredArticles"
        :key="article.id"
        class="bg-white rounded-3xl border border-slate-200/90 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group"
      >
        <div>
          <!-- Thumbnail -->
          <div class="aspect-16/10 overflow-hidden relative cursor-pointer" @click="readingArticle = article">
            <img
              :src="article.thumbnail"
              :alt="article.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span class="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-xs">
              {{ article.categoryLabel }}
            </span>
          </div>

          <!-- Content snippet -->
          <div class="p-6 space-y-3">
            <div class="flex items-center gap-3 text-xs text-slate-400">
              <span class="flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" /> {{ article.readTime }}
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5" /> {{ article.publishedDate }}
              </span>
            </div>

            <h2
              @click="readingArticle = article"
              class="font-heading text-lg font-bold text-slate-900 line-clamp-2 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              {{ article.title }}
            </h2>

            <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
              {{ article.excerpt }}
            </p>
          </div>
        </div>

        <!-- Read Action -->
        <div class="p-6 pt-0">
          <button
            type="button"
            @click="readingArticle = article"
            class="w-full py-2.5 rounded-xl border border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
          >
            <BookOpen class="w-4 h-4" />
            <span>Đọc bài viết chi tiết</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </article>
    </div>

    <!-- Article Detail Modal -->
    <div
      v-if="readingArticle"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      @click.self="readingArticle = null"
    >
      <div
        class="relative w-full max-w-3xl bg-white rounded-4xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            <BookOpen class="w-4 h-4" />
            <span>{{ readingArticle.categoryLabel }}</span>
          </div>

          <button
            type="button"
            @click="readingArticle = null"
            class="w-9 h-9 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Đóng bài viết"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Scrollable Content -->
        <div class="p-6 sm:p-8 overflow-y-auto space-y-6">
          <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
            {{ readingArticle.title }}
          </h2>

          <!-- Author Box -->
          <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
            <img
              :src="readingArticle.author.avatar"
              :alt="readingArticle.author.name"
              class="w-12 h-12 rounded-xl object-cover border border-emerald-300"
            />
            <div>
              <strong class="text-xs sm:text-sm font-bold text-slate-900 block">{{ readingArticle.author.name }}</strong>
              <span class="text-[11px] text-slate-500 block">{{ readingArticle.author.title }} • {{ readingArticle.author.hospital }}</span>
            </div>
          </div>

          <!-- Featured Thumbnail -->
          <img
            :src="readingArticle.thumbnail"
            :alt="readingArticle.title"
            class="w-full aspect-16/9 object-cover rounded-3xl"
          />

          <!-- Key Takeaways Callout -->
          <div class="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/70 space-y-2">
            <strong class="font-heading text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-amber-600" />
              Điểm cốt lõi cần nhớ:
            </strong>
            <ul class="space-y-1.5 text-xs sm:text-sm text-slate-700 pl-2">
              <li v-for="point in readingArticle.keyTakeaways" :key="point" class="flex items-start gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>

          <!-- Paragraphs -->
          <div class="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
            <p v-for="(para, idx) in readingArticle.contentParagraphs" :key="idx">
              {{ para }}
            </p>
          </div>

          <!-- Recommended Foods in Article -->
          <div class="pt-6 border-t border-slate-200 space-y-4">
            <h3 class="font-heading text-sm font-bold uppercase tracking-wider text-slate-900">
              Thực phẩm đề xuất trong bài viết:
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                v-for="prod in getRecommendedProducts(readingArticle.recommendedProductIds)"
                :key="prod.id"
                class="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <img :src="prod.image" :alt="prod.name" class="w-full aspect-4/3 object-cover rounded-xl mb-2" />
                <h4 class="font-heading text-xs font-bold text-slate-900 line-clamp-1">{{ prod.name }}</h4>
                <div class="flex items-center justify-between text-xs mt-2">
                  <span class="font-bold text-emerald-700">{{ formatVnd(prod.price) }}</span>
                  <button
                    type="button"
                    @click="cartStore.addItem(prod, 1)"
                    class="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
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
