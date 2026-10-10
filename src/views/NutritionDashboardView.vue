<script setup lang="ts">
import { ref } from 'vue';
import { useCartStore } from '../stores/cartStore';
import { useChatStore } from '../stores/chatStore';
import { useToastStore } from '../stores/toastStore';
import {
  ChevronRight,
  Calendar,
  Camera,
  Plus,
  Bot,
  Sparkles,
  CheckCircle2,
  Upload,
  ShoppingBag,
  FileText,
  Scan,
  Flame,
  PieChart,
  Bell,
  Check,
} from 'lucide-vue-next';

const cartStore = useCartStore();
const chatStore = useChatStore();
const toastStore = useToastStore();

const waterCurrentMl = ref(1650);
const waterTargetMl = 2200;
// 8 glasses: 6 drank (250ml each), 2 remaining (250ml, 200ml)
const waterGlasses = ref([
  { ml: '250ml', drank: true },
  { ml: '250ml', drank: true },
  { ml: '250ml', drank: true },
  { ml: '250ml', drank: true },
  { ml: '250ml', drank: true },
  { ml: '250ml', drank: true },
  { ml: '250ml', drank: false },
  { ml: '200ml', drank: false },
]);

function addWater(amount: number) {
  waterCurrentMl.value = Math.min(waterTargetMl, waterCurrentMl.value + amount);
  // Cập nhật trạng thái các ly
  if (waterCurrentMl.value >= 1900) {
    waterGlasses.value[6].drank = true;
  }
  if (waterCurrentMl.value >= 2100) {
    waterGlasses.value[7].drank = true;
  }
  toastStore.show(`Đã ghi nhận +${amount}ml nước`, 'success', `Tổng lượng nước hôm nay: ${waterCurrentMl.value}ml / ${waterTargetMl}ml`);
}

function toggleGlass(index: number) {
  waterGlasses.value[index].drank = !waterGlasses.value[index].drank;
  const count = waterGlasses.value.filter((g) => g.drank).length;
  waterCurrentMl.value = Math.min(waterTargetMl, count * 275);
}

const isScanningModalOpen = ref(false);

function handleScanSimulate() {
  isScanningModalOpen.value = true;
  setTimeout(() => {
    toastStore.show('NutriVision AI đã trích xuất thành công!', 'success', '190 kcal • 16.5g Protein • 3.2g Fat • 22.0g Carbs');
  }, 600);
}

