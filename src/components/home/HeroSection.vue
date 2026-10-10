<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useChatStore } from '../../stores/chatStore';
import {
  Sparkles,
  ArrowRight,
  Bot,
  ShieldCheck,
  Zap,
  Leaf,
} from 'lucide-vue-next';

const router = useRouter();
const chatStore = useChatStore();
</script>

<template>
  <section class="py-6 lg:py-10">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      <!-- Cột Trái: Thông điệp & CTA -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Badge Topic -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF1E6] border border-[#CCD7BC] text-[#3B4E24] text-xs font-semibold">
          <Sparkles class="w-3.5 h-3.5 text-[#556B2F]" />
          <span>Dinh dưỡng chuẩn hóa & Công nghệ AI thông minh</span>
        </div>

        <!-- Headline -->
        <h1 class="font-heading text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-[#2D3B1E] leading-[1.18]">
          Ăn lành mạnh hơn, sống khỏe hơn cùng <span class="text-[#4D6A34]">NutriMate</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-sm sm:text-base text-[#576449] leading-relaxed max-w-xl">
          Khám phá thực phẩm ăn kiêng chất lượng cao, tính toán dinh dưỡng tự động và nhận thực đơn cá nhân hóa từ trợ lý ảo NutriBot.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <RouterLink
            to="/catalog"
            class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm shadow-md transition-all min-h-[44px]"
          >
            <span>Khám phá sản phẩm</span>
            <ArrowRight class="w-4 h-4" />
          </RouterLink>

          <button
            type="button"
            @click="chatStore.openChat()"
            class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#F6F8F3] text-[#2D3B1E] font-bold text-sm border border-[#D5DFC8] shadow-2xs transition-all min-h-[44px]"
          >
            <Bot class="w-4 h-4 text-[#4D6A34]" />
            <span>Hỏi NutriBot AI</span>
          </button>
        </div>

        <!-- 3 Trust Points -->
        <div class="pt-4 flex flex-wrap items-center gap-6 text-xs font-semibold text-[#576449]">
          <div class="flex items-center gap-1.5">
            <Leaf class="w-4 h-4 text-[#4D6A34]" />
            <span>100% Tự nhiên</span>
          </div>
          <div class="flex items-center gap-1.5">
            <ShieldCheck class="w-4 h-4 text-[#4D6A34]" />
            <span>Chuẩn VSATTP</span>
          </div>
          <div class="flex items-center gap-1.5">
            <Zap class="w-4 h-4 text-[#4D6A34]" />
            <span>Giao nhanh 2h</span>
          </div>
        </div>
      </div>

      <!-- Cột Phải: Ảnh đĩa ăn Healthy + Card Macro nổi bật -->
      <div class="lg:col-span-5 relative">
        <div class="relative rounded-3xl overflow-hidden shadow-xl border border-[#E3E8DC] bg-white">
          <img
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"
            alt="Món ăn lành mạnh cùng NutriMate"
            class="w-full h-80 sm:h-96 object-cover"
          />

          <!-- Overlay Stats Card (Figma Style) -->
          <div class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#E3E8DC] shadow-lg">
            <div class="flex items-center justify-between text-xs text-[#576449] mb-2 pb-1.5 border-b border-[#F0F3EC]">
              <div class="flex items-center gap-1.5 font-bold text-[#2D3B1E]">
                <span class="w-2 h-2 rounded-full bg-[#4D6A34]"></span>
                Tỉ lệ Calo & Macro hôm nay
              </div>
              <span class="text-[11px] text-[#7A866E]">Mục tiêu 1,850 kcal</span>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2 rounded-xl bg-[#FAF9F5] border border-[#ECEFE7]">
                <span class="text-[10px] text-[#7A866E] block font-medium">Protein</span>
                <span class="font-heading text-sm font-bold text-[#2D3B1E]">120g</span>
              </div>
              <div class="p-2 rounded-xl bg-[#FAF9F5] border border-[#ECEFE7]">
                <span class="text-[10px] text-[#7A866E] block font-medium">Carbs</span>
                <span class="font-heading text-sm font-bold text-[#2D3B1E]">160g</span>
              </div>
              <div class="p-2 rounded-xl bg-[#FAF9F5] border border-[#ECEFE7]">
                <span class="text-[10px] text-[#7A866E] block font-medium">Chất béo</span>
                <span class="font-heading text-sm font-bold text-[#2D3B1E]">48g</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
