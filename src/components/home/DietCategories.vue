<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '../../stores/productStore';
import { Leaf, ArrowRight } from 'lucide-vue-next';

const router = useRouter();
const productStore = useProductStore();

const categories = computed(() => productStore.categories.map(category => ({
  key: category.id,
  title: category.name,
  desc: category.description,
  count: `${category.count ?? 0} Sản phẩm`,
  icon: Leaf,
})));

onMounted(() => productStore.loadCategories());

function selectCategory(catKey: string) {
  productStore.setCategory(catKey);
  router.push({ name: 'catalog' });
}
</script>

<template>
  <section class="w-full bg-[#F7F3E8] py-16">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <div class="mb-10">
        <span class="text-xs font-bold text-[#6B7A3A] uppercase tracking-wider block mb-1.5">
          DANH MỤC CHUYÊN BIỆT
        </span>
        <h2 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
          Lựa chọn theo chế độ ăn của bạn
        </h2>
      </div>

      <!-- 4 Cards Grid (Figma 01) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="cat in categories"
          :key="cat.key"
          @click="selectCategory(cat.key)"
          class="group p-7 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#6B7A3A] hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-[#EBF7E5] text-[#6B7A3A] flex items-center justify-center transition-transform group-hover:scale-110">
              <component :is="cat.icon" class="w-6 h-6 stroke-[1.8]" />
            </div>

            <div>
              <h3 class="font-heading text-base font-bold text-[#242424] group-hover:text-[#6B7A3A] transition-colors">
                {{ cat.title }}
              </h3>
              <p class="text-xs text-[#7A866E] mt-2 leading-relaxed">
                {{ cat.desc }}
              </p>
            </div>
          </div>

          <div class="pt-6 flex items-center justify-between text-xs font-bold text-[#6B7A3A]">
            <span>{{ cat.count }}</span>
            <ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