function handleAddDeficitProduct(name: string, price: number, protein: number, image: string) {
  cartStore.addItem(
    {
      id: `deficit-${Date.now()}`,
      code: 'NM-DEFICIT',
      name,
      category: 'high-protein',
      categoryName: 'Bổ sung thiếu hụt',
      price,
      image,
      description: 'Sản phẩm bổ sung lượng đạm thiếu hụt trong ngày theo khuyến nghị của NutriBot AI.',
      ingredients: ['Thành phần dinh dưỡng tự nhiên'],
      nutrition: {
        servingSize: '1 khẩu phần',
        calories: 130,
        protein,
        carbs: 2,
        fat: 1,
        sugar: 0,
      },
      stock: 50,
      rating: 5.0,
      reviewCount: 48,
      badges: [`+${protein}g Protein`],
      bestFor: 'Bổ sung thiếu hụt macro',
    },
    1
  );
}
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <!-- Breadcrumb (Figma 08) -->
    <nav class="flex items-center gap-1.5 text-xs text-[#7A866E]">
      <RouterLink to="/" class="hover:text-[#242424]">Trang chủ</RouterLink>
      <span>›</span>
      <RouterLink to="/profile" class="hover:text-[#242424]">Thành viên NutriMate</RouterLink>
      <span>›</span>
      <span class="text-[#242424] font-bold">Nhật ký & Bảng điều khiển Dinh dưỡng</span>
    </nav>

    <!-- Header Actions Bar (Figma 08 Layout Exact) -->
    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
      <div class="space-y-1">
        <h1 class="font-heading text-3xl sm:text-4xl font-black text-[#242424] tracking-tight">
          Bảng điều khiển Dinh dưỡng & Calo
        </h1>
        <p class="text-xs sm:text-sm text-[#68725F] max-w-2xl leading-relaxed">
          Theo dõi năng lượng nạp vào, phân bổ Macros và nhật ký ăn uống hôm nay theo khuyến nghị của NutriBot AI.
        </p>
      </div>

      <!-- Right Action Buttons (2 Rows exactly as Figma 08) -->
      <div class="flex flex-col items-start lg:items-end gap-2.5 shrink-0">
        <!-- Hàng 1: Nút chọn ngày & Nút Thêm món ăn -->
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="px-4 py-2 rounded-full bg-white border border-[#D5DFC8] text-xs font-bold text-[#242424] flex items-center gap-2 shadow-2xs hover:bg-[#FAF9F5] cursor-pointer"
          >
            <span>‹</span>
            <Calendar class="w-3.5 h-3.5 text-[#536124]" />
            <span>Hôm nay, 24 Tháng 10, 2024</span>
            <span>›</span>
          </button>

          <button
            type="button"
            class="px-4 py-2 rounded-full bg-[#CCD7BC] hover:bg-[#BFCBB0] text-[#2D3B1E] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm món ăn hôm nay</span>
          </button>
        </div>

        <!-- Hàng 2: Nút Quét nhãn dinh dưỡng (Scan AI) -->
        <button
          type="button"
          @click="handleScanSimulate"
          class="px-5 py-2.5 rounded-full bg-[#536124] hover:bg-[#434F1D] active:bg-[#353E17] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Scan class="w-4 h-4" />
          <span>Quét nhãn dinh dưỡng (Scan AI)</span>
        </button>
      </div>
    </div>

    <!-- Top 3 Metric Cards (Figma 08) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <!-- 1. Mục tiêu Calo Hôm Nay -->
      <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-6">
        <div>
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-2xl bg-[#EBF7E5] text-[#536124] flex items-center justify-center">
                <Flame class="w-5 h-5 fill-[#536124]/20 text-[#536124]" />
              </div>
              <div>
                <h3 class="font-heading text-sm font-bold text-[#242424]">Mục tiêu Calo Hôm Nay</h3>
                <span class="text-[11px] text-[#7A866E]">Kế hoạch giảm mỡ khoa học</span>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full bg-white border border-[#D5DFC8] text-[11px] font-bold text-[#536124]">
              Thâm hụt an toàn
            </span>
          </div>

          <div class="flex items-center justify-between gap-6 py-6 px-2">
            <!-- Donut Graphic Circular Gauge -->
            <div class="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <!-- Vòng nền -->
                <path
                  class="text-[#EBF1E6]"
                  stroke-width="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <!-- Vòng tiến độ -->
                <path
                  class="text-[#536124]"
                  stroke-dasharray="72, 100"
                  stroke-width="3.8"
                  stroke-linecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="absolute flex flex-col items-center justify-center text-center">
                <span class="text-[11px] text-[#7A866E] font-medium leading-none">Còn lại</span>
                <span class="font-heading text-2xl font-black text-[#242424] leading-tight mt-0.5">710</span>
                <span class="text-[10px] text-[#7A866E] font-bold leading-none">kcal</span>
              </div>
            </div>

            <!-- Cột thông số Calo bên phải -->
            <div class="space-y-2.5 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#7A866E]"></span>
                <span class="text-[#7A866E]">Mục tiêu ngày:</span>
                <span class="font-bold text-[#242424]">1.550 kcal</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#536124]"></span>
                <span class="text-[#7A866E]">Đã nạp vào:</span>
                <span class="font-bold text-[#242424]">1.120 kcal</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#C5281C]"></span>
                <span class="text-[#7A866E]">Đốt cháy vận động:</span>
                <span class="font-bold text-[#C5281C]">-280 kcal</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hộp Đánh giá nhanh dưới đáy -->
        <div class="p-3.5 rounded-2xl bg-[#EBF7E5] border border-[#CCD7BC] text-xs text-[#2D3B1E] flex items-center gap-2">
          <span class="text-sm">🍃</span>
          <span><strong>Đánh giá nhanh:</strong> Đang duy trì thâm hụt calo hoàn hảo cho mục tiêu Giảm Mỡ Tăng Cơ!</span>
        </div>
      </div>

      <!-- 2. Phân bổ Macros -->
      <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-6">
        <div>
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-2xl bg-[#EBF7E5] text-[#536124] flex items-center justify-center">
                <PieChart class="w-5 h-5 text-[#536124]" />
              </div>
              <h3 class="font-heading text-sm font-bold text-[#242424]">Phân bổ Macros</h3>
            </div>
            <span class="text-xs text-[#7A866E]">Đã nạp 3 bữa</span>
          </div>

          <p class="text-xs text-[#68725F] pt-3 leading-relaxed">
            Cân bằng đa lượng giúp duy trì cơ bắp & sự tỉnh táo.
          </p>

          <!-- 4 Thanh tiến độ Macro (Đúng màu Figma 08) -->
          <div class="space-y-4 pt-4 text-xs">
            <!-- Đạm -->
            <div>
              <div class="flex justify-between text-xs mb-1.5 font-bold">
                <span class="text-[#242424]">■ Đạm (Protein)</span>
                <span class="text-[#242424]">68g <span class="text-[#7A866E] font-normal">/ 80g (85%)</span></span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-[#F0F4EA] overflow-hidden">
                <div class="h-full bg-[#536124] rounded-full" style="width: 85%"></div>
              </div>
            </div>

            <!-- Carbs -->
            <div>
              <div class="flex justify-between text-xs mb-1.5 font-bold">
                <span class="text-[#242424]">■ Tinh bột tốt (Carbs)</span>
                <span class="text-[#242424]">105g <span class="text-[#7A866E] font-normal">/ 150g (70%)</span></span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-[#F0F4EA] overflow-hidden">
                <div class="h-full bg-[#A38038] rounded-full" style="width: 70%"></div>
              </div>
            </div>

            <!-- Fat -->
            <div>
              <div class="flex justify-between text-xs mb-1.5 font-bold">
                <span class="text-[#242424]">■ Chất béo tốt (Fat)</span>
                <span class="text-[#242424]">32g <span class="text-[#7A866E] font-normal">/ 45g (71%)</span></span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-[#F0F4EA] overflow-hidden">
                <div class="h-full bg-[#C2672B] rounded-full" style="width: 71%"></div>
              </div>
            </div>

            <!-- Sugar -->
            <div>
              <div class="flex justify-between text-xs mb-1.5 font-bold">
                <span class="text-[#242424]">■ Lượng đường nạp (Sugar)</span>
                <span class="text-[#242424]">14g <span class="text-[#7A866E] font-normal">/ tối đa 25g (56%)</span></span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-[#F0F4EA] overflow-hidden">
                <div class="h-full bg-[#4A729A] rounded-full" style="width: 56%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between text-xs pt-3 border-t border-[#F0F3EC]">
          <span class="text-[#536124] font-bold flex items-center gap-1">
            <Check class="w-3.5 h-3.5 stroke-[2.5]" /> Đạt chuẩn ít đường
          </span>
          <span class="text-[#68725F]">Thiếu: <strong>12g Đạm</strong></span>
        </div>
      </div>

      <!-- 3. Theo dõi Nước -->
      <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-6">
        <div>
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-2xl bg-[#EBF7E5] text-[#536124] flex items-center justify-center">
                <span class="text-base">💧</span>
              </div>
              <h3 class="font-heading text-sm font-bold text-[#242424]">Theo dõi Nước</h3>
            </div>
            <span class="text-xs font-bold text-[#242424]">75%</span>
          </div>

          <div class="pt-3">
            <span class="font-heading text-3xl font-black text-[#242424]">
              {{ waterCurrentMl.toLocaleString('vi-VN') }} <span class="text-sm font-normal text-[#7A866E]">/ {{ waterTargetMl.toLocaleString('vi-VN') }} ml</span>
            </span>
          </div>

          <!-- 8 Ly nước dạng cốc có vạch (Figma 08) -->
          <div class="grid grid-cols-4 gap-2.5 pt-4">
            <button
              v-for="(glass, idx) in waterGlasses"
              :key="idx"
              type="button"
              @click="toggleGlass(idx)"
              class="p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              :class="
                glass.drank
                  ? 'bg-[#EBF7E5] border-[#CCD7BC] text-[#536124]'
                  : 'bg-[#FAF9F5] border-[#E3E8DC] text-[#A2AC99] hover:border-[#CCD7BC]'
              "
            >
              <!-- Icon Cốc Nước Đo Lường (Glass with measurement lines) -->
              <div
                class="w-7 h-8 rounded-b-md border-2 relative flex flex-col justify-end p-0.5 overflow-hidden"
                :class="glass.drank ? 'border-[#536124] bg-[#536124]/10' : 'border-[#CCD7BC] bg-white'"
              >
                <!-- Nước đầy -->
                <div v-if="glass.drank" class="w-full h-5 bg-[#536124]/60 rounded-b-xs"></div>
                <!-- Vạch đo -->
                <div class="absolute top-1 left-0.5 right-0.5 h-0.5 bg-black/15"></div>
                <div class="absolute top-2.5 left-0.5 right-0.5 h-0.5 bg-black/15"></div>
              </div>
              <span class="text-[10px] font-bold block">{{ glass.ml }}</span>
            </button>
          </div>
        </div>

        <!-- 2 Nút thêm nước & Hộp nhắc nhở -->
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="addWater(250)"
              class="py-2.5 rounded-xl bg-[#CCD7BC] hover:bg-[#BFCBB0] text-[#2D3B1E] text-xs font-bold transition-colors cursor-pointer"
            >
              + 250ml
            </button>
            <button
              type="button"
              @click="addWater(500)"
              class="py-2.5 rounded-xl bg-[#CCD7BC] hover:bg-[#BFCBB0] text-[#2D3B1E] text-xs font-bold transition-colors cursor-pointer"
            >
              + 500ml
            </button>
          </div>

          <div class="p-3 rounded-2xl bg-[#EBF7E5] text-xs text-[#2D3B1E] flex items-center gap-2">
            <Bell class="w-4 h-4 text-[#536124] shrink-0" />
            <span>Nhắc nhở: Uống thêm 1 ly trước 16h00!</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Nhật Ký 4 Bữa Ăn Trong Ngày (Figma 08) -->
    <div class="space-y-6 pt-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
            Nhật ký 4 Bữa Ăn Trong Ngày
          </h2>
          <p class="text-xs sm:text-sm text-[#7A866E] mt-1">
            Chi tiết thành phần, chỉ số calo và đạm cho từng món ăn nạp vào hôm nay.
          </p>
        </div>
        <button type="button" class="text-xs sm:text-sm font-bold text-[#536124] hover:underline flex items-center gap-1 cursor-pointer">
          <span>Xem báo cáo tuần</span>
          <span>→</span>
        </button>
      </div>

      <!-- 4 Cards Bữa Ăn (3 thẻ trắng, Thẻ thứ 4 có nền Xanh Mint Nhạt #EBF7E5 như Figma 08) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- 1. Bữa Sáng -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-start justify-between border-b border-[#F0F3EC] pb-3.5">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#242424] flex items-center gap-1.5">
                  🥣 Bữa Sáng
                </h4>
                <span class="text-[11px] text-[#7A866E] block mt-0.5">Đã hoàn thành lúc 07:30</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-[#242424] block">380 kcal</span>
                <span class="text-[11px] text-[#7A866E]">22g Protein</span>
              </div>
            </div>

            <!-- Danh sách món -->
            <div class="space-y-2.5 text-xs">
              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between gap-2">
                <div>
                  <span class="font-bold text-[#242424] block">Granola Yến Mạch NutriMate (40g)</span>
                  <span class="text-[11px] text-[#7A866E] mt-0.5 block">152 kcal • 14g Đạm</span>
                </div>
                <div class="w-4 h-4 rounded-full border border-[#536124] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between gap-2">
                <div>
                  <span class="font-bold text-[#242424] block">Sữa chua Hy Lạp không đường (100g)</span>
                  <span class="text-[11px] text-[#7A866E] mt-0.5 block">98 kcal • 10g Đạm</span>
                </div>
                <div class="w-4 h-4 rounded-full border border-[#536124] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between gap-2">
                <div>
                  <span class="font-bold text-[#242424] block">Nửa quả táo xanh và hạt chia</span>
                  <span class="text-[11px] text-[#7A866E] mt-0.5 block">130 kcal • 2g Đạm</span>
                </div>
                <div class="w-4 h-4 rounded-full border border-[#536124] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between text-xs text-[#536124]">
            <button class="hover:underline flex items-center gap-1 cursor-pointer">
              <FileText class="w-3.5 h-3.5" />
              <span>Xem nhãn Nutrition</span>
            </button>
            <button class="font-bold hover:underline cursor-pointer">+ Thêm món</button>
          </div>
        </div>

        <!-- 2. Bữa Trưa -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-start justify-between border-b border-[#F0F3EC] pb-3.5">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#242424] flex items-center gap-1.5">
                  ☀️ Bữa Trưa
                </h4>
                <span class="text-[11px] text-[#7A866E] block mt-0.5">Đã hoàn thành lúc 12:15</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-[#242424] block">450 kcal</span>
                <span class="text-[11px] text-[#7A866E]">32g Protein</span>
              </div>
            </div>

            <!-- Danh sách món -->
            <div class="space-y-2.5 text-xs">
              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between gap-2">
                <div>
                  <span class="font-bold text-[#242424] block">Ức gà sấy giòn thảo mộc NutriMate (100g)</span>
                  <span class="text-[11px] text-[#7A866E] mt-0.5 block">220 kcal • 28g Đạm</span>
                </div>
                <div class="w-4 h-4 rounded-full border border-[#536124] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between gap-2">
                <div>
                  <span class="font-bold text-[#242424] block">Khoai lang luộc & Rau củ sốt mè</span>
                  <span class="text-[11px] text-[#7A866E] mt-0.5 block">230 kcal • 4g Đạm</span>
                </div>
                <div class="w-4 h-4 rounded-full border border-[#536124] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between text-xs text-[#536124]">
            <button class="hover:underline flex items-center gap-1 cursor-pointer">
              <FileText class="w-3.5 h-3.5" />
              <span>Xem nhãn Nutrition</span>
            </button>
            <button class="font-bold hover:underline cursor-pointer">+ Thêm món</button>
          </div>
        </div>

        <!-- 3. Bữa Xế / Snack -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-start justify-between border-b border-[#F0F3EC] pb-3.5">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#242424] flex items-center gap-1.5">
                  🕒 Bữa Xế / Snack
                </h4>
                <span class="text-[11px] text-[#7A866E] block mt-0.5">Đã nạp lúc 15:30</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-[#242424] block">150 kcal</span>
                <span class="text-[11px] text-[#7A866E]">8g Protein</span>
              </div>
            </div>

            <!-- Danh sách món -->
            <div class="space-y-2.5 text-xs">
              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between gap-2">
                <div>
                  <span class="font-bold text-[#242424] block">Protein Bar sô-cô-la đen (1/2 thanh)</span>
                  <span class="text-[11px] text-[#7A866E] mt-0.5 block">110 kcal • 7.5g Đạm</span>
                </div>
                <div class="w-4 h-4 rounded-full border border-[#536124] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between gap-2">
                <div>
                  <span class="font-bold text-[#242424] block">Trà xanh không đường</span>
                  <span class="text-[11px] text-[#7A866E] mt-0.5 block">0 kcal • 0g Đạm</span>
                </div>
                <div class="w-4 h-4 rounded-full border border-[#536124] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between text-xs text-[#536124]">
            <button class="hover:underline flex items-center gap-1 cursor-pointer">
              <FileText class="w-3.5 h-3.5" />
              <span>Xem nhãn Nutrition</span>
            </button>
            <button class="font-bold hover:underline cursor-pointer">+ Thêm món</button>
          </div>
        </div>

        <!-- 4. Bữa Tối (Đặc biệt: Nền Xanh Mint #EDF4E7 như Figma 08) -->
        <div class="bg-[#EDF4E7] p-6 rounded-3xl border border-[#CCD7BC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-start justify-between border-b border-[#CCD7BC] pb-3.5">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#242424] flex items-center gap-1.5">
                  🌙 Bữa Tối
                </h4>
                <span class="text-[11px] text-[#7A866E] block mt-0.5">Dự kiến khoảng 19:00</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-[#242424] block">340 kcal</span>
                <span class="text-[11px] text-[#7A866E]">20g Protein</span>
              </div>
            </div>

            <!-- Lời gợi ý AI trên thẻ trắng bên trong -->
            <div class="p-4 rounded-2xl bg-white border border-[#D5DFC8] text-xs space-y-2 shadow-2xs">
              <div class="flex items-center gap-1.5 font-bold text-[#536124]">
                <span>🎁</span>
                <span>Gợi ý từ NutriBot:</span>
              </div>
              <p class="text-[#3E4A2E] leading-relaxed italic">
                "Salad cá hồi hoặc Salad ức gà với mì Konjac ít calo để tối ưu hóa việc đốt mỡ ban đêm."
              </p>
              <span class="text-[11px] text-[#7A866E] block">Chưa ghi nhận món ăn thực tế.</span>
            </div>
          </div>

          <!-- Nút NutriBot gợi ý món tối phù hợp (xanh rêu) -->
          <button
            type="button"
            @click="chatStore.openChat()"
            class="w-full py-3 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>NutriBot gợi ý món tối phù hợp</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Section: Quét Nhãn Dinh Dưỡng Thông Minh Bằng Camera (Nền Mint Nhạt #EDF4E7 Chuẩn Figma 08) -->
    <div class="p-8 sm:p-12 rounded-4xl bg-[#EDF4E7] border border-[#CCD7BC] shadow-xs">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <!-- Cột Trái -->
        <div class="lg:col-span-7 space-y-5">
          <span class="inline-block text-xs font-bold text-[#536124] bg-white px-3.5 py-1.5 rounded-full border border-[#CCD7BC]">
            📷 Công nghệ Trí tuệ Nhân tạo NutriVision
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#242424]">
            Quét nhãn dinh dưỡng thông minh bằng Camera
          </h2>
          <p class="text-xs sm:text-sm text-[#576449] leading-relaxed max-w-xl">
            Chụp ảnh bảng thành phần dinh dưỡng phía sau bất kỳ bao bì thực phẩm nào, NutriBot sẽ tự động trích xuất Calo, Đạm, Đường và đồng bộ ngay vào Nhật ký dinh dưỡng của bạn mà không cần nhập thủ công.
          </p>

          <div class="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              @click="handleScanSimulate"
              class="px-6 py-3.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Camera class="w-4.5 h-4.5" />
              <span>Mở máy quét ngay</span>
            </button>
            <button
              type="button"
              @click="handleScanSimulate"
              class="px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FAF9F5] text-[#242424] text-xs sm:text-sm font-bold border border-[#CCD7BC] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload class="w-4.5 h-4.5 text-[#7A866E]" />
              <span>Tải ảnh nhãn có sẵn</span>
            </button>
          </div>
        </div>

        <!-- Cột Phải: Mockup Kết quả quét nhãn thẻ trắng viền nét đứt (Figma 08) -->
        <div class="lg:col-span-5">
          <div class="p-7 rounded-3xl bg-white border-2 border-dashed border-[#536124] space-y-5 text-xs shadow-md">
            <!-- Icon Scanner Mã Vạch Ở Đầu -->
            <div class="flex justify-center text-[#536124]">
              <Scan class="w-8 h-8" />
            </div>

            <div class="text-center font-bold text-sm text-[#242424] uppercase tracking-wider">
              Nutrition Facts AI
            </div>

            <div class="space-y-2.5 text-xs sm:text-sm border-t border-b border-[#F0F3EC] py-3">
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Calories:</span>
                <span class="font-bold text-[#242424]">190 kcal</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Protein:</span>
                <span class="font-bold text-[#242424]">16.5g</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Total Fat:</span>
                <span class="font-bold text-[#242424]">3.2g</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Carbohydrates:</span>
                <span class="font-bold text-[#242424]">22.0g</span>
              </div>
            </div>

            <div class="text-center text-xs font-bold text-[#536124]">
              ✓ Đã nhận diện 100%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Gợi Ý Thực Phẩm Bổ Sung Thiếu Hụt (Figma 08) -->
    <div class="space-y-6 pt-2">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-heading text-2xl font-black text-[#242424] flex items-center gap-2">
            <span>🌱</span> Gợi ý Thực phẩm Bổ sung Thiếu hụt
          </h2>
          <p class="text-xs sm:text-sm text-[#7A866E] mt-1">
            Hôm nay bạn còn thiếu <strong>12g Protein</strong> để đạt mốc 80g mục tiêu. Dưới đây là các lựa chọn tiện lợi từ cửa hàng NutriMate:
          </p>
        </div>
        <RouterLink to="/catalog" class="text-xs sm:text-sm font-bold text-[#536124] hover:underline">
          Xem tất cả thực phẩm sạch &gt;
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Item 1: Bột đạm hạt bí -->
        <div class="p-6 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#536124] transition-all flex items-center gap-5 shadow-2xs">
          <img
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=180&q=80"
            alt="bot-dam"
            class="w-24 h-24 rounded-2xl object-cover shrink-0"
          />
          <div class="flex-1 min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold text-[#2D3B1E] bg-[#CCD7BC] px-3 py-0.5 rounded-full">
                Bổ sung 15g Protein
              </span>
              <span class="text-xs font-medium text-[#7A866E] bg-[#F5F4EE] px-2.5 py-0.5 rounded-full">
                Thuần chay Organic
              </span>
            </div>
            <h4 class="font-heading text-base font-bold text-[#242424] truncate">Bột đạm hạt bí hữu cơ NutriMate</h4>
            <p class="text-xs text-[#7A866E]">Dễ pha với sữa hạt chua hoặc sinh tố, không gây đầy bụng.</p>
            <div class="pt-2 flex items-center justify-between">
              <span class="font-heading font-black text-base text-[#242424]">120.000 đ</span>
              <button
                type="button"
                @click="handleAddDeficitProduct('Bột đạm hạt bí hữu cơ NutriMate', 120000, 15, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=180&q=80')"
                class="px-4 py-2 rounded-xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag class="w-3.5 h-3.5" />
                <span>+ Thêm vào giỏ</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Item 2: Snack Ức gà sấy giòn thảo mộc -->
        <div class="p-6 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#536124] transition-all flex items-center gap-5 shadow-2xs">
          <img
            src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=180&q=80"
            alt="snack-uc-ga"
            class="w-24 h-24 rounded-2xl object-cover shrink-0"
          />
          <div class="flex-1 min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold text-[#2D3B1E] bg-[#CCD7BC] px-3 py-0.5 rounded-full">
                Bổ sung 20g Protein
              </span>
              <span class="text-xs font-medium text-[#7A866E] bg-[#F5F4EE] px-2.5 py-0.5 rounded-full">
                Không dầu mỡ
              </span>
            </div>
            <h4 class="font-heading text-base font-bold text-[#242424] truncate">Snack Ức gà sấy giòn thảo mộc</h4>
            <p class="text-xs text-[#7A866E]">Ăn liền tiện lợi lúc xế chiều, giòn rụm và giàu axit amin.</p>
            <div class="pt-2 flex items-center justify-between">
              <span class="font-heading font-black text-base text-[#242424]">110.000 đ</span>
              <button
                type="button"
                @click="handleAddDeficitProduct('Snack Ức gà sấy giòn thảo mộc', 110000, 20, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=180&q=80')"
                class="px-4 py-2 rounded-xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag class="w-3.5 h-3.5" />
                <span>+ Thêm vào giỏ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
