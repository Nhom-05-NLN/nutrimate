<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '../stores/productStore';
import ProductCard from '../components/catalog/ProductCard.vue';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  Dumbbell,
  Wheat,
  RotateCcw,
  X,
} from 'lucide-vue-next';

const productStore = useProductStore();

const searchInput = ref(productStore.filter.search || '');
const selectedCategory = ref(productStore.filter.category || 'all');
const sortBy = ref<'popular' | 'price-asc' | 'price-desc' | 'calories-asc' | 'protein-desc'>('popular');

// Filter Sidebar state
const priceRange = ref(500000);
const selectedCaloRanges = ref<string[]>([]);
const selectedProteinRanges = ref<string[]>([]);
const selectedSugarRanges = ref<string[]>([]);
const selectedDiets = ref<string[]>([]);

onMounted(() => {
  productStore.loadProducts();
  if (productStore.categories.length === 0) {
    productStore.loadCategories();
  }
});

const categoryTabs = [
  { key: 'all', label: 'Tất cả', count: 48 },
  { key: 'low-carb', label: 'Low-Carb', count: 18 },
  { key: 'high-protein', label: 'High-Protein', count: 22 },
  { key: 'sugar-free', label: 'Sugar-Free', count: 15 },
  { key: 'snacks-nuts', label: 'Hạt dinh dưỡng', count: 14 },
  { key: 'bakery', label: 'Bánh ăn kiêng', count: 9 },
];

function applyFilters() {
  productStore.filter.category = selectedCategory.value;
  productStore.filter.search = searchInput.value;
  productStore.loadProducts();
}

function handleCategoryChange(cat: string) {
  selectedCategory.value = cat;
  applyFilters();
}

function resetAllFilters() {
  searchInput.value = '';
  selectedCategory.value = 'all';
  priceRange.value = 500000;
  selectedCaloRanges.value = [];
  selectedProteinRanges.value = [];
  selectedSugarRanges.value = [];
  selectedDiets.value = [];
  productStore.resetFilter();
}

function removeFilter(type: string, val: string) {
  if (type === 'calo') selectedCaloRanges.value = selectedCaloRanges.value.filter((x) => x !== val);
  if (type === 'protein') selectedProteinRanges.value = selectedProteinRanges.value.filter((x) => x !== val);
  if (type === 'diet') selectedDiets.value = selectedDiets.value.filter((x) => x !== val);
}

