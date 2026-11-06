<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '../stores/productStore';
import ProductCard from '../components/catalog/ProductCard.vue';
import AdvancedFilterModal, { type AdvancedFilters } from '../components/catalog/AdvancedFilterModal.vue';
import EmptyIllustration from '../components/common/EmptyIllustration.vue';
import { Search, SlidersHorizontal, X } from 'lucide-vue-next';

const productStore = useProductStore();

const isFilterModalOpen = ref(false);

const searchInput = ref(productStore.filter.search || '');
const selectedCategories = computed(() => productStore.filter.categories?.length
  ? productStore.filter.categories
  : productStore.filter.category && productStore.filter.category !== 'all'
    ? [productStore.filter.category]
    : []);

function isCategorySelected(category: string) {
  return category === 'all'
    ? selectedCategories.value.length === 0
    : selectedCategories.value.includes(category);
}
const sortBy = ref<'popular' | 'price-asc' | 'price-desc' | 'calories-asc' | 'rating-desc'>('popular');

// Các tiêu chí lọc
const filters = ref<AdvancedFilters>({
  priceRange: 500000,
  selectedCaloRanges: [],
  selectedProteinRanges: [],
  selectedCarbRanges: [],
  selectedSugarRanges: [],
  minRating: null,
  onlyInStock: false,
});

onMounted(() => {
  productStore.setSort('sold_desc');
  productStore.loadCategories();
});

const categoryTabs = computed(() => [
  { key: 'all', label: 'Tất cả' },
  ...productStore.categories.map(category => ({ key: category.id, label: category.name })),
]);

function handleSortChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const val = target.value as typeof sortBy.value;
  sortBy.value = val;

  const mapping: Record<string, string> = {
    popular: 'sold_desc',
    'price-asc': 'price_asc',
    'price-desc': 'price_desc',
    'calories-asc': 'calories_asc',
    'rating-desc': 'rating_desc',
  };
  productStore.setSort(mapping[val] || 'newest');
}

// Real-time Search
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
function handleSearchInput() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = setTimeout(() => {
    productStore.setSearch(searchInput.value.trim());
  }, 300);
}

function applySearch() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  productStore.setSearch(searchInput.value.trim());
}

function clearSearch() {
  searchInput.value = '';
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  productStore.setSearch('');
}

function handleCategoryChange(cat: string) {
  if (cat === 'all') {
    productStore.setCategories([]);
    return;
  }
  const nextCategories = selectedCategories.value.includes(cat)
    ? selectedCategories.value.filter(category => category !== cat)
    : [...selectedCategories.value, cat];
  productStore.setCategories(nextCategories);
}

function resetAllFilters() {
  filters.value = {
    priceRange: 500000,
    selectedCaloRanges: [],
    selectedProteinRanges: [],
    selectedCarbRanges: [],
    selectedSugarRanges: [],
    minRating: null,
    onlyInStock: false,
  };
}

function removeFilter(type: string, val?: string | number) {
  if (type === 'price') filters.value.priceRange = 500000;
  if (type === 'calo' && typeof val === 'string') {
    filters.value.selectedCaloRanges = filters.value.selectedCaloRanges.filter((x) => x !== val);
  }
  if (type === 'protein' && typeof val === 'string') {
    filters.value.selectedProteinRanges = filters.value.selectedProteinRanges.filter((x) => x !== val);
  }
  if (type === 'carb' && typeof val === 'string') {
    filters.value.selectedCarbRanges = filters.value.selectedCarbRanges.filter((x) => x !== val);
  }
  if (type === 'sugar' && typeof val === 'string') {
    filters.value.selectedSugarRanges = filters.value.selectedSugarRanges.filter((x) => x !== val);
  }
  if (type === 'rating') filters.value.minRating = null;
  if (type === 'stock') filters.value.onlyInStock = false;
}

// Đếm số tiêu chí lọc được chọn
const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.priceRange < 500000) count++;
  count += filters.value.selectedCaloRanges.length;
  count += filters.value.selectedProteinRanges.length;
  count += filters.value.selectedCarbRanges.length;
  count += filters.value.selectedSugarRanges.length;
  if (filters.value.minRating !== null) count++;
  if (filters.value.onlyInStock) count++;
  return count;
});

