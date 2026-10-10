<script setup lang="ts">
import { ref } from 'vue';
import {
  ShoppingCart,
  Package,
  Truck,
  Bot,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
} from 'lucide-vue-next';

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const activeTab = ref('pending');

const orders = ref([
  {
    code: '#NM-98234',
    time: '10:15 - 24/10/2024',
    customer: 'Nguyễn Minh Anh',
    phone: '0912.345.xxx',
    products: 'Granola siêu hạt, Ức gà sấy, Bơ đậu...',
    macroTag: '⚡ 78g Protein • 2.450 kcal',
    total: 495000,
    shipping: 'Giao siêu tốc 2H (Túi giữ lạnh)',
    payment: 'VietQR Napas (Đã thanh toán)',
  },
  {
    code: '#NM-98235',
    time: '10:45 - 24/10/2024',
    customer: 'Trần Thanh Tâm',
    phone: '0988.123.xxx',
    products: 'Combo Eat Clean Giảm Mỡ 7 Ngày',
    macroTag: '⚡ 420g Protein • Kế hoạch 7 ngày',
    total: 850000,
    shipping: 'Giao tiêu chuẩn',
    payment: 'COD (Chưa thu tiền)',
  },
  {
    code: '#NM-98236',
    time: '11:00 - 24/10/2024',
    customer: 'Hoàng Quốc Bảo',
    phone: '0903.456.xxx',
    products: 'Bột đạm hạt bí hữu cơ x2, Mì Konjac x5',
    macroTag: 'Keto & Thuần chay • Ít tinh bột',
    total: 415000,
    shipping: 'Giao siêu tốc 2H (Túi giữ lạnh)',
    payment: 'MoMo (Đã thanh toán)',
  },
  {
    code: '#NM-97412',
    time: '14:20 - 15/10/2024',
    customer: 'Lê Thị Mai',
    phone: '0977.890.xxx',
    products: 'Bánh mì đen lúa mạch, Hạt điều rang...',
    macroTag: 'Giàu chất xơ & Khoáng chất',
    total: 220000,
    shipping: 'Giao tiêu chuẩn',
    payment: 'VietQR (Đã thanh toán)',
  },
]);
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
        Quản lý đơn hàng & Vận chuyển
      </h1>
    </div>

    <!-- 4 KPIs (Figma 12) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng đơn hôm nay</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <ShoppingCart class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">142 <span class="text-xs font-normal text-[#7A866E]">đơn</span></div>
        <span class="text-xs text-[#4D6A34] font-bold block">+12% so với hôm qua</span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Chờ xác nhận & đóng gói</span>
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Package class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-amber-700">18 <span class="text-xs font-normal text-[#7A866E]">đơn</span></div>
        <span class="text-[10px] text-rose-600 font-bold block">⚠️ 5 đơn đóng túi giữ lạnh 2H cần giao gấp</span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đang vận chuyển</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Truck class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">36 <span class="text-xs font-normal text-[#7A866E]">đơn</span></div>
        <span class="text-xs text-[#7A866E] block">Tỉ lệ giao thành công: <strong>98.2%</strong></span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đơn qua NutriBot AI</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">64 <span class="text-xs font-normal text-[#7A866E]">đơn</span></div>
        <span class="text-xs text-[#7A866E] block">Tư vấn Macros: <strong>45.1%</strong></span>
      </div>
    </div>

    <!-- Orders Filter Tabs & Table (Figma 12) -->
    <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs p-6 space-y-6">
      <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-[#F0F3EC]">
        <button
          type="button"
          @click="activeTab = 'all'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'all' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Tất cả (142)
        </button>
        <button
          type="button"
          @click="activeTab = 'pending'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'pending' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Chờ xác nhận (18)
        </button>
        <button
          type="button"
          @click="activeTab = 'packing'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'packing' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Đang đóng gói (12)
        </button>
        <button
          type="button"
          @click="activeTab = 'shipping'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'shipping' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Đang giao hàng (36)
        </button>
        <button
          type="button"
          @click="activeTab = 'delivered'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'delivered' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Giao thành công (72)
        </button>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
            <tr>
              <th class="py-3 px-3">Mã đơn & Thời gian</th>
              <th class="py-3 px-3">Khách hàng & SĐT</th>
              <th class="py-3 px-3">Thực phẩm chính & Macros tóm tắt</th>
              <th class="py-3 px-3">Tổng tiền</th>
              <th class="py-3 px-3">Vận chuyển & Thanh toán</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F0F3EC]">
            <tr v-for="order in orders" :key="order.code" class="hover:bg-[#FAF9F5]">
              <td class="py-3.5 px-3">
                <span class="font-bold text-[#2D3B1E] block">{{ order.code }}</span>
                <span class="text-[10px] text-[#7A866E]">{{ order.time }}</span>
              </td>
              <td class="py-3.5 px-3">
                <span class="font-bold text-[#2D3B1E] block">{{ order.customer }}</span>
                <span class="text-[10px] text-[#7A866E]">📞 {{ order.phone }}</span>
              </td>
              <td class="py-3.5 px-3">
                <span class="text-[#2D3B1E] font-medium block">{{ order.products }}</span>
                <span class="inline-block px-2 py-0.5 rounded-md bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34] mt-0.5">
                  {{ order.macroTag }}
                </span>
              </td>
              <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">
                {{ formatVnd(order.total) }}
              </td>
              <td class="py-3.5 px-3 text-[11px]">
                <span class="font-semibold text-[#2D3B1E] block">{{ order.shipping }}</span>
                <span class="text-[#4D6A34] text-[10px]">● {{ order.payment }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
