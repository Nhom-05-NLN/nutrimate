<script setup lang="ts">
import { NutritionFacts } from '../../types';
import { Flame, Dumbbell, CandyOff } from 'lucide-vue-next';

defineProps<{
  nutrition: NutritionFacts;
  compact?: boolean;
}>();
</script>

<template>
  <div class="flex items-center gap-1.5 text-xs font-semibold">
    <!-- Calories -->
    <div
      class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/60"
      title="Lượng Calo"
    >
      <Flame class="w-3.5 h-3.5 text-amber-600" />
      <span>{{ nutrition.calories }} kcal</span>
    </div>

    <!-- Protein -->
    <div
      class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/60"
      title="Hàm lượng Đạm / Protein"
    >
      <Dumbbell class="w-3.5 h-3.5 text-emerald-600" />
      <span>{{ nutrition.protein }}g Đạm</span>
    </div>

    <!-- Sugar -->
    <div
      v-if="!compact"
      class="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200/60"
      title="Lượng Đường"
    >
      <CandyOff class="w-3.5 h-3.5 text-rose-500" />
      <span>{{ nutrition.sugar }}g Đường</span>
    </div>
  </div>
</template>
