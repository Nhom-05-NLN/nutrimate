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
  <section class="py-14 text-center">
    <div class="max-w-2xl mx-auto mb-10 space-y-2">
      <span class="text-xs font-bold text-[#647C47] uppercase tracking-wider block">
        TIÊU CHUẨN NUTRIMATE
      </span>
      <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-[#2D3B1E]">
        Tại sao hàng ngàn người chọn NutriMate?
      </h2>
      <p class="text-xs sm:text-sm text-[#68725F]">
        Chúng tôi kết hợp nguồn nông sản sạch kiểm định chặt chẽ cùng thuật toán AI cá nhân hóa giúp bạn ăn ngon mà không lo lệch chuẩn dinh dưỡng.
      </p>
    </div>

    <!-- 4 Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
      <div
        v-for="item in reasons"
        :key="item.title"
        class="p-6 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] hover:shadow-md transition-all space-y-4"
      >
        <div class="w-12 h-12 rounded-2xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
          <component :is="item.icon" class="w-6 h-6 stroke-[1.8]" />
        </div>

        <div>
          <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">
            {{ item.title }}
          </h3>
          <p class="text-xs text-[#6B7562] mt-2 leading-relaxed">
            {{ item.desc }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
