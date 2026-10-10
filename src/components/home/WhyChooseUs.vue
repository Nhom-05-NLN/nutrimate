<script setup lang="ts">
import {
  FileCheck2,
  Bot,
  Sparkles,
  RefreshCw,
} from 'lucide-vue-next';

const reasons = [
  {
    title: 'Minh bạch dinh dưỡng 100%',
    desc: 'Tất cả chỉ số Calo, Carbs, Fat, Protein đều qua kiểm nghiệm viện dinh dưỡng, in rõ ràng trên từng bao bì.',
    icon: FileCheck2,
  },
  {
    title: 'NutriBot AI thông minh',
    desc: 'Trợ lý AI sẵn sàng giải đáp calo, đề xuất thực đơn linh hoạt dựa trên chỉ số BMI và mục tiêu cân nặng tức thời.',
    icon: Bot,
  },
  {
    title: 'Nguồn gốc Organic',
    desc: 'Tuyệt đối không chất bảo quản, không phụ gia độc hại, không đường tinh luyện gây hại sức khỏe lâu dài.',
    icon: Sparkles,
  },
  {
    title: 'Đổi trả miễn phí 7 ngày',
    desc: 'Cam kết hoàn tiền hoặc đổi mới 100% nếu sản phẩm bị ẩm mốc, hư hỏng hoặc không đúng tiêu chuẩn chất lượng.',
    icon: RefreshCw,
  },
];
</script>

<template>
  <section class="w-full bg-[#F7F3E8] py-16 text-center">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <div class="max-w-2xl mx-auto mb-12 space-y-2">
        <span class="text-xs font-bold text-[#6B7A3A] uppercase tracking-wider block">
          TIÊU CHUẨN NUTRIMATE
        </span>
        <h2 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
          Tại sao hàng ngàn người chọn NutriMate?
        </h2>
        <p class="text-xs sm:text-sm text-[#7A866E] leading-relaxed">
          Chúng tôi kết hợp nguồn nông sản sạch kiểm định chặt chẽ cùng thuật toán AI cá nhân hóa giúp bạn ăn ngon mà không lo lệch chuẩn dinh dưỡng.
        </p>
      </div>

      <!-- 4 Cards Grid (Figma 01) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        <div
          v-for="item in reasons"
          :key="item.title"
          class="p-7 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#6B7A3A] hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
        >
          <div class="w-12 h-12 rounded-2xl bg-[#EBF7E5] text-[#6B7A3A] flex items-center justify-center">
            <component :is="item.icon" class="w-6 h-6 stroke-[1.8]" />
          </div>

          <div>
            <h3 class="font-heading text-sm font-bold text-[#242424]">
              {{ item.title }}
            </h3>
            <p class="text-xs text-[#7A866E] mt-2 leading-relaxed">
              {{ item.desc }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