const displayedProducts = computed(() => {
  let list = productStore.products;
  if (!list || list.length === 0) {
    return [];
  }

  // Tìm kiếm thời gian thực (Real-time search)
  if (searchInput.value.trim()) {
    const q = searchInput.value.trim().toLowerCase();
    list = list.filter(
      (p) => 
        p.name.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.ingredients?.some((ing) => ing.toLowerCase().includes(q))
    );
  }

  // Lọc sản phẩm theo các tiêu chí
  // Khoảng giá
  if (filters.value.priceRange < 500000) {
    list = list.filter((p) => p.price <= filters.value.priceRange);
  }

  // Mức Calories
  if (filters.value.selectedCaloRanges.length > 0) {
    list = list.filter((p) => {
      const cal = p.nutrition?.calories || 0;
      return filters.value.selectedCaloRanges.some((range) => {
        if (range === 'under-150') return cal < 150;
        if (range === '150-300') return cal >= 150 && cal <= 300;
        if (range === 'over-300') return cal > 300;
        return false;
      });
    });
  }

  // Hàm lượng Protein
  if (filters.value.selectedProteinRanges.length > 0) {
    list = list.filter((p) => {
      const pro = p.nutrition?.protein || 0;
      return filters.value.selectedProteinRanges.some((range) => {
        if (range === 'under-10') return pro < 10;
        if (range === '10-25') return pro >= 10 && pro <= 25;
        if (range === 'over-25') return pro > 25;
        return false;
      });
    });
  }

  // Hàm lượng Carbs 
  if (filters.value.selectedCarbRanges.length > 0) {
    list = list.filter((p) => {
      const carb = p.nutrition?.carbs || 0;
      return filters.value.selectedCarbRanges.some((range) => {
        if (range === 'under-10') return carb < 10;
        if (range === '10-30') return carb >= 10 && carb <= 30;
        if (range === 'over-30') return carb > 30;
        return false;
      });
    });
  }

  // Hàm lượng đường
  if (filters.value.selectedSugarRanges.length > 0) {
    list = list.filter((p) => {
      const sugar = p.nutrition?.sugar || 0;
      return filters.value.selectedSugarRanges.some((range) => {
        if (range === '0g') return sugar === 0;
        if (range === 'under-3g') return sugar <= 3;
        if (range === 'natural') return sugar > 0 && sugar <= 5;
        return false;
      });
    });
  }

  // Đánh giá khách hàng
  if (filters.value.minRating !== null) {
    list = list.filter((p) => (p.rating || 0) >= (filters.value.minRating || 0));
  }

  // Trạng thái tồn kho
  if (filters.value.onlyInStock) {
    list = list.filter((p) => (p.stock || 0) > 0);
  }

  return list;
});

const startItem = computed(() => {
  if (productStore.totalProducts === 0) return 0;
  return (productStore.currentPage - 1) * productStore.pageSize + 1;
});

const endItem = computed(() => {
  return Math.min(productStore.currentPage * productStore.pageSize, productStore.totalProducts);
});
</script>

