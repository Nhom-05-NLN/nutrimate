<script setup lang="ts">
import { ref } from 'vue';
import {
  Users,
  TrendingUp,
  Award,
  Bot,
  Search,
  Download,
  Mail,
  UserPlus,
  MessageSquare,
  FileText,
  Tag,
} from 'lucide-vue-next';

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const activeTab = ref('all');

const customers = ref([
  {
    name: 'Nguyễn Minh Anh',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    bmi: 21.5,
    metrics: 'Chiều cao: 165cm • Cân nặng: 58.5kg',
    goal: 'Giảm mỡ săn chắc (1.550 kcal/ngày)',
    totalSpent: 3450000,
    ordersCount: 7,
    lastAiChat: '15 phút trước - "Vừa hỏi NutriBot về combo xế..."',
  },
  {
    name: 'Hoàng Quốc Bảo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    bmi: 24.2,
    metrics: 'Chiều cao: 172cm • Cân nặng: 71.5kg',
    goal: 'Giảm mỡ nhanh, Low-Carb Keto',
    totalSpent: 8200000,
    ordersCount: 14,
    lastAiChat: 'Hôm qua lúc 19:30 - "Đã đặt lại giỏ thực đơn..."',
  },
  {
    name: 'Trần Thanh Tâm',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    bmi: 19.8,
    metrics: 'Chiều cao: 158cm • Cân nặng: 49.5kg',
    goal: 'Ăn Eat Clean duy trì vóc dáng',
    totalSpent: 1150000,
    ordersCount: 3,
    lastAiChat: '3 ngày trước - "Đã hoàn thành nhật ký..."',
  },
  {
    name: 'Lê Văn Thành',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    bmi: 26.8,
    metrics: 'Chiều cao: 168cm • Cân nặng: 75.5kg',
    goal: 'Giảm cân cấp tốc, kiểm soát đường huyết',
    totalSpent: 495000,
    ordersCount: 1,
    lastAiChat: '2 giờ trước - "Đang xem thực đơn nưa..."',
  },
]);
</script>

<template>
  <div class="space-y-8">
    <!-- Header with Action Buttons (Figma 13) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Quản lý khách hàng & Hồ sơ thể trạng
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button class="px-3.5 py-2 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#576449] flex items-center gap-1.5 shadow-2xs hover:bg-[#FAF9F5]">
          <Download class="w-3.5 h-3.5" />
          <span>Xuất tệp khách hàng</span>
        </button>
        <button class="px-3.5 py-2 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#576449] flex items-center gap-1.5 shadow-2xs hover:bg-[#FAF9F5]">
          <Mail class="w-3.5 h-3.5" />
          <span>Gửi thông báo dinh dưỡng</span>
        </button>
        <button class="px-3.5 py-2 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
          <UserPlus class="w-3.5 h-3.5" />
          <span>+ Thêm khách hàng</span>
        </button>
      </div>
    </div>

    <!-- 4 KPIs Cards (Figma 13) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng khách hàng</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">3.820 <span class="text-xs font-normal text-[#7A866E]">người</span></div>
        <span class="text-xs text-[#4D6A34] font-bold block">+340 khách mới trong tháng</span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đã thiết lập mục tiêu BMI</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <TrendingUp class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">2.598 <span class="text-xs font-bold text-[#4D6A34]">(68%)</span></div>
        <span class="text-[10px] text-[#7A866E] block">Đang theo dõi thâm hụt calo & ăn kiêng</span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Hội viên thân thiết (Gold/Plat)</span>
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Award class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-amber-700">840 <span class="text-xs font-normal text-[#7A866E]">người</span></div>
        <span class="text-[10px] text-[#7A866E] block">Đóng góp <strong>62%</strong> tổng doanh thu</span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tương tác NutriBot thường xuyên</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">1.945 <span class="text-xs font-normal text-[#7A866E]">người</span></div>
        <span class="text-xs text-[#4D6A34] font-bold block">Giữ chân khách 84% qua AI</span>
      </div>
    </div>

    <!-- Customers Table Block (Figma 13) -->
    <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs p-6 space-y-6">
      <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-[#F0F3EC]">
        <button
          type="button"
          @click="activeTab = 'all'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'all' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Tất cả khách hàng (3.820)
        </button>
        <button
          type="button"
          @click="activeTab = 'fatloss'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'fatloss' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Mục tiêu Giảm Mỡ Tăng Cơ (1.420)
        </button>
        <button
          type="button"
          @click="activeTab = 'keto'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'keto' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Ăn kiêng Low-Carb & Keto (980)
        </button>
        <button
          type="button"
          @click="activeTab = 'vegan'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          :class="activeTab === 'vegan' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Thuần chay & Organic (610)
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
            <tr>
              <th class="py-3 px-3">Khách hàng & Phân hạng</th>
              <th class="py-3 px-3">Chỉ số BMI & Thể trạng</th>
              <th class="py-3 px-3">Mục tiêu dinh dưỡng & Dị ứng</th>
              <th class="py-3 px-3">Tổng chi tiêu / Đơn</th>
              <th class="py-3 px-3">Tương tác & NutriBot</th>
              <th class="py-3 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F0F3EC]">
            <tr v-for="user in customers" :key="user.name" class="hover:bg-[#FAF9F5]">
              <td class="py-3.5 px-3">
                <div class="flex items-center gap-2.5">
                  <img :src="user.avatar" alt="ava" class="w-9 h-9 rounded-full object-cover border border-[#CCD7BC]" />
                  <span class="font-bold text-[#2D3B1E]">{{ user.name }}</span>
                </div>
              </td>
              <td class="py-3.5 px-3">
                <div class="font-bold text-[#2D3B1E]">BMI: {{ user.bmi }}</div>
                <span class="text-[10px] text-[#7A866E]">{{ user.metrics }}</span>
              </td>
              <td class="py-3.5 px-3">
                <span class="text-[#2D3B1E] font-medium block">{{ user.goal }}</span>
              </td>
              <td class="py-3.5 px-3">
                <span class="font-bold text-[#2D3B1E] block">{{ formatVnd(user.totalSpent) }}</span>
                <span class="text-[10px] text-[#7A866E]">{{ user.ordersCount }} đơn hoàn tất</span>
              </td>
              <td class="py-3.5 px-3 text-[11px] text-[#7A866E] max-w-[200px] truncate">
                {{ user.lastAiChat }}
              </td>
              <td class="py-3.5 px-3 text-right space-x-1">
                <button class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#4D6A34] hover:bg-slate-100"><FileText class="w-3.5 h-3.5" /></button>
                <button class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#4D6A34] hover:bg-slate-100"><Tag class="w-3.5 h-3.5" /></button>
                <button class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#4D6A34] hover:bg-slate-100"><MessageSquare class="w-3.5 h-3.5" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
