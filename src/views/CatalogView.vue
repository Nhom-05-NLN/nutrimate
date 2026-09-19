<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProductStore } from '../stores/productStore';
import ProductCard from '../components/catalog/ProductCard.vue';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Dumbbell,
  RotateCcw,
  Sparkles,
} from 'lucide-vue-next';

const productStore = useProductStore();

const searchInput = ref(productStore.filter.search || '');
const selectedCategory = ref(productStore.filter.category || 'all');
const maxCalories = ref<number | undefined>(productStore.filter.maxCalories);
const minProtein = ref<number | undefined>(productStore.filter.minProtein);

onMounted(() => {
  productStore.loadProducts();
  if (productStore.categories.length === 0) {
    productStore.loadCategories();
  }
});

function applyFilters() {
  productStore.filter.category = selectedCategory.value;
  productStore.filter.search = searchInput.value;
  productStore.filter.maxCalories = maxCalories.value ? Number(maxCalories.value) : undefined;
  productStore.filter.minProtein = minProtein.value ? Number(minProtein.value) : undefined;
  productStore.loadProducts();
}

function handleCategoryChange(cat: string) {
  selectedCategory.value = cat;
  applyFilters();
}

function handleReset() {
  searchInput.value = '';
  selectedCategory.value = 'all';
  maxCalories.value = undefined;
  minProtein.value = undefined;
  productStore.resetFilter();
}
</script>

<template>
  <div class="py-6 space-y-8">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
          <Sparkles class="w-4 h-4" />
          <span>Danh Mục Thực Phẩm Ăn Kiêng</span>
        </div>
        <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900">
          Thực Đơn Dinh Dưỡng Khoa Học
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Lọc theo từng nhóm ăn kiêng và chỉ số Calo, Đạm phục vụ chính xác mục tiêu cơ thể.
        </p>
      </div>

      <div class="text-xs font-semibold text-slate-500">
        Hiển thị <strong>{{ productStore.products.length }}</strong> sản phẩm
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
      <button
        type="button"
        @click="handleCategoryChange('all')"
        class="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[44px]"
        :class="
          selectedCategory === 'all'
            ? 'bg-slate-900 text-white shadow-md'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        "
      >
        Tất Cả Sản Phẩm
      </button>

      <button
        type="button"
        @click="handleCategoryChange('low-carb')"
        class="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[44px]"
        :class="
          selectedCategory === 'low-carb'
            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        "
      >
        Low-Carb & KETO
      </button>

      <button
        type="button"
        @click="handleCategoryChange('high-protein')"
        class="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[44px]"
        :class="
          selectedCategory === 'high-protein'
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        "
      >
        High-Protein (Giàu đạm)
      </button>

      <button
        type="button"
        @click="handleCategoryChange('sugar-free')"
        class="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[44px]"
        :class="
          selectedCategory === 'sugar-free'
            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        "
      >
        Sugar-Free (0g Đường)
      </button>
    </div>

    <!-- Multi-criteria Filter Bar -->
    <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Search Input -->
      <div class="relative">
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Từ khóa</label>
        <div class="relative">
          <input
            type="text"
            v-model="searchInput"
            @keyup.enter="applyFilters"
            placeholder="Tên món, thành phần..."
            class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm outline-hidden focus:border-emerald-500"
          />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <!-- Max Calories -->
      <div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Flame class="w-3.5 h-3.5 text-amber-500" />
          <span>Calo tối đa (kcal)</span>
        </label>
        <select
          v-model="maxCalories"
          @change="applyFilters"
          class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm outline-hidden focus:border-emerald-500"
        >
          <option :value="undefined">Không giới hạn</option>
          <option :value="50">Dưới 50 kcal</option>
          <option :value="100">Dưới 100 kcal</option>
          <option :value="150">Dưới 150 kcal</option>
          <option :value="200">Dưới 200 kcal</option>
        </select>
      </div>

      <!-- Min Protein -->
      <div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Dumbbell class="w-3.5 h-3.5 text-emerald-600" />
          <span>Đạm tối thiểu (g)</span>
        </label>
        <select
          v-model="minProtein"
          @change="applyFilters"
          class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm outline-hidden focus:border-emerald-500"
        >
          <option :value="undefined">Không yêu cầu</option>
          <option :value="5">Từ 5g Đạm trở lên</option>
          <option :value="15">Từ 15g Đạm trở lên</option>
          <option :value="25">Từ 25g Đạm trở lên (Siết cơ)</option>
        </select>
      </div>

      <!-- Actions -->
      <div class="flex items-end gap-2">
        <button
          type="button"
          @click="applyFilters"
          class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all min-h-[40px]"
        >
          <SlidersHorizontal class="w-4 h-4" />
          <span>Áp dụng lọc</span>
        </button>

        <button
          type="button"
          @click="handleReset"
          class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="productStore.isLoading" class="py-20 text-center space-y-3">
      <div class="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
      <p class="text-sm font-medium text-slate-500">Đang lọc danh mục thực phẩm...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="productStore.products.length === 0"
      class="py-20 bg-white rounded-3xl border border-slate-200 text-center p-8 space-y-4 max-w-lg mx-auto"
    >
      <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <Search class="w-8 h-8" />
      </div>
      <h3 class="font-heading text-lg font-bold text-slate-800">Không tìm thấy món ăn phù hợp</h3>
      <p class="text-xs text-slate-500 leading-relaxed">
        Thử điều chỉnh lại mức Calo hoặc chuyển sang danh mục khác để tìm thêm món ăn bạn nhé.
      </p>
      <button
        type="button"
        @click="handleReset"
        class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
      >
        Khôi phục toàn bộ thực đơn
      </button>
    </div>

    <!-- Product Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProductCard
        v-for="prod in productStore.products"
        :key="prod.id"
        :product="prod"
      />
    </div>
  </div>
</template>