// Fallback Mock Product List Matching Figma 02 if API has subset
const figmaProducts = computed(() => {
  let list = productStore.products;
  if (!list || list.length === 0) {
    return [];
  }

  // Filter by category
  if (selectedCategory.value !== 'all') {
    list = list.filter((p) => p.category === selectedCategory.value);
  }

  // Filter by search
  if (searchInput.value.trim()) {
    const q = searchInput.value.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  // Filter by price
  list = list.filter((p) => p.price <= priceRange.value);

  // Sorting
  if (sortBy.value === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sortBy.value === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  if (sortBy.value === 'calories-asc') list = [...list].sort((a, b) => a.nutrition.calories - b.nutrition.calories);
  if (sortBy.value === 'protein-desc') list = [...list].sort((a, b) => b.nutrition.protein - a.nutrition.protein);

  return list;
});
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#2D3B1E]">Trang chủ</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="text-[#2D3B1E] font-bold">Thực phẩm</span>
    </nav>

    <!-- Main Title -->
    <div>
      <h1 class="font-heading text-3xl sm:text-4xl font-black text-[#2D3B1E]">
        Thực phẩm dinh dưỡng & Ăn kiêng
      </h1>
    </div>

    <!-- Search Bar & Sort Dropdown -->
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <!-- Search input with shortcut icon -->
      <div class="relative flex-1 max-w-xl">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
        <input
          type="text"
          v-model="searchInput"
          @keyup.enter="applyFilters"
          placeholder="Bạn đang tìm sản phẩm gì? (Granola, ức gà, whey, snack...)"
          class="w-full pl-11 pr-14 py-3 rounded-2xl bg-white border border-[#E3E8DC] text-sm text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 shadow-2xs outline-none"
        />
        <span class="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-[#FAF9F5] border border-[#CCD7BC] text-[10px] font-bold text-[#7A866E]">
          ⌘K
        </span>
      </div>

      <!-- Sort select -->
      <div class="flex items-center gap-2 text-xs text-[#576449] shrink-0">
        <span class="font-semibold">Sắp xếp theo:</span>
        <select
          v-model="sortBy"
          class="px-4 py-2.5 rounded-2xl bg-white border border-[#E3E8DC] text-xs font-bold text-[#2D3B1E] focus:border-[#4D6A34] outline-none shadow-2xs cursor-pointer"
        >
          <option value="popular">Phổ biến nhất</option>
          <option value="price-asc">Giá thấp đến cao</option>
          <option value="price-desc">Giá cao đến thấp</option>
          <option value="calories-asc">Calo thấp nhất</option>
          <option value="protein-desc">Protein cao nhất</option>
        </select>
      </div>
    </div>

    <!-- Horizontal Category Filter Pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
      <button
        v-for="cat in categoryTabs"
        :key="cat.key"
        type="button"
        @click="handleCategoryChange(cat.key)"
        class="px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 min-h-[40px] flex items-center gap-1.5"
        :class="
          selectedCategory === cat.key
            ? 'bg-[#4D6A34] text-white shadow-xs'
            : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'
        "
      >
        <span>{{ cat.label }}</span>
        <span class="text-[11px] opacity-80">({{ cat.count }})</span>
      </button>
    </div>

    <!-- 2 Columns Layout: Filter Sidebar & Product Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Cột Trái: Sidebar Bộ Lọc Chuyên Sâu (Figma Style) -->
      <aside class="lg:col-span-3 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-6">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
          <div class="flex items-center gap-2 font-heading text-sm font-bold text-[#2D3B1E]">
            <SlidersHorizontal class="w-4 h-4 text-[#4D6A34]" />
            <span>Bộ lọc chuyên sâu</span>
          </div>
          <button
            type="button"
            @click="resetAllFilters"
            class="text-xs font-semibold text-[#7A866E] hover:text-[#4D6A34] transition-colors"
          >
            Xóa lọc
          </button>
        </div>

        <!-- 1. Khoảng giá slider -->
        <div class="space-y-3">
          <label class="text-xs font-bold text-[#2D3B1E] block">
            Khoảng giá (VNĐ)
          </label>
          <div class="flex justify-between text-[11px] font-semibold text-[#7A866E]">
            <span>50.000đ</span>
            <span class="text-[#4D6A34] font-bold">{{ new Intl.NumberFormat('vi-VN').format(priceRange) }}đ</span>
            <span>500.000đ</span>
          </div>
          <input
            type="range"
            min="50000"
            max="500000"
            step="10000"
            v-model="priceRange"
            class="w-full accent-[#4D6A34] cursor-pointer"
          />
        </div>

        <!-- 2. Mức Calo trên khẩu phần -->
        <div class="space-y-2.5 pt-2 border-t border-[#F0F3EC]">
          <span class="text-xs font-bold text-[#2D3B1E] block">
            Mức Calo (trên khẩu phần)
          </span>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="under-150" v-model="selectedCaloRanges" class="accent-[#4D6A34] rounded" />
            <span>Dưới 150 kcal</span>
          </label>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="150-300" v-model="selectedCaloRanges" class="accent-[#4D6A34] rounded" />
            <span>150 - 300 kcal</span>
          </label>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="over-300" v-model="selectedCaloRanges" class="accent-[#4D6A34] rounded" />
            <span>Trên 300 kcal</span>
          </label>
        </div>

        <!-- 3. Hàm lượng Protein -->
        <div class="space-y-2.5 pt-2 border-t border-[#F0F3EC]">
          <span class="text-xs font-bold text-[#2D3B1E] block">
            Hàm lượng Protein
          </span>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="under-10" v-model="selectedProteinRanges" class="accent-[#4D6A34] rounded" />
            <span>Dưới 10g</span>
          </label>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="10-25" v-model="selectedProteinRanges" class="accent-[#4D6A34] rounded" />
            <span>10g - 25g</span>
          </label>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="over-25" v-model="selectedProteinRanges" class="accent-[#4D6A34] rounded" />
            <span>Trên 25g (High Pro)</span>
          </label>
        </div>

        <!-- 4. Lượng đường (Sugar) -->
        <div class="space-y-2.5 pt-2 border-t border-[#F0F3EC]">
          <span class="text-xs font-bold text-[#2D3B1E] block">
            Lượng đường (Sugar)
          </span>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="0g" v-model="selectedSugarRanges" class="accent-[#4D6A34] rounded" />
            <span>Không đường (0g)</span>
          </label>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="under-3g" v-model="selectedSugarRanges" class="accent-[#4D6A34] rounded" />
            <span>Dưới 3g</span>
          </label>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="natural" v-model="selectedSugarRanges" class="accent-[#4D6A34] rounded" />
            <span>Ít đường tự nhiên</span>
          </label>
        </div>

        <!-- 5. Chứng nhận & Chế độ -->
        <div class="space-y-2.5 pt-2 border-t border-[#F0F3EC]">
          <span class="text-xs font-bold text-[#2D3B1E] block">
            Chứng nhận & Chế độ
          </span>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="keto" v-model="selectedDiets" class="accent-[#4D6A34] rounded" />
            <span>Keto Friendly</span>
          </label>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="vegan" v-model="selectedDiets" class="accent-[#4D6A34] rounded" />
            <span>Thuần chay (Vegan)</span>
          </label>
          <label class="flex items-center gap-2.5 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" value="gluten-free" v-model="selectedDiets" class="accent-[#4D6A34] rounded" />
            <span>Gluten Free</span>
          </label>
        </div>

        <!-- Action buttons -->
        <div class="space-y-2 pt-2">
          <button
            type="button"
            @click="applyFilters"
            class="w-full py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold transition-all shadow-xs"
          >
            Áp dụng bộ lọc
          </button>
          <button
            type="button"
            @click="resetAllFilters"
            class="w-full py-2.5 rounded-2xl bg-[#FAF9F5] hover:bg-[#F0F3EC] text-[#576449] text-xs font-bold border border-[#CCD7BC] transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </aside>

      <!-- Cột Phải: Active Filter Tags & Grid Sản Phẩm -->
      <main class="lg:col-span-9 space-y-6">
        <!-- Active Filter Tags Header -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#E3E8DC]">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-[#7A866E]">Đang lọc:</span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
              150 - 300 kcal
              <X class="w-3.5 h-3.5 cursor-pointer" @click="removeFilter('calo', '150-300')" />
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
              10g - 25g Pro
              <X class="w-3.5 h-3.5 cursor-pointer" @click="removeFilter('protein', '10-25')" />
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-medium text-[#3B4E24]">
              Keto Friendly
              <X class="w-3.5 h-3.5 cursor-pointer" @click="removeFilter('diet', 'keto')" />
            </span>
          </div>

          <span class="text-xs font-bold text-[#576449]">
            Hiển thị {{ figmaProducts.length }} trên 48 sản phẩm
          </span>
        </div>

        <!-- Products Grid -->
        <div v-if="figmaProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            v-for="prod in figmaProducts"
            :key="prod.id"
            :product="prod"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="py-16 text-center bg-white rounded-3xl border border-[#E3E8DC] space-y-3">
          <p class="font-heading text-lg font-bold text-[#2D3B1E]">Không tìm thấy sản phẩm phù hợp</p>
          <p class="text-xs text-[#7A866E]">Thử nới lỏng bộ lọc hoặc tìm từ khóa khác</p>
          <button
            type="button"
            @click="resetAllFilters"
            class="px-5 py-2.5 rounded-xl bg-[#4D6A34] text-white text-xs font-bold"
          >
            Xem tất cả thực phẩm
          </button>
        </div>

        <!-- Pagination (Figma 02 Style) -->
        <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E3E8DC]">
          <span class="text-xs font-medium text-[#7A866E]">
            Hiển thị 1 - {{ figmaProducts.length }} trong số 48 kết quả
          </span>

          <div class="flex items-center gap-1 text-xs font-bold text-[#2D3B1E]">
            <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5] text-[#7A866E]">
              &lt;
            </button>
            <button class="w-8 h-8 rounded-xl bg-[#4D6A34] text-white flex items-center justify-center">
              1
            </button>
            <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5]">
              2
            </button>
            <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5]">
              3
            </button>
            <span class="px-2 text-[#7A866E]">...</span>
            <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5]">
              6
            </button>
            <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5] text-[#7A866E]">
              &gt;
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
