<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useProductStore } from '../../stores/productStore';
import { Flame, Dumbbell, CandyOff, ArrowRight } from 'lucide-vue-next';

const router = useRouter();
const productStore = useProductStore();

function selectCategory(catSlug: string) {
  productStore.setCategory(catSlug);
  router.push({ name: 'catalog' });
}
</script>

<template>
  <section class="py-10">
    <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
      <span class="text-xs font-bold text-emerald-700 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
        Phân Loại Dinh Dưỡng Mục Tiêu
      </span>
      <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
        3 Chế Độ Ăn Kiêng Chuyên Sâu
      </h2>
      <p class="text-sm text-slate-600">
        Lựa chọn thực phẩm được thiết kế chuẩn xác theo chế độ ăn uống và mục tiêu thể hình của bạn.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 1. Low Carb / Keto -->
      <div
        class="group relative bg-white rounded-3xl p-7 border border-slate-200/90 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Flame class="w-6 h-6" />
          </div>
          <span class="text-xs font-bold text-amber-700 tracking-wider uppercase">Chế độ đốt mỡ</span>
          <h3 class="font-heading text-xl font-bold text-slate-900 mt-1 mb-2.5">
            Low-Carb & KETO
          </h3>
          <p class="text-sm text-slate-600 leading-relaxed mb-6">
            Cắt giảm tối đa tinh bột thuần (&lt; 20g net-carbs), thay thế bằng chất xơ Glucomannan từ củ nưa và chất béo lành mạnh từ hạnh nhân, hạt macca.
          </p>
        </div>

        <button
          type="button"
          @click="selectCategory('low-carb')"
          class="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors group-hover:translate-x-1 duration-200"
        >
          <span>Khám phá món Low-Carb</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- 2. High Protein -->
      <div
        class="group relative bg-white rounded-3xl p-7 border border-slate-200/90 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Dumbbell class="w-6 h-6" />
          </div>
          <span class="text-xs font-bold text-emerald-700 tracking-wider uppercase">Tăng cơ & Giữ cơ</span>
          <h3 class="font-heading text-xl font-bold text-slate-900 mt-1 mb-2.5">
            High-Protein (Giàu đạm)
          </h3>
          <p class="text-sm text-slate-600 leading-relaxed mb-6">
            Nạp từ 20g - 35g protein tinh khiết mỗi bữa qua ức gà nấu chậm sous-vide mọng nước, thanh hạt dinh dưỡng whey isolate và bơ đậu phộng mộc 100%.
          </p>
        </div>

        <button
          type="button"
          @click="selectCategory('high-protein')"
          class="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors group-hover:translate-x-1 duration-200"
        >
          <span>Khám phá món Giàu Đạm</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- 3. Sugar Free -->
      <div
        class="group relative bg-white rounded-3xl p-7 border border-slate-200/90 hover:border-rose-400 hover:shadow-xl hover:shadow-rose-900/5 transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <CandyOff class="w-6 h-6" />
          </div>
          <span class="text-xs font-bold text-rose-600 tracking-wider uppercase">0% Đường tinh luyện</span>
          <h3 class="font-heading text-xl font-bold text-slate-900 mt-1 mb-2.5">
            Sugar-Free & Tiểu Đường
          </h3>
          <p class="text-sm text-slate-600 leading-relaxed mb-6">
            Hoàn toàn không làm tăng vọt chỉ số đường huyết (GI). Vị ngọt dịu nhẹ từ cỏ ngọt Stevia tự nhiên và nấm men Kombucha hỗ trợ hệ tiêu hóa.
          </p>
        </div>

        <button
          type="button"
          @click="selectCategory('sugar-free')"
          class="inline-flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors group-hover:translate-x-1 duration-200"
        >
          <span>Khám phá món 0g Đường</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </section>
</template>
