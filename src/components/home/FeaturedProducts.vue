<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';
import { Product } from '../../types';
import { ShoppingBag } from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();

const activeTab = ref<'all' | 'fat-loss' | 'muscle-gain'>('all');

const featuredList: Product[] = [
  {
    id: 'prod-granola',
    code: 'NM-GRN-01',
    name: 'Granola Yến Mạch Hạt Dinh Dưỡng Siêu Hạt 500g',
    category: 'snacks-nuts',
    categoryName: 'Hạt dinh dưỡng',
    price: 185000,
    originalPrice: 215000,
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
    description: 'Granola Yến Mạch nướng mộc mật ong hoa nhãn, hạt macca, hạt điều, hạnh nhân nguyên cám.',
    ingredients: ['Yến mạch Úc (45%)', 'Hạnh nhân Mỹ (15%)', 'Quả óc chó Chile (10%)', 'Hạt điều Bình Phước (10%)', 'Mật ong hoa nhãn'],
    nutrition: {
      servingSize: '40g',
      calories: 380,
      protein: 14,
      carbs: 28,
      fat: 12,
      sugar: 3,
    },
    stock: 142,
    rating: 4.9,
    reviewCount: 124,
    badges: ['Top 1 Bán Chạy'],
    isFeatured: true,
    bestFor: 'Bữa sáng nhanh, nạp năng lượng lành mạnh',
  },
  {
    id: 'prod-chicken',
    code: 'NM-CKN-02',
    name: 'Ức Gà Sấy Giòn Vị Tiêu Đen Không Dầu 200g',
    category: 'high-protein',
    categoryName: 'Thịt sấy sạch',
    price: 110000,
    originalPrice: 135000,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
    description: 'Ức gà phi lê sấy nhiệt thấp không dầu mỡ, tẩm ướp tiêu đen và muối hồng.',
    ingredients: ['Ức gà tươi phi lê 98%', 'Tiêu đen', 'Muối hồng'],
    nutrition: {
      servingSize: '50g',
      calories: 145,
      protein: 31,
      carbs: 0,
      fat: 1.5,
      sugar: 0,
    },
    stock: 58,
    rating: 5.0,
    reviewCount: 208,
    badges: ['Keto Friendly'],
    isFeatured: true,
    bestFor: 'Gymer nạp đạm siết cơ tức thì',
  },
  {
    id: 'prod-protein-bar',
    code: 'NM-BAR-03',
    name: 'Thanh Protein Bar Socola Hạnh Nhân NutriFit (Hộp 6 thanh)',
    category: 'high-protein',
    categoryName: 'Snack thể thao',
    price: 220000,
    originalPrice: 250000,
    image: 'https://images.unsplash.com/photo-1622484216858-a5b4819779df?auto=format&fit=crop&w=600&q=80',
    description: 'Thanh năng lượng protein bar giàu whey isolate, hạnh nhân giòn và socola nguyên chất.',
    ingredients: ['Whey protein isolate', 'Hạnh nhân', 'Bột cacao', 'Bơ cacao'],
    nutrition: {
      servingSize: '60g',
      calories: 210,
      protein: 20,
      carbs: 16,
      fat: 7,
      sugar: 1.5,
    },
    stock: 88,
    rating: 4.8,
    reviewCount: 89,
    badges: ['Gym & Fitness'],
    isFeatured: true,
    bestFor: 'Nạp năng lượng trước và sau tập',
  },
  {
    id: 'prod-macca',
    code: 'NM-NUT-04',
    name: 'Hạt Macca & Hạnh Nhân Nướng Mộc Hũ 400g',
    category: 'snacks-nuts',
    categoryName: 'Hạt dinh dưỡng',
    price: 195000,
    originalPrice: 230000,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80',
    description: 'Hạt macca Đắk Lắk và hạnh nhân Mỹ nướng mộc nguyên vị không thêm muối hay đường.',
    ingredients: ['Hạt macca sấy (50%)', 'Hạnh nhân nướng mộc (50%)'],
    nutrition: {
      servingSize: '40g',
      calories: 290,
      protein: 9,
      carbs: 8,
      fat: 26,
      sugar: 2,
    },
    stock: 95,
    rating: 4.9,
    reviewCount: 95,
    badges: ['100% Nướng Mộc'],
    isFeatured: true,
    bestFor: 'Chất béo tốt cho tim mạch và não bộ',
  },
];

