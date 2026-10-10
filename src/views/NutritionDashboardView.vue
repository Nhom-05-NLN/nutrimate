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
  Droplet,
  Bot,
  Sparkles,
  Check,
  CheckCircle2,
  Upload,
  ArrowRight,
  ShoppingBag,
} from 'lucide-vue-next';

const cartStore = useCartStore();
const chatStore = useChatStore();
const toastStore = useToastStore();

const waterCurrentMl = ref(1650);
const waterTargetMl = 2200;
const waterGlasses = ref([true, true, true, true, true, true, false, false]);

function addWater(amount: number) {
  waterCurrentMl.value = Math.min(waterTargetMl, waterCurrentMl.value + amount);
  const totalGlasses = Math.floor(waterCurrentMl.value / 275);
  waterGlasses.value = waterGlasses.value.map((_, idx) => idx < totalGlasses);
  toastStore.show(`Đã ghi nhận +${amount}ml nước`, 'success', `Tổng lượng nước hôm nay: ${waterCurrentMl.value}ml`);
}

function toggleGlass(index: number) {
  waterGlasses.value[index] = !waterGlasses.value[index];
  const activeCount = waterGlasses.value.filter(Boolean).length;
  waterCurrentMl.value = activeCount * 275;
}

const isScanningModalOpen = ref(false);

function handleScanSimulate() {
  isScanningModalOpen.value = true;
  setTimeout(() => {
    toastStore.show('NutriVision AI đã trích xuất thành công!', 'success', '190 kcal • 16.5g Protein • 3.2g Fat');
  }, 600);
}