<template>
  <div class="max-w-329 mx-auto px-4 sm:px-8 py-10 space-y-8">
    <!-- Main Title -->
    <div>
      <h1 class="font-heading text-3xl sm:text-4xl font-black text-[#2D3B1E]">
        Thực phẩm dinh dưỡng &amp; Ăn kiêng
      </h1>
      <p class="pt-2 text-sm text-[#7A866E]">Khám phá các sản phẩm ăn kiêng, thực phẩm giàu dinh dưỡng và lựa chọn lành mạnh cho lối sống cân bằng.</p>
    </div>

    <!-- Search Bar & Controls -->
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <!-- Search input -->
      <div class="relative flex-1 max-w-xl">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nutri-text-sub" />
        <input
          type="text"
          v-model="searchInput"
          @input="handleSearchInput"
          @keyup.enter="applySearch"
          placeholder="Bạn đang tìm sản phẩm gì?"
          class="w-full pl-11 pr-20 py-3 rounded-xl bg-white border border-[#E3E8DC] text-sm text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 shadow-2xs outline-none transition-all"
        />
      </div>

      <!-- Action Buttons: Nút mở Modal Bộ Lọc & Dropdown Sắp xếp -->
      <div class="flex items-center gap-3 shrink-0">
        <button type="button" 
                @click="isFilterModalOpen = true"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-white border border-[#E3E8DC] hover:border-[#4D6A34] text-xs font-semibold text-[#2D3B1E] shadow-2xs hover:bg-[#FAF9F5] transition-all cursor-pointer"
                :class="{ 'border-[#4D6A34] bg-[#F7FAF4] text-[#3B4E24] ring-2 ring-[#4D6A34]/15': activeFilterCount > 0 }" >
          <SlidersHorizontal class="w-4 h-4 text-[#4D6A34]" />
          <span>Bộ lọc chuyên sâu</span>
          <span v-if="activeFilterCount > 0" class="px-1.5 py-0.5 rounded-xl bg-[#4D6A34] text-white text-[10px] font-bold">
            {{ activeFilterCount }}
          </span>
        </button>


        <!-- Dropdown sắp xếp -->
        <div class="flex items-center gap-2 text-xs text-[#576449]">
          <select :value="sortBy"
                  @change="handleSortChange"
                  class="px-4 py-2.5 rounded-[8px] bg-white border border-[#E3E8DC] text-xs font-semibold text-[#2D3B1E] focus:border-[#4D6A34] outline-none shadow-2xs cursor-pointer">
            <option value="popular">Phổ biến nhất</option>
            <option value="price-asc">Giá thấp đến cao</option>
            <option value="price-desc">Giá cao đến thấp</option>
            <option value="rating-desc">Đánh giá cao nhất</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
      <button
        v-for="cat in categoryTabs"
        :key="cat.key"
        type="button"
        @click="handleCategoryChange(cat.key)"
        :aria-pressed="isCategorySelected(cat.key)"
        class="px-3 rounded-[8px] text-xs font-semibold transition-all shrink-0 min-h-[35px] flex items-center gap-2 cursor-pointer"
        :class="
          isCategorySelected(cat.key)
            ? 'bg-[#4D6A34] text-white shadow-xs'
            : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'
        "
      >
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Active Filter Tags Bar -->
    <div v-if="activeFilterCount > 0" class="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-[#E3E8DC]">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-semibold text-[#7A866E]">Đang lọc:</span>
        <span v-if="searchInput" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
          Từ khóa: "{{ searchInput }}"
          <X class="w-3.5 h-3.5 cursor-pointer hover:text-red-600" @click="clearSearch" />
        </span>
        <span v-if="filters.priceRange < 500000" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
          Giá &le; {{ new Intl.NumberFormat('vi-VN').format(filters.priceRange) }}đ
          <X class="w-3.5 h-3.5 cursor-pointer hover:text-red-600" @click="removeFilter('price')" />
        </span>

        <span v-for="r in filters.selectedCaloRanges" :key="r" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
          Calo: {{ r === 'under-150' ? '< 150 kcal' : r === '150-300' ? '150-300 kcal' : '> 300 kcal' }}
          <X class="w-3.5 h-3.5 cursor-pointer hover:text-red-600" @click="removeFilter('calo', r)" />
        </span>

        <span v-for="r in filters.selectedProteinRanges" :key="r" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
          Đạm: {{ r === 'under-10' ? '< 10g' : r === '10-25' ? '10-25g' : '> 25g High-Pro' }}
          <X class="w-3.5 h-3.5 cursor-pointer hover:text-red-600" @click="removeFilter('protein', r)" />
        </span>

        <span v-for="r in filters.selectedCarbRanges" :key="r" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
          Carb: {{ r === 'under-10' ? '< 10g' : r === '10-30' ? '10-30g' : '> 30g' }}  
          <X class="w-3.5 h-3.5 cursor-pointer hover:text-red-600" @click="removeFilter('carb', r)" />
        </span>

        <span v-for="r in filters.selectedSugarRanges" :key="r" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
          Đường: {{ r === 'zero' ? 'Không đường' : r === 'under-3g' ? '< 3g' : r === '3g-10g' ? '3-10g' : 'Đường tự nhiên' }}
          <X class="w-3.5 h-3.5 cursor-pointer hover:text-red-600" @click="removeFilter('sugar', r)" />
        </span>

        <span v-if="filters.minRating !== null" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
          Đánh giá: &ge; {{ filters.minRating }} ⭐
          <X class="w-3.5 h-3.5 cursor-pointer hover:text-red-600" @click="removeFilter('rating')" />
        </span>

        <span v-if="filters.onlyInStock" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
          Chỉ còn hàng
          <X class="w-3.5 h-3.5 cursor-pointer hover:text-red-600" @click="removeFilter('stock')" />
        </span>
      </div>

      <button type="button"
              @click="resetAllFilters"
              class="text-xs font-bold text-[#4D6A34] hover:text-[#3B4E24] hover:underline cursor-pointer ml-auto">
        Xóa tất cả
      </button>
    </div>

    <!-- Main Content: Product Grid -->
    <main class="space-y-6">
      <div class="flex items-center justify-between text-xs text-[#576449]">
        <span class="font-semibold">
          Hiển thị {{ displayedProducts.length }} trên tổng số {{ productStore.totalProducts }} sản phẩm
        </span>
      </div>

      <!-- Skeleton Loading State -->
      <div v-if="productStore.isLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="i in 8"
          :key="i"
          class="bg-white rounded-3xl border border-[#E3E8DC] p-4 space-y-4 animate-pulse"
        >
          <div class="aspect-4/3 w-full bg-[#EBF1E6] rounded-2xl"></div>
          <div class="h-4 bg-[#EBF1E6] rounded-md w-3/4"></div>
          <div class="h-3 bg-[#EBF1E6] rounded-md w-1/2"></div>
          <div class="flex justify-between items-center pt-2">
            <div class="h-5 bg-[#EBF1E6] rounded-md w-1/3"></div>
            <div class="h-8 w-8 bg-[#EBF1E6] rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      <div v-else-if="displayedProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ProductCard
          v-for="prod in displayedProducts"
          :key="prod.id"
          :product="prod"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <EmptyIllustration class="w-32 h-32 text-[#7A866E] animate-bounce" />
        <h2 class="font-heading text-xl text-[#2D3B1E]">Không có sản phẩm phù hợp</h2>
        <p class="text-sm text-[#7A866E] max-w-md">Không tìm thấy sản phẩm đáp ứng tiêu chí. Hãy thử xóa bộ lọc hoặc kiểm tra lại từ khóa tìm kiếm.</p>
      </div>

      <!-- Dynamic Pagination Controls -->
      <div v-if="productStore.totalPages > 1" class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E3E8DC]">
        <span class="text-xs font-medium text-[#7A866E]">
          Hiển thị {{ startItem }} - {{ endItem }} trong số {{ productStore.totalProducts }} kết quả
        </span>

        <div class="flex items-center gap-1.5 text-xs font-bold text-[#2D3B1E]">
          <!-- Prev Button -->
          <button
            type="button"
            :disabled="productStore.currentPage <= 1"
            @click="productStore.prevPage()"
            class="w-9 h-9 rounded-xl border border-[#CCD7BC] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF9F5] text-[#7A866E] cursor-pointer"
          >
            &lt;
          </button>

          <!-- Page Number Buttons -->
          <button
            v-for="page in productStore.totalPages"
            :key="page"
            type="button"
            @click="productStore.setPage(page)"
            class="w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
            :class="page === productStore.currentPage ? 'bg-[#4D6A34] text-white shadow-xs' : 'border border-[#CCD7BC] hover:bg-[#FAF9F5] text-[#2D3B1E]'"
          >
            {{ page }}
          </button>

          <!-- Next Button -->
          <button
            type="button"
            :disabled="productStore.currentPage >= productStore.totalPages"
            @click="productStore.nextPage()"
            class="w-9 h-9 rounded-xl border border-[#CCD7BC] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF9F5] text-[#7A866E] cursor-pointer"
          >
            &gt;
          </button>
        </div>
      </div>
    </main>

    <!-- Modal Bộ lọc chuyên sâu -->
    <AdvancedFilterModal
      v-model:is-open="isFilterModalOpen"
      v-model:filters="filters"
      :displayed-count="displayedProducts.length"
      @reset="resetAllFilters"
    />
  </div>
</template>
