<script setup lang="ts">
import { Star } from 'lucide-vue-next';

const reviews = [
  {
    initials: 'HD',
    name: 'Hoàng Đức',
    role: 'Fitness Enthusiast / Gymer 4 năm',
    quote: 'Ức gà sấy tiêu đen của NutriMate là cứu cánh những ngày siết cơ! Không dầu mỡ, giòn rụm mà Protein tận 31g mỗi gói. NutriBot còn tính macro khớp từng gam cho lịch tập của mình.',
  },
  {
    initials: 'MN',
    name: 'Mai Ngọc',
    role: 'Nhân viên Marketing, Hà Nội',
    quote: 'Ngồi văn phòng 8 tiếng hay thèm trà sữa với snack chiên. Từ khi đặt hũ granola và hạt dinh dưỡng ở đây, mình giảm được 3kg mỡ thừa trong 2 tháng mà không hề thấy mệt mỏi hay đuối sức.',
  },
  {
    initials: 'TL',
    name: 'Trần Linh',
    role: 'Thực hành lối sống Keto & IF',
    quote: 'Ăn Keto khắt khe nhất là chỉ số Carb ẩn. Mua đồ NutriMate rất an tâm vì thông số rõ ràng, bánh hạt ngọt tự nhiên từ stevia rất thanh, không bị đắng hậu vị. Giao hàng 2 tiếng quá tiện lợi!',
  },
];
</script>

<template>
  <section class="py-14 text-center">
    <div class="max-w-2xl mx-auto mb-10 space-y-2">
      <span class="text-xs font-bold text-[#647C47] uppercase tracking-wider block">
        CỘNG ĐỒNG NUTRIMATE
      </span>
      <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-[#2D3B1E]">
        Trải nghiệm thực tế từ người dùng
      </h2>
      <p class="text-xs sm:text-sm text-[#68725F]">
        Đồng hành cùng hơn 35.000 khách hàng trên hành trình thay đổi vóc dáng và duy trì thói quen ăn uống tích cực.
      </p>
    </div>

    <!-- 3 Review Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
      <div
        v-for="item in reviews"
        :key="item.name"
        class="p-6 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] hover:shadow-lg transition-all flex flex-col justify-between space-y-6"
      >
        <div class="space-y-4">
          <!-- Star Rating -->
          <div class="flex items-center gap-1 text-[#E8A020]">
            <Star v-for="i in 5" :key="i" class="w-4 h-4 fill-[#E8A020]" />
          </div>

          <p class="text-xs sm:text-sm text-[#4E5C3E] leading-relaxed italic">
            "{{ item.quote }}"
          </p>
        </div>

        <!-- User Info -->
        <div class="flex items-center gap-3 pt-4 border-t border-[#F0F3EC]">
          <div class="w-10 h-10 rounded-full bg-[#EBF1E6] text-[#4D6A34] font-bold text-xs flex items-center justify-center shrink-0">
            {{ item.initials }}
          </div>
          <div class="min-w-0">
            <h4 class="font-heading text-xs font-bold text-[#2D3B1E] truncate">
              {{ item.name }}
            </h4>
            <p class="text-[11px] text-[#7A866E] truncate">
              {{ item.role }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