const filteredProducts = computed(() => {
  if (activeTab.value === 'fat-loss') {
    return featuredList.filter((p) => p.category === 'low-carb' || p.nutrition.sugar <= 1);
  }
  if (activeTab.value === 'muscle-gain') {
    return featuredList.filter((p) => p.nutrition.protein >= 20);
  }
  return featuredList;
});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleAdd(prod: Product) {
  cartStore.addItem(prod, 1, 'Hũ / Gói tiêu chuẩn');
}

function goToDetail(id: string) {
  router.push(`/product/${id}`);
}
</script>

<template>
  <section class="w-full bg-[#C0C59F] py-16">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <!-- Header with Tabs (Figma 01) -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <span class="text-xs font-bold text-[#2D3B1E] uppercase tracking-wider block mb-1.5">
            LỰA CHỌN HÀNG ĐẦU
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
            Thực phẩm bán chạy nhất <span class="text-[#2D3B1E]">NutriMate</span>
          </h2>
        </div>

        <!-- Filter Pills -->
        <div class="flex items-center gap-1.5 p-1 bg-white/60 backdrop-blur-xs rounded-full border border-[#B0B68E] shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            @click="activeTab = 'all'"
            class="px-5 py-2 rounded-full text-xs font-bold transition-all"
            :class="activeTab === 'all' ? 'bg-[#3B4E24] text-white shadow-xs' : 'text-[#3E4A2E] hover:text-[#242424]'"
          >
            Tất cả
          </button>
          <button
            type="button"
            @click="activeTab = 'fat-loss'"
            class="px-5 py-2 rounded-full text-xs font-bold transition-all"
            :class="activeTab === 'fat-loss' ? 'bg-[#3B4E24] text-white shadow-xs' : 'text-[#3E4A2E] hover:text-[#242424]'"
          >
            Giảm mỡ
          </button>
          <button
            type="button"
            @click="activeTab = 'muscle-gain'"
            class="px-5 py-2 rounded-full text-xs font-bold transition-all"
            :class="activeTab === 'muscle-gain' ? 'bg-[#3B4E24] text-white shadow-xs' : 'text-[#3E4A2E] hover:text-[#242424]'"
          >
            Tăng cơ
          </button>
        </div>
      </div>

      <!-- Product Grid 4 items (Figma 01 Style) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="prod in filteredProducts"
          :key="prod.id"
          class="group bg-white rounded-3xl border border-[#D5DFC8] hover:border-[#3B4E24] hover:shadow-2xl transition-all duration-200 overflow-hidden flex flex-col justify-between"
        >
          <!-- Image & Badges -->
          <div class="relative overflow-hidden cursor-pointer" @click="goToDetail(prod.id)">
            <img
              :src="prod.image"
              :alt="prod.name"
              class="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div class="absolute top-3.5 left-3.5 flex flex-col gap-1 z-10">
              <span
                v-for="badge in prod.badges"
                :key="badge"
                class="px-3 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-xs text-[#242424] border border-[#CCD7BC] shadow-2xs"
              >
                {{ badge }}
              </span>
            </div>
          </div>

          <!-- Info & Macros -->
          <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div class="cursor-pointer" @click="goToDetail(prod.id)">
              <h3 class="font-heading text-sm font-bold text-[#242424] group-hover:text-[#6B7A3A] transition-colors line-clamp-2 leading-snug">
                {{ prod.name }}
              </h3>
            </div>

            <!-- Macro 3 columns (Figma style) -->
            <div class="grid grid-cols-3 gap-1.5 p-2.5 rounded-2xl bg-[#F6F8F3] border border-[#E8ECE2] text-center">
              <div>
                <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Năng lượng</span>
                <span class="text-xs font-bold text-[#242424]">{{ prod.nutrition.calories }} kcal</span>
              </div>
              <div>
                <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Protein</span>
                <span class="text-xs font-bold text-[#6B7A3A]">{{ prod.nutrition.protein }}g</span>
              </div>
              <div>
                <span class="text-[9px] text-[#7A866E] uppercase block font-medium">Đường</span>
                <span class="text-xs font-bold text-[#242424]">{{ prod.nutrition.sugar }}g</span>
              </div>
            </div>

            <!-- Price & Add Cart Button -->
            <div class="pt-2 flex items-center justify-between border-t border-[#F0F3EC]">
              <div>
                <span class="text-[10px] text-[#7A866E] block font-medium">Giá niêm yết</span>
                <span class="font-heading text-base font-extrabold text-[#242424]">
                  {{ formatVnd(prod.price) }}
                </span>
              </div>

              <button
                type="button"
                @click="handleAdd(prod)"
                class="w-10 h-10 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white flex items-center justify-center transition-all shadow-sm"
                title="Thêm vào giỏ hàng"
                aria-label="Thêm vào giỏ hàng"
              >
                <ShoppingBag class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
