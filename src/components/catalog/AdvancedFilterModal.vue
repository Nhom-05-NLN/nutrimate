<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { nutritionSliders as nutritionDefinitions, type AdvancedFilters } from '../../utils/catalogSliderFilters';
import { fetchNutritionSliderBounds } from '../../services/api';
import type { NutritionSliderBounds } from '../../../shared/catalogNutrition';
export type { AdvancedFilters } from '../../utils/catalogSliderFilters';
import {
  SlidersHorizontal,
  RotateCcw,
  X,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next';
const isOpen = defineModel<boolean>('isOpen', { default: false });
const filters = defineModel<AdvancedFilters>('filters', { required: true });
const bounds = ref<NutritionSliderBounds | null>(null);
const boundsLoading = ref(false);
const boundsError = ref('');
const nutritionSliders = computed(() => nutritionDefinitions.map(field => ({
  ...field, ...(bounds.value?.[field.key] ?? {min:0,max:0,step:1,available:false}),
})));
let boundsRequest = 0;
async function loadNutritionBounds() {
  const request = ++boundsRequest;
  boundsLoading.value = true;
  boundsError.value = '';
  try {
    const result = await fetchNutritionSliderBounds();
    if (request !== boundsRequest || !isOpen.value) return;
    bounds.value = result;
    for (const field of nutritionDefinitions) {
      const range = result[field.key];
      const slider = filters.value.nutrition[field.key];
      if (!range.available) slider.enabled = false;
      slider.value = slider.enabled
        ? Math.min(range.max,Math.max(range.min,slider.value))
        : slider.direction === 'max' ? range.max : range.min;
    }
  } catch (error) {
    if (request === boundsRequest) {
      bounds.value = null;
      boundsError.value = error instanceof Error ? error.message : 'Không thể tải giới hạn dinh dưỡng.';
    }
  } finally { if (request === boundsRequest) boundsLoading.value = false; }
}
watch(isOpen, open => {
  boundsRequest++;
  if (open) void loadNutritionBounds();
}, {immediate:true});
watch(() => filters.value, () => {
  if (!bounds.value) return;
  for (const field of nutritionDefinitions) {
    const slider = filters.value.nutrition[field.key];
    const range = bounds.value[field.key];
    if (!slider.enabled) slider.value = slider.direction === 'max' ? range.max : range.min;
  }
});

const emit = defineEmits<{
  (e: 'reset'): void;
}>();

const expanded = ref(false);
function toggleExpanded() {
  if (expanded.value) {
    for (const field of nutritionDefinitions.slice(4)) filters.value.nutrition[field.key].enabled = false;
  }
  expanded.value = !expanded.value;
}
const number = (value: number) => value.toLocaleString('vi-VN', {maximumFractionDigits:6});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
  >
    <!-- Backdrop làm mờ toàn màn hình -->
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      @click="isOpen = false"
    ></div>

    <div class="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-[#E3E8DC] overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-3 border-b border-[#E3E8DC] bg-white">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center text-[#4D6A34]">
            <SlidersHorizontal class="w-4 h-4" />
          </div>
          <div>
            <h2 class="font-heading text-lg font-bold text-[#2D3B1E]">
              Bộ lọc chuyên sâu
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('reset')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#7A866E] hover:text-[#4D6A34] hover:bg-[#FAF9F5] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Thiết lập lại</span>
          </button>
          <button
            type="button"
            @click="isOpen = false"
            class="w-8 h-8 rounded-full hover:bg-[#FAF9F5] flex items-center justify-center text-[#7A866E] hover:text-[#2D3B1E] transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Trạng thái tồn kho (Inventory) -->
        <div class="p-3 rounded-xl bg-[#FAF9F5] border border-[#E3E8DC] flex items-center justify-between">
          <div>
            <span class="text-[13px] font-bold text-[#2D3B1E] block">Chỉ hiển thị sản phẩm còn hàng</span>
            <span class="text-[11px] text-[#7A866E]">Ẩn những sản phẩm tạm thời hết hàng</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="filters.onlyInStock"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4D6A34]"></div>
          </label>
        </div>

        <!-- Khoảng giá  -->
        <div class="space-y-2.5">
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-[#2D3B1E]">
              Khoảng giá
            </label>
            <span class="text-xs font-extrabold text-[#4D6A34]">
              {{ formatVnd(filters.priceRange) }}
            </span>
          </div>
          <input
            type="range"
            min="50000"
            max="500000"
            step="10000"
            v-model="filters.priceRange"
            class="w-full accent-[#4D6A34] cursor-pointer"
          />
          <div class="flex justify-between text-[11px] font-semibold text-[#7A866E]">
            <span>50.000đ</span>
            <span>500.000đ</span>
          </div>
        </div>

        <section class="space-y-4 border-t border-[#E3E8DC] pt-5">
          <div>
            <h3 class="text-sm font-bold text-[#2D3B1E]">Giá trị dinh dưỡng</h3>
          </div>
          <p v-if="boundsLoading" class="text-xs text-[#7A866E]">Đang lấy giới hạn dinh dưỡng từ CSDL...</p>
          <div v-else-if="boundsError" role="alert" class="text-xs text-rose-600">
            {{ boundsError }}
            <button type="button" @click="loadNutritionBounds" class="ml-2 underline cursor-pointer">Thử lại</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              v-for="field in nutritionSliders.slice(0, 4)"
              :key="field.key"
              class="border rounded-xl p-3.5"
              :class="filters.nutrition[field.key].enabled ? 'border-[#A8BC96] bg-[#F8FAF5]' : 'border-[#E3E8DC] bg-white'"
            >
              <div class="flex items-center justify-between gap-2">
                <label :for="`enabled-${field.key}`" class="text-xs font-bold text-[#2D3B1E] cursor-pointer">
                  {{ field.label }}
                  <span class="font-normal text-[#7A866E]">
                    ({{ field.unit }})
                  </span>
                </label>
                <input
                  :id="`enabled-${field.key}`"
                  v-model="filters.nutrition[field.key].enabled"
                  :disabled="boundsLoading || !field.available"
                  type="checkbox"
                  :aria-label="`Bật lọc ${field.label}`"
                  class="accent-[#4D6A34] w-3.5 h-3.5"
                />
              </div>
              <div class="flex items-center justify-end gap-2 mt-3">
                <span class="text-xs font-bold text-[#4D6A34] whitespace-nowrap">
                  {{ filters.nutrition[field.key].enabled ? number(filters.nutrition[field.key].value) + ' ' + field.unit : 'Không lọc' }}
                </span>
              </div>
              <input
                v-model.number="filters.nutrition[field.key].value"
                :disabled="boundsLoading || !field.available || field.min === field.max"
                type="range"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                :aria-label="`${field.label} ${filters.nutrition[field.key].direction === 'max' ? 'tối đa' : 'tối thiểu'} (${field.unit})`"
                @input="filters.nutrition[field.key].enabled = true"
                class="w-full mt-4 accent-[#4D6A34] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <div class="flex justify-between text-[10px] text-[#7A866E] mt-2">
                <span>{{ number(field.min) }} {{ field.unit }}</span>
                <span>{{ number(field.max) }} {{ field.unit }}</span>
              </div>
            </div>
          </div>

          <div v-if="expanded" id="extra-nutrition" class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div
              v-for="field in nutritionSliders.slice(4)"
              :key="field.key"
              class="border rounded-xl p-3.5"
              :class="filters.nutrition[field.key].enabled ? 'border-[#A8BC96] bg-[#F8FAF5]' : 'border-[#E3E8DC] bg-white'"
            >
              <div class="flex items-center justify-between gap-2">
                <label :for="`enabled-${field.key}`" class="text-xs font-bold text-[#2D3B1E] cursor-pointer">
                  {{ field.label }}
                  <span class="font-normal text-[#7A866E]">
                    ({{ field.unit }})
                  </span>
                </label>
                <input
                  :id="`enabled-${field.key}`"
                  v-model="filters.nutrition[field.key].enabled"
                  :disabled="boundsLoading || !field.available"
                  type="checkbox"
                  :aria-label="`Bật lọc ${field.label}`"
                  class="accent-[#4D6A34] w-3.5 h-3.5"
                />
              </div>
              <div class="flex items-center justify-end gap-2 mt-3">
                <span class="text-xs font-bold text-[#4D6A34] whitespace-nowrap">
                  {{ filters.nutrition[field.key].enabled ? number(filters.nutrition[field.key].value) + ' ' + field.unit : 'Không lọc' }}
                </span>
              </div>
              <input
                v-model.number="filters.nutrition[field.key].value"
                :disabled="boundsLoading || !field.available || field.min === field.max"
                type="range"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                :aria-label="`${field.label} ${filters.nutrition[field.key].direction === 'max' ? 'tối đa' : 'tối thiểu'} (${field.unit})`"
                @input="filters.nutrition[field.key].enabled = true"
                class="w-full mt-4 accent-[#4D6A34] cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-[#7A866E] mt-2">
                <span>{{ number(field.min) }} {{ field.unit }}</span>
                <span>{{ number(field.max) }} {{ field.unit }}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-center">
            <button
              type="button"
              @click="toggleExpanded"
              :aria-expanded="expanded"
              aria-controls="extra-nutrition"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-[#4D6A34] hover:bg-[#F3F7EE] transition-colors cursor-pointer"
            >
              {{ expanded ? 'Thu gọn' : 'Thêm' }}
              <ChevronUp v-if="expanded" class="w-4 h-4" aria-hidden="true" />
              <ChevronDown v-else class="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        <!-- Đánh giá khách hàng -->
        <div class="space-y-2.5 pt-3 border-t border-[#F0F3EC]">
          <span class="text-xs font-bold text-[#2D3B1E] block">
            Đánh giá khách hàng
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              class="flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer"
              :class="filters.minRating === 4.5 ? 'border-[#4D6A34] bg-[#F7FAF4]' : 'border-[#E3E8DC] hover:bg-[#FAF9F5]'"
            >
              <input
                type="radio"
                :value="4.5"
                v-model="filters.minRating"
                class="accent-[#4D6A34]"
              />
              <div class="flex items-center gap-1 text-amber-500 font-bold text-xs">
                <span>4.5</span>
                <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span class="text-gray-500 font-normal">trở lên</span>
              </div>
            </label>

            <label
              class="flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer"
              :class="filters.minRating === 4.0 ? 'border-[#4D6A34] bg-[#F7FAF4]' : 'border-[#E3E8DC] hover:bg-[#FAF9F5]'"
            >
              <input
                type="radio"
                :value="4.0"
                v-model="filters.minRating"
                class="accent-[#4D6A34]"
              />
              <div class="flex items-center gap-1 text-amber-500 font-bold text-xs">
                <span>4.0</span>
                <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span class="text-gray-500 font-normal">trở lên</span>
              </div>
            </label>

            <label
              class="flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer"
              :class="filters.minRating === 3.0 ? 'border-[#4D6A34] bg-[#F7FAF4]' : 'border-[#E3E8DC] hover:bg-[#FAF9F5]'"
            >
              <input
                type="radio"
                :value="3.0"
                v-model="filters.minRating"
                class="accent-[#4D6A34]"
              />
              <div class="flex items-center gap-1 text-amber-500 font-bold text-xs">
                <span>3.0</span>
                <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span class="text-gray-500 font-normal">trở lên</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-5 border-t border-[#E3E8DC] bg-[#FAF9F5] flex items-center justify-end gap-3">
        <button
          type="button"
          @click="isOpen = false"
          class="px-4 py-2 rounded-[8px] bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
        >
          <Check class="w-4 h-4" />
          <span>Áp dụng</span>
        </button>
      </div>
    </div>
  </div>
</template>

