<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useChatStore } from '../../stores/chatStore';
import { useProductStore } from '../../stores/productStore';
import {
  Sparkles,
  ArrowRight,
  Bot,
  ShieldCheck,
  Flame,
  Dumbbell,
  CandyOff,
} from 'lucide-vue-next';

const router = useRouter();
const chatStore = useChatStore();
const productStore = useProductStore();

function navigateToCategory(cat: string) {
  productStore.setCategory(cat);
  router.push({ name: 'catalog' });
}
</script>

<template>
  <section class="relative overflow-hidden pt-8 pb-16 lg:py-20 bg-linear-to-b from-emerald-50/60 via-slate-50/30 to-transparent rounded-4xl border border-emerald-100/60 p-6 sm:p-10 lg:p-14 mb-12">
    <!-- Decorative background elements -->
    <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>

    <div class="relative max-w-5xl mx-auto text-center space-y-6">
      <!-- Badge Topic -->
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold shadow-xs">
        <Sparkles class="w-4 h-4 text-emerald-600" />
        <span>Nền Tảng TMĐT Thực Phẩm Ăn Kiêng & Dinh Dưỡng AI</span>
      </div>

      <!-- Main Headline -->
      <h1 class="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
        Ăn Kiêng Khoa Học. <br />
        <span class="text-transparent bg-clip-text bg-linear-to-r from-emerald-700 via-teal-600 to-emerald-800 font-display italic">
          Cá Nhân Hóa Dinh Dưỡng Với AI.
        </span>
      </h1>

      <!-- Subtitle -->
      <p class="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
        NutriMate cung cấp các dòng thực phẩm sạch chuyên sâu: <strong>Low-Carb / KETO</strong>, <strong>High-Protein</strong> cho gymer và <strong>0% Đường tinh luyện</strong>. Mọi sản phẩm đều minh bạch nhãn Nutrition Facts.
      </p>

      <!-- Primary CTAs -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
        <RouterLink
          to="/catalog"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-700/25 transition-all hover:scale-105 min-h-[44px]"
        >
          <span>Khám Phá Thực Đơn</span>
          <ArrowRight class="w-4 h-4" />
        </RouterLink>

        <button
          type="button"
          @click="chatStore.openChat()"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200 shadow-sm transition-all hover:border-emerald-300 min-h-[44px]"
        >
          <Bot class="w-5 h-5 text-emerald-600" />
          <span>Tư Vấn NutriBot AI</span>
        </button>
      </div>

      <!-- 3 Nutrition Pillar Quick Pills -->
      <div class="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
        <!-- Low Carb -->
        <div
          @click="navigateToCategory('low-carb')"
          class="p-4 rounded-2xl bg-white/80 backdrop-blur-xs border border-emerald-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all flex items-start gap-3 group"
        >
          <div class="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform shrink-0">
            <Flame class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-heading text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Low-Carb & KETO
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Bún nưa, bánh mì hạnh nhân ít tinh bột</p>
          </div>
        </div>

        <!-- High Protein -->
        <div
          @click="navigateToCategory('high-protein')"
          class="p-4 rounded-2xl bg-white/80 backdrop-blur-xs border border-emerald-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all flex items-start gap-3 group"
        >
          <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
            <Dumbbell class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-heading text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              High-Protein (Giàu đạm)
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Ức gà sous-vide 31g đạm, thanh hạt gym</p>
          </div>
        </div>

        <!-- Sugar Free -->
        <div
          @click="navigateToCategory('sugar-free')"
          class="p-4 rounded-2xl bg-white/80 backdrop-blur-xs border border-emerald-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all flex items-start gap-3 group"
        >
          <div class="p-2.5 rounded-xl bg-rose-50 text-rose-500 group-hover:scale-110 transition-transform shrink-0">
            <CandyOff class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-heading text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Sugar-Free (0g Đường)
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Kombucha men sống, sô cô la 85% cỏ ngọt</p>
          </div>
        </div>
      </div>

      <!-- Trust Metrics -->
      <div class="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
        <span class="flex items-center gap-1.5">
          <ShieldCheck class="w-4 h-4 text-emerald-600" />
          100% Nhãn chuẩn dinh dưỡng
        </span>
        <span class="hidden sm:inline">•</span>
        <span class="hidden sm:flex items-center gap-1.5">
          <Sparkles class="w-4 h-4 text-emerald-600" />
          Tư vấn AI theo chỉ số cơ thể
        </span>
      </div>
    </div>
  </section>
</template>
