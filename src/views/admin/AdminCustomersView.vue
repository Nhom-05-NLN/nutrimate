<script setup lang="ts">
import { ref, computed } from 'vue';
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
  RotateCcw,
} from 'lucide-vue-next';

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const activeTab = ref('all');
const searchQuery = ref('');
const selectedTier = ref('all');
const selectedBmi = ref('all');
const selectedDiet = ref('all');

const customers = ref([
  {
    id: 'c1',
    name: 'Nguyễn Minh Anh',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    tier: 'Gold',
    bmi: 21.5,
    metrics: 'Chiều cao: 165cm • Cân nặng: 58.5kg',
    goal: 'Giảm mỡ săn chắc (1.550 kcal/ngày)',
    diet: 'low-carb',
    totalSpent: 3450000,
    ordersCount: 7,
    lastAiChat: '15 phút trước - "Vừa hỏi NutriBot về combo xế..."',
  },
  {
    id: 'c2',
    name: 'Hoàng Quốc Bảo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    tier: 'Platinum',
    bmi: 24.2,
    metrics: 'Chiều cao: 172cm • Cân nặng: 71.5kg',
    goal: 'Giảm mỡ nhanh, Low-Carb Keto',
    diet: 'keto',
    totalSpent: 8200000,
    ordersCount: 14,
    lastAiChat: 'Hôm qua lúc 19:30 - "Đã đặt lại giỏ thực đơn..."',
  },
  {
    id: 'c3',
    name: 'Trần Thanh Tâm',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    tier: 'Silver',
    bmi: 19.8,
    metrics: 'Chiều cao: 158cm • Cân nặng: 49.5kg',
    goal: 'Ăn Eat Clean duy trì vóc dáng',
    diet: 'clean',
    totalSpent: 1150000,
    ordersCount: 3,
    lastAiChat: '3 ngày trước - "Đã hoàn thành nhật ký..."',
  },
  {
    id: 'c4',
    name: 'Lê Văn Thành',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    tier: 'Silver',
    bmi: 26.8,
    metrics: 'Chiều cao: 168cm • Cân nặng: 75.5kg',
    goal: 'Giảm cân cấp tốc, kiểm soát đường huyết',
    diet: 'low-carb',
    totalSpent: 495000,
    ordersCount: 1,
    lastAiChat: '2 giờ trước - "Đang xem thực đơn nưa..."',
  },
]);

function handleResetFilter() {
  searchQuery.value = '';
  selectedTier.value = 'all';
  selectedBmi.value = 'all';
  selectedDiet.value = 'all';
  activeTab.value = 'all';
}

