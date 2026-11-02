<script setup lang="ts">
import {
  SlidersHorizontal,
  RotateCcw,
  X,
  Star,
  Check,
} from 'lucide-vue-next';

export interface AdvancedFilters {
  priceRange: number;
  selectedCaloRanges: string[];
  selectedProteinRanges: string[];
  selectedCarbRanges: string[];
  selectedSugarRanges: string[];
  minRating: number | null;
  onlyInStock: boolean;
}

const isOpen = defineModel<boolean>('isOpen', { default: false });
const filters = defineModel<AdvancedFilters>('filters', { required: true });

defineProps<{
  displayedCount: number;
}>();

const emit = defineEmits<{
  (e: 'reset'): void;
}>();

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

        <!-- Nhóm dinh dưỡng -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-[#F0F3EC]">
          <!-- Mức Calo  -->
          <div class="space-y-2.5">
            <span class="text-xs font-bold text-[#2D3B1E] block">
              Mức Calories
            </span>
            <div class="space-y-2">
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="under-150" v-model="filters.selectedCaloRanges" class="accent-[#4D6A34] rounded" />
                <span>Dưới 150 kcal</span>
              </label>
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="150-300" v-model="filters.selectedCaloRanges" class="accent-[#4D6A34] rounded" />
                <span>150 - 300 kcal (Tiêu chuẩn)</span>
              </label>
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="over-300" v-model="filters.selectedCaloRanges" class="accent-[#4D6A34] rounded" />
                <span>Trên 300 kcal (Năng lượng cao)</span>
              </label>
            </div>
          </div>

          <!-- Hàm lượng Protein -->
          <div class="space-y-2.5">
            <span class="text-xs font-bold text-[#2D3B1E] block">
              Hàm lượng Đạm (Protein)
            </span>
            <div class="space-y-2">
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="under-10" v-model="filters.selectedProteinRanges" class="accent-[#4D6A34] rounded" />
                <span>Dưới 10g</span>
              </label>
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="10-25" v-model="filters.selectedProteinRanges" class="accent-[#4D6A34] rounded" />
                <span>10g - 25g (Cân bằng)</span>
              </label>
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="over-25" v-model="filters.selectedProteinRanges" class="accent-[#4D6A34] rounded" />
                <span>Trên 25g (High-Protein)</span>
              </label>
            </div>
          </div>

          <!-- Hàm lượng Carbs -->
          <div class="space-y-2.5">
            <span class="text-xs font-bold text-[#2D3B1E] block">
              Hàm lượng Tinh Bột (Carbs)
            </span>
            <div class="space-y-2">
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="under-10" v-model="filters.selectedCarbRanges" class="accent-[#4D6A34] rounded" />
                <span>Dưới 10g (Low-Carb)</span>
              </label>
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="10-30" v-model="filters.selectedCarbRanges" class="accent-[#4D6A34] rounded" />
                <span>10g - 30g</span>
              </label>
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="over-30" v-model="filters.selectedCarbRanges" class="accent-[#4D6A34] rounded" />
                <span>Trên 30g</span>
              </label>
            </div>
          </div>

          <!-- Lượng đường -->
          <div class="space-y-2.5">
            <span class="text-xs font-bold text-[#2D3B1E] block">
              Lượng đường (Sugar)
            </span>
            <div class="space-y-2">
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="zero" v-model="filters.selectedSugarRanges" class="accent-[#4D6A34] rounded" />
                <span>Không đường (0g - Sugar-Free)</span>
              </label>
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="under-3g" v-model="filters.selectedSugarRanges" class="accent-[#4D6A34] rounded" />
                <span>Rất ít đường (Dưới 3g)</span>
              </label>
              <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
                <input type="checkbox" value="3g-10g" v-model="filters.selectedSugarRanges" class="accent-[#4D6A34] rounded" />
                <span>Vừa phải (Từ 3g - 10g)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Đánh giá khách hàng -->
        <div class="space-y-2.5 pt-3 border-t border-[#F0F3EC]">
          <span class="text-xs font-bold text-[#2D3B1E] block">
            Lượt đánh giá
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
          <span>Áp dụng (Xem {{ displayedCount }} sản phẩm)</span>
        </button>
      </div>
    </div>
  </div>
</template>
