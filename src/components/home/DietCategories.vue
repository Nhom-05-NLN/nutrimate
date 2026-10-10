<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useProductStore } from '../../stores/productStore';
import {
  Flame,
  Dumbbell,
  CandyOff,
  Sparkles,
  ArrowRight,
} from 'lucide-vue-next';

const router = useRouter();
const productStore = useProductStore();

interface CategoryItem {
  key: string;
  title: string;
  desc: string;
  count: string;
  icon: typeof Flame;
}

const categories: CategoryItem[] = [
  {
    key: 'low-carb',
    title: 'Low-Carb & Keto',
    desc: 'Giảm tinh bột tối đa, đốt mỡ tự nhiên và duy trì năng lượng bền bỉ.',
    count: '48+ Sản phẩm',
    icon: Flame,
  },
  {
    key: 'high-protein',
    title: 'High-Protein (Tăng cơ)',
    desc: 'Ức gà, whey sạch, protein bars hỗ trợ phục hồi và phát triển cơ bắp.',
    count: '62+ Sản phẩm',
    icon: Dumbbell,
  },
  {
    key: 'sugar-free',
    title: 'Sugar-Free (Không đường)',
    desc: 'Ngọt dịu từ cỏ ngọt stevia, an toàn cho đường huyết và kiểm soát cân nặng.',
    count: '35+ Sản phẩm',
    icon: CandyOff,
  },
  {
    key: 'snacks-nuts',
    title: 'Healthy Snacks & Hạt',
    desc: 'Hạt sấy mộc nguyên vị, granola giòn rụm cho bữa xế lành mạnh không lo béo.',
    count: '54+ Sản phẩm',
    icon: Sparkles,
  },
];

function selectCategory(catKey: string) {
  productStore.setCategory(catKey);
  router.push({ name: 'catalog' });
}
</script>

<template>
  <section class="py-10">
    <div class="mb-8">
      <span class="text-xs font-bold text-[#647C47] uppercase tracking-wider block mb-1">
        DANH MỤC CHUYÊN BIỆT
      </span>
      <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-[#2D3B1E]">
        Lựa chọn theo chế độ ăn của bạn
      </h2>
    </div>

    <!-- 4 Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="cat in categories"
        :key="cat.key"
        @click="selectCategory(cat.key)"
        class="group p-6 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div class="space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center transition-transform group-hover:scale-110">
            <component :is="cat.icon" class="w-6 h-6 stroke-[1.8]" />
          </div>

          <div>
            <h3 class="font-heading text-base font-bold text-[#2D3B1E] group-hover:text-[#4D6A34] transition-colors">
              {{ cat.title }}
            </h3>
            <p class="text-xs text-[#6B7562] mt-2 leading-relaxed">
              {{ cat.desc }}
            </p>
          </div>
        </div>

        <div class="pt-6 flex items-center justify-between text-xs font-bold text-[#4D6A34]">
          <span>{{ cat.count }}</span>
          <ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  </section>
</template>
