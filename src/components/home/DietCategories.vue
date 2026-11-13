<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '../../stores/productStore';
import { fetchCategories } from '../../services/api';
import type { Category } from '../../types';
import { ArrowRight, CandyOff, Dumbbell, Leaf, Nut, Salad } from 'lucide-vue-next';

const router = useRouter();
const productStore = useProductStore();
const categories = ref<Category[]>([]);
const isLoading = ref(true);
const loadError = ref('');

function getCategoryIcon(category: Category) {
  const categoryKey = `${category.dietType} ${category.slug} ${category.name}`.toLowerCase();
  if (categoryKey.includes('protein')) return Dumbbell;
  if (categoryKey.includes('sugar') || categoryKey.includes('đường')) return CandyOff;
  if (categoryKey.includes('nut') || categoryKey.includes('hạt')) return Nut;
  if (categoryKey.includes('carb') || categoryKey.includes('keto')) return Salad;
  return Leaf;
}

onMounted(async () => {
  try {
    categories.value = await fetchCategories();
  } catch (error: unknown) {
    loadError.value = error instanceof Error ? error.message : 'Không thể tải danh mục.';
    console.error('[DietCategories] Không thể tải danh mục:', error);
  } finally {
    isLoading.value = false;
  }
});

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

      <p v-if="loadError" role="alert" class="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700">
        {{ loadError }}
      </p>
      <p v-else-if="isLoading" role="status" class="rounded-2xl border border-[#E3E8DC] bg-white p-5 text-sm text-[#7A866E]">
        Đang tải danh mục...
      </p>
      <p v-else-if="categories.length === 0" class="rounded-2xl border border-[#E3E8DC] bg-white p-5 text-sm text-[#7A866E]">
        Hiện chưa có danh mục sản phẩm.
      </p>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          @click="selectCategory(cat.id)"
          class="group w-full p-7 rounded-3xl bg-white border border-[#E3E8DC] text-left hover:border-[#6B7A3A] hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-[#EBF7E5] text-[#6B7A3A] flex items-center justify-center transition-transform group-hover:scale-110">
              <component :is="getCategoryIcon(cat)" class="w-6 h-6 stroke-[1.8]" />
            </div>

            <div>
              <h3 class="font-heading text-base font-bold text-[#242424] group-hover:text-[#6B7A3A] transition-colors">
                {{ cat.name }}
              </h3>
              <p class="text-xs text-[#7A866E] mt-2 leading-relaxed">
                {{ cat.description }}
              </p>
            </div>
          </div>

          <div class="pt-6 flex items-center justify-between text-xs font-bold text-[#6B7A3A]">
            <span>{{ cat.count ?? 0 }} Sản phẩm</span>
            <ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>
    </div>
  </section>
</template>