const filteredCustomers = computed(() => {
  return customers.value.filter((user) => {
    // Search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      if (!user.name.toLowerCase().includes(q) && !user.goal.toLowerCase().includes(q)) {
        return false;
      }
    }
    // Tier
    if (selectedTier.value !== 'all' && user.tier.toLowerCase() !== selectedTier.value.toLowerCase()) {
      return false;
    }
    // BMI
    if (selectedBmi.value === 'under-18' && user.bmi >= 18.5) return false;
    if (selectedBmi.value === 'normal' && (user.bmi < 18.5 || user.bmi > 22.9)) return false;
    if (selectedBmi.value === 'over-23' && user.bmi < 23) return false;
    // Diet
    if (selectedDiet.value !== 'all' && user.diet !== selectedDiet.value) {
      return false;
    }
    return true;
  });
});
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
        <button class="px-4 py-2.5 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#576449] flex items-center gap-1.5 shadow-2xs hover:bg-[#FAF9F5] cursor-pointer">
          <Download class="w-3.5 h-3.5" />
          <span>Xuất tệp khách hàng (CSV/Excel)</span>
        </button>
        <button class="px-4 py-2.5 rounded-2xl bg-[#CCD7BC] hover:bg-[#BFCBB0] text-xs font-bold text-[#2D3B1E] flex items-center gap-1.5 shadow-2xs cursor-pointer">
          <Mail class="w-3.5 h-3.5" />
          <span>Gửi thông báo dinh dưỡng hàng loạt</span>
        </button>
        <button class="px-4 py-2.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
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
          <span>Hội viên thân thiết (Gold/Platinum)</span>
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
      <!-- 1. Category Filter Pills Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-[#F0F3EC]">
        <button
          type="button"
          @click="activeTab = 'all'"
          class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
          :class="activeTab === 'all' ? 'bg-[#536124] text-white shadow-xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          👥 Tất cả khách hàng (3.820)
        </button>
        <button
          type="button"
          @click="activeTab = 'fatloss'"
          class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
          :class="activeTab === 'fatloss' ? 'bg-[#536124] text-white shadow-xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          ↗ Mục tiêu Giảm Mỡ Tăng Cơ (1.420)
        </button>
        <button
          type="button"
          @click="activeTab = 'keto'"
          class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
          :class="activeTab === 'keto' ? 'bg-[#536124] text-white shadow-xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          🥗 Ăn kiêng Low-Carb & Keto (980)
        </button>
        <button
          type="button"
          @click="activeTab = 'vegan'"
          class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
          :class="activeTab === 'vegan' ? 'bg-[#536124] text-white shadow-xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          🌱 Thuần chay & Organic (610)
        </button>
      </div>

      <!-- 2. Search Bar & Dropdown Filters Bar (Chuẩn Figma 13) -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <!-- Input Tìm kiếm -->
          <div class="relative w-full sm:w-72 lg:w-80">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm theo tên, số điện thoại, email..."
              class="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs text-[#2D3B1E] placeholder-[#8C9882] focus:bg-white focus:border-[#536124] outline-none transition-colors"
            />
          </div>

          <!-- Dropdown Phân hạng -->
          <select
            v-model="selectedTier"
            class="px-4 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#536124] outline-none cursor-pointer"
          >
            <option value="all">Phân hạng: Tất cả hạng thành viên</option>
            <option value="gold">Hạng Vàng (Gold)</option>
            <option value="platinum">Hạng Bạch Kim (Platinum)</option>
            <option value="silver">Hạng Bạc (Silver)</option>
          </select>

          <!-- Dropdown Chỉ số BMI -->
          <select
            v-model="selectedBmi"
            class="px-4 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#536124] outline-none cursor-pointer"
          >
            <option value="all">Chỉ số BMI: Tất cả</option>
            <option value="normal">Cân đối (18.5 - 22.9)</option>
            <option value="over-23">Thừa cân / Béo phì (≥ 23.0)</option>
            <option value="under-18">Thiếu cân (&lt; 18.5)</option>
          </select>

          <!-- Dropdown Chế độ ăn -->
          <select
            v-model="selectedDiet"
            class="px-4 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#536124] outline-none cursor-pointer"
          >
            <option value="all">Chế độ ăn: Tất cả</option>
            <option value="low-carb">Low-Carb</option>
            <option value="keto">Keto</option>
            <option value="clean">Eat Clean</option>
          </select>
        </div>

        <!-- Nút Reset Filter -->
        <button
          type="button"
          @click="handleResetFilter"
          title="Đặt lại bộ lọc"
          class="p-2.5 rounded-2xl border border-[#DEE5D4] bg-[#FAF9F5] text-[#7A866E] hover:text-[#2D3B1E] hover:bg-white transition-colors cursor-pointer"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>

      <!-- 3. Bảng Dữ Liệu Khách Hàng -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
            <tr>
              <th class="py-3 px-3"><input type="checkbox" class="accent-[#536124] rounded" /></th>
              <th class="py-3 px-3">Khách hàng & Phân hạng</th>
              <th class="py-3 px-3">Chỉ số BMI & Thể trạng</th>
              <th class="py-3 px-3">Mục tiêu dinh dưỡng & Dị ứng</th>
              <th class="py-3 px-3">Tổng chi tiêu / Đơn</th>
              <th class="py-3 px-3">Tương tác & NutriBot</th>
              <th class="py-3 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F0F3EC]">
            <tr v-for="user in filteredCustomers" :key="user.id" class="hover:bg-[#FAF9F5]">
              <td class="py-4 px-3"><input type="checkbox" class="accent-[#536124] rounded" /></td>
              <td class="py-4 px-3">
                <div class="flex items-center gap-3">
                  <img :src="user.avatar" alt="ava" class="w-10 h-10 rounded-full object-cover border border-[#CCD7BC]" />
                  <div>
                    <span class="font-bold text-sm text-[#2D3B1E] block">{{ user.name }}</span>
                    <span class="text-[10px] text-[#536124] font-semibold">{{ user.tier }} Member</span>
                  </div>
                </div>
              </td>
              <td class="py-4 px-3">
                <div class="font-bold text-sm text-[#2D3B1E]">BMI: {{ user.bmi }}</div>
                <span class="text-[11px] text-[#7A866E]">{{ user.metrics }}</span>
              </td>
              <td class="py-4 px-3">
                <span class="text-[#2D3B1E] font-medium text-xs block">{{ user.goal }}</span>
              </td>
              <td class="py-4 px-3">
                <span class="font-bold text-sm text-[#2D3B1E] block">{{ formatVnd(user.totalSpent) }}</span>
                <span class="text-[11px] text-[#7A866E]">{{ user.ordersCount }} đơn hoàn tất</span>
              </td>
              <td class="py-4 px-3 text-xs text-[#7A866E] max-w-[220px]">
                <span class="inline-block px-2 py-0.5 rounded-md bg-[#EBF7E5] text-[10px] font-semibold text-[#536124] mb-1">● Hoạt động</span>
                <p class="truncate text-[11px]">{{ user.lastAiChat }}</p>
              </td>
              <td class="py-4 px-3 text-right space-x-1.5">
                <button class="p-2 rounded-xl text-[#7A866E] hover:text-[#536124] hover:bg-slate-100 transition-colors" title="Xem hồ sơ">
                  <FileText class="w-4 h-4" />
                </button>
                <button class="p-2 rounded-xl text-[#7A866E] hover:text-[#536124] hover:bg-slate-100 transition-colors" title="Gắn nhãn">
                  <Tag class="w-4 h-4" />
                </button>
                <button class="p-2 rounded-xl text-[#7A866E] hover:text-[#536124] hover:bg-slate-100 transition-colors" title="Nhắn tin">
                  <MessageSquare class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. Pagination Phân Trang (Figma 13) -->
      <div class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#F0F3EC] text-xs text-[#7A866E]">
        <span>Hiển thị <strong>1 - {{ filteredCustomers.length }}</strong> trong tổng số <strong>3.820</strong> hồ sơ khách hàng dinh dưỡng</span>

        <div class="flex items-center gap-1 font-bold">
          <span class="mr-2 text-[#7A866E] font-medium">Trang 1 / 955</span>
          <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5] text-[#7A866E]">‹</button>
          <button class="w-8 h-8 rounded-xl bg-[#536124] text-white flex items-center justify-center">1</button>
          <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5]">2</button>
          <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5]">3</button>
          <span class="px-1.5 text-[#7A866E]">...</span>
          <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5]">955</button>
          <button class="w-8 h-8 rounded-xl border border-[#CCD7BC] flex items-center justify-center hover:bg-[#FAF9F5] text-[#7A866E]">›</button>
        </div>
      </div>
    </div>
  </div>
</template>