function handleAddDeficitProduct(name: string, price: number, protein: number) {
  cartStore.addItem(
    {
      id: `deficit-${Date.now()}`,
      code: 'NM-DEFICIT',
      name,
      category: 'high-protein',
      categoryName: 'Bổ sung thiếu hụt',
      price,
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80',
      description: 'Sản phẩm bổ sung lượng đạm thiếu hụt trong ngày.',
      ingredients: ['Thành phần tự nhiên'],
      nutrition: {
        servingSize: '1 phần',
        calories: 130,
        protein,
        carbs: 2,
        fat: 1,
        sugar: 0,
      },
      stock: 40,
      rating: 5.0,
      reviewCount: 45,
      badges: [`+${protein}g Protein`],
      bestFor: 'Bổ sung macro',
    },
    1
  );
}
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-12">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#242424]">Trang chủ</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <RouterLink to="/profile" class="hover:text-[#242424]">Thành viên NutriMate</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <span class="text-[#242424] font-bold">Nhật ký & Bảng điều khiển Dinh dưỡng</span>
    </nav>

    <!-- Header Actions Bar (Figma 08) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#242424]">
          Bảng điều khiển Dinh dưỡng & Calo
        </h1>
        <p class="text-sm text-[#7A866E] mt-1.5">
          Theo dõi năng lượng nạp vào, phân bổ Macros và nhật ký ăn uống hôm nay theo khuyến nghị của NutriBot AI.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Date Selector -->
        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl bg-white border border-[#CCD7BC] text-xs sm:text-sm font-bold text-[#242424] flex items-center gap-2 shadow-2xs hover:bg-[#FAF9F5] cursor-pointer"
        >
          <Calendar class="w-4 h-4 text-[#4D6A34]" />
          <span>‹ Hôm nay, 24 Tháng 10, 2024 ›</span>
        </button>

        <!-- Scan AI Camera -->
        <button
          type="button"
          @click="handleScanSimulate"
          class="px-4 py-2.5 rounded-2xl bg-[#3B4E24] hover:bg-[#2D3B1E] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Camera class="w-4 h-4" />
          <span>Quét nhãn dinh dưỡng (Scan AI)</span>
        </button>

        <!-- + Thêm món -->
        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>+ Thêm món ăn hôm nay</span>
        </button>
      </div>
    </div>

    <!-- Top 3 Metric Cards (Calo Donut, Macros, Water Tracker) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      <!-- 1. Mục tiêu Calo Hôm Nay (Figma 08) -->
      <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-5">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3.5">
          <div>
            <h3 class="font-heading text-sm font-bold text-[#242424]">Mục tiêu Calo Hôm Nay</h3>
            <span class="text-xs text-[#7A866E]">Kế hoạch giảm mỡ khoa học</span>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34]">
            Thâm hụt an toàn
          </span>
        </div>

        <div class="flex items-center gap-6 py-2">
          <!-- Donut Graphic Mockup (To, rõ ràng) -->
          <div class="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <!-- Vòng nền -->
              <path
                class="text-[#F0F4EA]"
                stroke-width="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <!-- Vòng tiến độ -->
              <path
                class="text-[#4D6A34]"
                stroke-dasharray="72, 100"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div class="absolute flex flex-col items-center justify-center text-center">
              <span class="text-xs text-[#7A866E] font-medium">Còn lại</span>
              <span class="font-heading text-2xl font-black text-[#242424] leading-tight">710</span>
              <span class="text-[10px] text-[#7A866E] font-bold">kcal</span>
            </div>
          </div>

          <!-- Chỉ số phụ -->
          <div class="space-y-2 text-xs sm:text-sm">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#7A866E]"></span>
              <span class="text-[#7A866E]">Mục tiêu ngày:</span>
              <span class="font-bold text-[#242424]">1.550 kcal</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#4D6A34]"></span>
              <span class="text-[#7A866E]">Đã nạp vào:</span>
              <span class="font-bold text-[#242424]">1.120 kcal</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span class="text-[#7A866E]">Đốt cháy vận động:</span>
              <span class="font-bold text-rose-600">-280 kcal</span>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] text-xs text-[#3B4E24] flex items-center gap-2">
          <span>✓</span>
          <span><strong>Đánh giá nhanh:</strong> Đang duy trì thâm hụt calo hoàn hảo cho mục tiêu Giảm Mỡ Tăng Cơ!</span>
        </div>
      </div>

      <!-- 2. Phân bổ Macros (Figma 08) -->
      <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-5">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3.5">
          <div>
            <h3 class="font-heading text-sm font-bold text-[#242424]">Phân bổ Macros</h3>
            <span class="text-xs text-[#7A866E]">Cân bằng lượng đạm và tinh bột tốt</span>
          </div>
          <span class="text-xs text-[#7A866E] font-medium">Đã nạp 3 bữa</span>
        </div>

        <!-- 4 Thanh tiến độ Macro -->
        <div class="space-y-3.5 text-xs sm:text-sm">
          <!-- Protein -->
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="font-bold text-[#242424]">■ Đạm (Protein)</span>
              <span class="font-bold text-[#4D6A34]">68g / 80g (85%)</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-[#4D6A34] rounded-full" style="width: 85%"></div>
            </div>
          </div>

          <!-- Carbs -->
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="font-bold text-[#242424]">■ Tinh bột tốt (Carbs)</span>
              <span class="font-bold text-[#242424]">105g / 150g (70%)</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-[#7F9C5B] rounded-full" style="width: 70%"></div>
            </div>
          </div>

          <!-- Fat -->
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="font-bold text-[#242424]">■ Chất béo tốt (Fat)</span>
              <span class="font-bold text-[#242424]">32g / 45g (71%)</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-[#D4A373] rounded-full" style="width: 71%"></div>
            </div>
          </div>

          <!-- Sugar -->
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="font-bold text-[#242424]">■ Lượng đường nạp (Sugar)</span>
              <span class="font-bold text-sky-700">14g / tối đa 25g (56%)</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-sky-500 rounded-full" style="width: 56%"></div>
            </div>
          </div>
        </div>

        <div class="flex justify-between text-xs text-[#7A866E] pt-2 border-t border-[#F0F3EC]">
          <span class="text-[#4D6A34] font-bold">✓ Đạt chuẩn ít đường</span>
          <span class="text-amber-700 font-bold">Thiếu: 12g Đạm</span>
        </div>
      </div>

      <!-- 3. Theo dõi Nước (Figma 08) -->
      <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-5">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3.5">
          <div class="flex items-center gap-2">
            <Droplet class="w-5 h-5 text-[#4D6A34]" />
            <h3 class="font-heading text-sm font-bold text-[#242424]">Theo dõi Nước</h3>
          </div>
          <span class="text-xs font-bold text-[#4D6A34]">75%</span>
        </div>

        <div>
          <div class="flex items-baseline justify-between mb-4">
            <span class="font-heading text-3xl font-black text-[#242424]">
              {{ waterCurrentMl }} <span class="text-xs font-normal text-[#7A866E]">/ {{ waterTargetMl }} ml</span>
            </span>
          </div>

          <!-- 8 Ly nước tương tác (To rõ) -->
          <div class="grid grid-cols-4 gap-2.5">
            <button
              v-for="(filled, idx) in waterGlasses"
              :key="idx"
              type="button"
              @click="toggleGlass(idx)"
              class="p-2.5 rounded-2xl border text-center transition-all cursor-pointer"
              :class="
                filled
                  ? 'bg-[#EBF7E5] border-[#4D6A34] text-[#4D6A34] shadow-2xs'
                  : 'bg-[#FAF9F5] border-[#E3E8DC] text-[#7A866E] opacity-60 hover:opacity-100'
              "
            >
              <Droplet class="w-5 h-5 mx-auto" :class="{ 'fill-[#4D6A34]': filled }" />
              <span class="text-[10px] block mt-1 font-bold">275ml</span>
            </button>
          </div>
        </div>

        <!-- 2 Nút thêm nhanh & Nhắc nhở -->
        <div class="space-y-2.5">
          <div class="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              @click="addWater(250)"
              class="py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#4D6A34] text-xs font-bold border border-[#CCD7BC] transition-colors cursor-pointer"
            >
              + 250ml
            </button>
            <button
              type="button"
              @click="addWater(500)"
              class="py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#4D6A34] text-xs font-bold border border-[#CCD7BC] transition-colors cursor-pointer"
            >
              + 500ml
            </button>
          </div>

          <div class="p-2.5 rounded-xl bg-[#F6F8F3] text-xs text-[#3E4A2E] flex items-center gap-2">
            <span>🔔</span>
            <span>Nhắc nhở: Uống thêm 1 ly trước 16h00!</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Nhật Ký 4 Bữa Ăn Trong Ngày (Figma 08) -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-heading text-2xl font-black text-[#242424]">
            Nhật ký 4 Bữa Ăn Trong Ngày
          </h2>
          <p class="text-sm text-[#7A866E] mt-0.5">
            Chi tiết thành phần, chỉ số calo và đạm cho từng món ăn nạp vào hôm nay.
          </p>
        </div>
        <button type="button" class="text-sm font-bold text-[#4D6A34] hover:underline cursor-pointer">
          Xem báo cáo tuần &gt;
        </button>
      </div>

      <!-- 4 Cards Bữa Ăn (To, dễ đọc) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- 1. Bữa Sáng -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#242424] flex items-center gap-1.5">
                  🍳 Bữa Sáng
                </h4>
                <span class="text-xs text-[#7A866E]">Đã hoàn thành lúc 07:30</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-black text-[#242424] block">380 kcal</span>
                <span class="text-xs text-[#4D6A34] font-bold">22g Protein</span>
              </div>
            </div>

            <!-- Items -->
            <div class="space-y-2.5 text-xs sm:text-sm">
              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#242424] block">Granola Yến Mạch (40g)</span>
                  <span class="text-xs text-[#7A866E]">152 kcal • 14g Đạm</span>
                </div>
                <CheckCircle2 class="w-4.5 h-4.5 text-[#4D6A34] shrink-0 mt-0.5" />
              </div>

              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#242424] block">Sữa chua Hy Lạp (100g)</span>
                  <span class="text-xs text-[#7A866E]">98 kcal • 10g Đạm</span>
                </div>
                <CheckCircle2 class="w-4.5 h-4.5 text-[#4D6A34] shrink-0 mt-0.5" />
              </div>

              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#242424] block">Nửa quả táo xanh & chia</span>
                  <span class="text-xs text-[#7A866E]">130 kcal • 2g Đạm</span>
                </div>
                <CheckCircle2 class="w-4.5 h-4.5 text-[#4D6A34] shrink-0 mt-0.5" />
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between text-xs font-bold text-[#4D6A34]">
            <button class="hover:underline cursor-pointer">Xem nhãn Nutrition</button>
            <button class="hover:underline cursor-pointer">+ Thêm món</button>
          </div>
        </div>

        <!-- 2. Bữa Trưa -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#242424] flex items-center gap-1.5">
                  ☀️ Bữa Trưa
                </h4>
                <span class="text-xs text-[#7A866E]">Đã hoàn thành lúc 12:15</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-black text-[#242424] block">450 kcal</span>
                <span class="text-xs text-[#4D6A34] font-bold">32g Protein</span>
              </div>
            </div>

            <!-- Items -->
            <div class="space-y-2.5 text-xs sm:text-sm">
              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#242424] block">Ức gà sấy giòn (100g)</span>
                  <span class="text-xs text-[#7A866E]">220 kcal • 28g Đạm</span>
                </div>
                <CheckCircle2 class="w-4.5 h-4.5 text-[#4D6A34] shrink-0 mt-0.5" />
              </div>

              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#242424] block">Khoai lang & Rau củ sốt mè</span>
                  <span class="text-xs text-[#7A866E]">230 kcal • 4g Đạm</span>
                </div>
                <CheckCircle2 class="w-4.5 h-4.5 text-[#4D6A34] shrink-0 mt-0.5" />
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between text-xs font-bold text-[#4D6A34]">
            <button class="hover:underline cursor-pointer">Xem nhãn Nutrition</button>
            <button class="hover:underline cursor-pointer">+ Thêm món</button>
          </div>
        </div>

        <!-- 3. Bữa Xế / Snack -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#242424] flex items-center gap-1.5">
                  🕒 Bữa Xế / Snack
                </h4>
                <span class="text-xs text-[#7A866E]">Đã nạp lúc 15:30</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-black text-[#242424] block">150 kcal</span>
                <span class="text-xs text-[#4D6A34] font-bold">8g Protein</span>
              </div>
            </div>

            <!-- Items -->
            <div class="space-y-2.5 text-xs sm:text-sm">
              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#242424] block">Protein Bar Socola (1/2 thanh)</span>
                  <span class="text-xs text-[#7A866E]">110 kcal • 7.5g Đạm</span>
                </div>
                <CheckCircle2 class="w-4.5 h-4.5 text-[#4D6A34] shrink-0 mt-0.5" />
              </div>

              <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#242424] block">Trà xanh không đường</span>
                  <span class="text-xs text-[#7A866E]">0 kcal • 0g Đạm</span>
                </div>
                <CheckCircle2 class="w-4.5 h-4.5 text-[#4D6A34] shrink-0 mt-0.5" />
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between text-xs font-bold text-[#4D6A34]">
            <button class="hover:underline cursor-pointer">Xem nhãn Nutrition</button>
            <button class="hover:underline cursor-pointer">+ Thêm món</button>
          </div>
        </div>

        <!-- 4. Bữa Tối (Khuyến nghị NutriBot) -->
        <div class="bg-[#F6F8F3] p-6 rounded-3xl border border-[#CCD7BC] shadow-2xs space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-[#CCD7BC] pb-3">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#242424] flex items-center gap-1.5">
                  🌙 Bữa Tối
                </h4>
                <span class="text-xs text-[#7A866E]">Dự kiến khoảng 19:00</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-black text-[#242424] block">340 kcal</span>
                <span class="text-xs text-[#4D6A34] font-bold">20g Protein</span>
              </div>
            </div>

            <!-- Lời gợi ý AI -->
            <div class="p-4 rounded-2xl bg-white border border-[#DEE5D4] text-xs sm:text-sm space-y-2">
              <div class="flex items-center gap-1.5 font-bold text-[#4D6A34]">
                <Bot class="w-4 h-4" />
                <span>Gợi ý từ NutriBot:</span>
              </div>
              <p class="text-[#3E4A2E] leading-relaxed">
                "Salad cá hồi hoặc Salad ức gà với mì Konjac ít calo để tối ưu hóa việc đốt mỡ ban đêm."
              </p>
              <span class="text-xs text-[#7A866E] italic block">Chưa ghi nhận món ăn thực tế.</span>
            </div>
          </div>

          <button
            type="button"
            @click="chatStore.openChat()"
            class="w-full py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Sparkles class="w-4 h-4" />
            <span>NutriBot gợi ý món tối phù hợp</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Section: Quét Nhãn Dinh Dưỡng Thông Minh NutriVision AI (Figma 08) -->
    <div class="p-8 sm:p-12 rounded-4xl bg-white border border-[#E3E8DC] shadow-sm">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <!-- Cột Trái -->
        <div class="lg:col-span-7 space-y-5">
          <span class="text-xs font-bold text-[#4D6A34] bg-[#EBF7E5] px-3.5 py-1.5 rounded-full border border-[#CCD7BC]">
            📷 Công nghệ Trí tuệ Nhân tạo NutriVision
          </span>
          <h3 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
            Quét nhãn dinh dưỡng thông minh bằng Camera
          </h3>
          <p class="text-sm sm:text-base text-[#576449] leading-relaxed">
            Chụp ảnh bảng thành phần dinh dưỡng phía sau bất kỳ bao bì thực phẩm nào, NutriBot sẽ tự động trích xuất Calo, Đạm, Đường và đồng bộ ngay vào Nhật ký dinh dưỡng của bạn mà không cần nhập thủ công.
          </p>

          <div class="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              @click="handleScanSimulate"
              class="px-6 py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Camera class="w-4.5 h-4.5" />
              <span>Mở máy quét ngay</span>
            </button>
            <button
              type="button"
              @click="handleScanSimulate"
              class="px-6 py-3.5 rounded-2xl bg-[#FAF9F5] hover:bg-[#F0F3EC] text-[#242424] text-sm font-bold border border-[#CCD7BC] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload class="w-4.5 h-4.5 text-[#7A866E]" />
              <span>Tải ảnh nhãn có sẵn</span>
            </button>
          </div>
        </div>

        <!-- Cột Phải: Mockup Kết quả quét nhãn -->
        <div class="lg:col-span-5">
          <div class="p-6 rounded-3xl bg-[#FAF9F5] border-2 border-dashed border-[#4D6A34] space-y-4 text-xs sm:text-sm">
            <div class="flex items-center justify-between border-b border-[#CCD7BC] pb-2.5">
              <span class="font-bold text-[#242424] uppercase">Nutrition Facts AI</span>
              <span class="text-xs text-[#4D6A34] font-bold">✓ Đã nhận diện 100%</span>
            </div>

            <div class="space-y-2 text-xs sm:text-sm">
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Calories:</span>
                <span class="font-bold text-[#242424]">190 kcal</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Protein:</span>
                <span class="font-bold text-[#4D6A34]">16.5g</span>
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
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Gợi Ý Thực Phẩm Bổ Sung Thiếu Hụt (Figma 08) -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-heading text-2xl font-black text-[#242424] flex items-center gap-2">
            <span>🌱</span> Gợi ý Thực phẩm Bổ sung Thiếu hụt
          </h2>
          <p class="text-sm text-[#7A866E] mt-0.5">
            Hôm nay bạn còn thiếu <strong class="text-[#242424]">12g Protein</strong> để đạt mốc 80g mục tiêu. Dưới đây là các lựa chọn tiện lợi từ cửa hàng NutriMate:
          </p>
        </div>
        <RouterLink to="/catalog" class="text-sm font-bold text-[#4D6A34] hover:underline">
          Xem tất cả thực phẩm sạch &gt;
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Item 1 -->
        <div class="p-6 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all flex items-center gap-5 shadow-2xs">
          <img
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=160&q=80"
            alt="bot-dam"
            class="w-24 h-24 rounded-2xl object-cover shrink-0"
          />
          <div class="flex-1 min-w-0 space-y-1.5">
            <span class="text-xs font-bold text-[#4D6A34] bg-[#EBF7E5] px-2.5 py-0.5 rounded-full">
              Bổ sung 15g Protein
            </span>
            <h4 class="font-heading text-base font-bold text-[#242424] truncate">Bột đạm hạt bí hữu cơ NutriMate</h4>
            <p class="text-xs text-[#7A866E]">Dễ pha với sữa hạt chua hoặc sinh tố, không gây đầy bụng.</p>
            <div class="pt-2 flex items-center justify-between">
              <span class="font-bold text-base text-[#242424]">120.000đ</span>
              <button
                type="button"
                @click="handleAddDeficitProduct('Bột đạm hạt bí hữu cơ NutriMate', 120000, 15)"
                class="px-4 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag class="w-4 h-4" />
                <span>+ Thêm vào giỏ</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Item 2 -->
        <div class="p-6 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all flex items-center gap-5 shadow-2xs">
          <img
            src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=160&q=80"
            alt="snack-uc-ga"
            class="w-24 h-24 rounded-2xl object-cover shrink-0"
          />
          <div class="flex-1 min-w-0 space-y-1.5">
            <span class="text-xs font-bold text-[#4D6A34] bg-[#EBF7E5] px-2.5 py-0.5 rounded-full">
              Bổ sung 20g Protein
            </span>
            <h4 class="font-heading text-base font-bold text-[#242424] truncate">Snack Ức gà sấy giòn thảo mộc</h4>
            <p class="text-xs text-[#7A866E]">Ăn liền tiện lợi lúc xế chiều, giòn rụm và giàu axit amin.</p>
            <div class="pt-2 flex items-center justify-between">
              <span class="font-bold text-base text-[#242424]">110.000đ</span>
              <button
                type="button"
                @click="handleAddDeficitProduct('Snack Ức gà sấy giòn thảo mộc', 110000, 20)"
                class="px-4 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag class="w-4 h-4" />
                <span>+ Thêm vào giỏ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
