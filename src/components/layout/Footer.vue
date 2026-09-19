<script setup lang="ts">
import { Leaf, ShieldCheck, HeartPulse, Sparkles } from 'lucide-vue-next';
</script>

<template>
  <footer class="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        <!-- Brand Info -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Leaf class="w-5 h-5" />
            </div>
            <span class="font-heading text-xl font-bold tracking-tight text-white">
              Nutri<span class="text-emerald-400">Mate</span>
            </span>
          </div>
          <p class="text-sm text-slate-400 leading-relaxed">
            Nền tảng thương mại điện tử chuyên biệt cung cấp thực phẩm ăn kiêng lành mạnh, tích hợp trợ lý ảo AI tư vấn dinh dưỡng theo chỉ số cơ thể.
          </p>
          <div class="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Sparkles class="w-4 h-4" />
            <span>Đề tài Niên Luận Kỹ Thuật Phần Mềm - Nhóm 5</span>
          </div>
        </div>

        <!-- 3 Chế độ ăn -->
        <div class="space-y-4">
          <h3 class="font-heading text-sm font-bold text-white uppercase tracking-wider">
            3 Chế Độ Ăn Kiêng Cốt Lõi
          </h3>
          <ul class="space-y-2.5 text-sm text-slate-400">
            <li class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span><strong>Low-Carb / KETO:</strong> Giảm tối đa carbs, tinh bột kháng</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span><strong>High-Protein:</strong> Ức gà sous-vide, thanh hạt nạp đạm</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span><strong>Sugar-Free:</strong> 0g đường tinh luyện, cỏ ngọt tự nhiên</span>
            </li>
          </ul>
        </div>

        <!-- Tiêu chuẩn & Cam kết -->
        <div class="space-y-4">
          <h3 class="font-heading text-sm font-bold text-white uppercase tracking-wider">
            Tiêu Chuẩn Khoa Học
          </h3>
          <div class="space-y-3 text-sm text-slate-400">
            <div class="flex items-start gap-2.5">
              <ShieldCheck class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Minh bạch 100% chỉ số Calo, Đạm, Tinh bột, Đường trên nhãn Nutrition Facts.</span>
            </div>
            <div class="flex items-start gap-2.5">
              <HeartPulse class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>Dữ liệu tư vấn chuẩn dinh dưỡng phù hợp mục tiêu siết cân, tăng cơ hoặc ăn sạch.</span>
            </div>
          </div>
        </div>

        <!-- Tech Stack Specification -->
        <div class="space-y-4">
          <h3 class="font-heading text-sm font-bold text-white uppercase tracking-wider">
            Kiến Trúc Kỹ Thuật
          </h3>
          <ul class="space-y-2 text-xs text-slate-400 font-mono">
            <li class="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
              <strong class="text-emerald-400">Frontend:</strong> Vue 3, Vite, Tailwind CSS, Pinia
            </li>
            <li class="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
              <strong class="text-sky-400">Backend:</strong> Node.js, Express, RESTful API
            </li>
            <li class="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
              <strong class="text-amber-400">Database:</strong> PostgreSQL (8 Tables, DDL, Indexes)
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 NutriMate Project. Học phần Niên luận KTPM (CT250E).</p>
        <p class="text-slate-400">Xây dựng website bán thực phẩm ăn kiêng tích hợp AI Chatbot.</p>
      </div>
    </div>
  </footer>
</template>
