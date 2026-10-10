<script setup lang="ts">
import { ref } from 'vue';
import {
  Package,
  AlertTriangle,
  Bot,
  PieChart,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  RotateCcw,
} from 'lucide-vue-next';

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const activeTab = ref('all');
const searchQuery = ref('');

const products = ref([
  {
    sku: 'NM-GRN-01',
    name: 'Granola Yến Mạch Siêu Hạt',
    category: 'Eat Clean / Healthy Snacks',
    price: 185000,
    calo: 380,
    protein: 14,
    sugar: 3,
    stock: 142,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=100&q=80',
  },
  {
    sku: 'NM-CKN-02',
    name: 'Ức Gà Sấy Giòn Vị Thảo Mộc',
    category: 'High-Protein / Keto',
    price: 65000,
    calo: 145,
    protein: 32,
    sugar: 0,
    stock: 15,
    isLowStock: true,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=100&q=80',
  },
  {
    sku: 'NM-PNT-03',
    name: 'Bơ Đậu Phộng Mịn Thuần Chay',
    category: 'Thuần chay / No Added Sugar',
    price: 120000,
    calo: 190,
    protein: 8,
    sugar: 0.8,
    stock: 310,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=100&q=80',
  },
  {
    sku: 'NM-RYE-04',
    name: 'Bánh Mì Đen Lúa Mạch Nguyên Cám',
    category: 'Low-Carb / Chất xơ cao',
    price: 55000,
    calo: 180,
    protein: 8,
    sugar: 1,
    stock: 58,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=100&q=80',
  },
  {
    sku: 'NM-KNJ-05',
    name: 'Mì Shirataki Konjac Ăn Kiêng',
    category: 'Zero-Calo / Keto Master',
    price: 32000,
    calo: 10,
    protein: 0,
    sugar: 0,
    stock: 190,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=100&q=80',
  },
  {
    sku: 'NM-BAR-06',
    name: 'Thanh Protein Bar Hạnh Nhân Socola',
    category: 'High-Protein / Gym Snack',
    price: 45000,
    calo: 210,
    protein: 20,
    sugar: 2,
    stock: 88,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1622484216858-a5b4819779df?auto=format&fit=crop&w=100&q=80',
  },
]);
</script>

<template>
  <div class="space-y-8">
    <!-- Header with Action Buttons (Figma 11) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Quản lý Sản phẩm & Kho hàng
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#576449] hover:bg-[#FAF9F5] shadow-2xs"
        >
          Schedule audit
        </button>
        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Plus class="w-4 h-4" />
          <span>Add new product</span>
        </button>
      </div>
    </div>

    <!-- 4 KPIs Cards (Figma 11) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng mã thực phẩm</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Package class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">48 SKU</div>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Sản phẩm sắp hết kho (&lt;20)</span>
          <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertTriangle class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-rose-600">04 món</div>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Gắn nhãn NutriBot gợi ý</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">42 món</div>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tỉ lệ hàng chuẩn Low-Carb</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <PieChart class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#4D6A34]">64.5%</div>
      </div>
    </div>

    <!-- Products Table & Filter Block (Figma 11) -->
    <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs p-6 space-y-6">
      <!-- Tabs -->
      <div class="flex items-center gap-3 border-b border-[#F0F3EC] pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          @click="activeTab = 'all'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'all' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Tất cả sản phẩm (48)
        </button>
        <button
          type="button"
          @click="activeTab = 'categories'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'categories' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Danh mục & Nhóm ăn kiêng (6)
        </button>
        <button
          type="button"
          @click="activeTab = 'warnings'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'warnings' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Cảnh báo tồn kho & Hạn dùng (4)
        </button>
      </div>

      <!-- Search & Filters Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm theo tên sản phẩm, SKU..."
              class="w-full pl-10 pr-3 py-2 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs text-[#2D3B1E] outline-none"
            />
          </div>

          <select class="px-3 py-2 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs text-[#2D3B1E] outline-none">
            <option>Tất cả danh mục</option>
            <option>Low-Carb & Keto</option>
            <option>High-Protein</option>
          </select>

          <select class="px-3 py-2 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs text-[#2D3B1E] outline-none">
            <option>Trạng thái: Tất cả</option>
            <option>Đang bán</option>
            <option>Hết hàng</option>
          </select>

          <button class="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#576449] hover:bg-[#F6F8F3]">
            ⚡ &lt; 150 kcal
          </button>
          <button class="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#576449] hover:bg-[#F6F8F3]">
            💪 Giàu Protein (&gt;15g)
          </button>
        </div>

        <button class="p-2 rounded-xl border border-[#DEE5D4] text-[#7A866E] hover:bg-[#FAF9F5]">
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
            <tr>
              <th class="py-3 px-3"><input type="checkbox" class="accent-[#4D6A34] rounded" /></th>
              <th class="py-3 px-3">Sản phẩm & Mã SKU</th>
              <th class="py-3 px-3">Chế độ & Danh mục</th>
              <th class="py-3 px-3">Giá bán (VNĐ)</th>
              <th class="py-3 px-3">Dinh dưỡng (Calo / Đạm / Đường)</th>
              <th class="py-3 px-3">Tồn kho</th>
              <th class="py-3 px-3">Trạng thái</th>
              <th class="py-3 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F0F3EC]">
            <tr v-for="item in products" :key="item.sku" class="hover:bg-[#FAF9F5]">
              <td class="py-3.5 px-3"><input type="checkbox" class="accent-[#4D6A34] rounded" /></td>
              <td class="py-3.5 px-3">
                <div class="flex items-center gap-2.5">
                  <img :src="item.image" alt="item" class="w-10 h-10 rounded-xl object-cover border border-[#E8ECE2]" />
                  <div>
                    <h4 class="font-bold text-[#2D3B1E]">{{ item.name }}</h4>
                    <span class="text-[10px] text-[#7A866E] font-mono">{{ item.sku }}</span>
                  </div>
                </div>
              </td>
              <td class="py-3.5 px-3">
                <span class="px-2 py-0.5 rounded-md bg-[#EBF1E6] text-[10px] font-semibold text-[#4D6A34]">
                  {{ item.category }}
                </span>
              </td>
              <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">
                {{ formatVnd(item.price) }}
              </td>
              <td class="py-3.5 px-3 text-[11px]">
                <span class="font-bold text-[#2D3B1E]">{{ item.calo }} kcal</span> •
                <span class="text-[#4D6A34] font-bold">{{ item.protein }}g Đạm</span> •
                <span>{{ item.sugar }}g Đường</span>
              </td>
              <td class="py-3.5 px-3">
                <span class="font-bold" :class="item.isLowStock ? 'text-rose-600' : 'text-[#2D3B1E]'">
                  {{ item.stock }}
                </span>
                <span v-if="item.isLowStock" class="text-[9px] text-rose-600 block font-bold">Sắp hết hàng</span>
              </td>
              <td class="py-3.5 px-3">
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                  ● {{ item.status }}
                </span>
              </td>
              <td class="py-3.5 px-3 text-right space-x-1">
                <button class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#2D3B1E] hover:bg-slate-100"><Eye class="w-3.5 h-3.5" /></button>
                <button class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#4D6A34] hover:bg-slate-100"><Edit class="w-3.5 h-3.5" /></button>
                <button class="p-1.5 rounded-lg text-[#7A866E] hover:text-rose-600 hover:bg-slate-100"><Trash2 class="w-3.5 h-3.5" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
