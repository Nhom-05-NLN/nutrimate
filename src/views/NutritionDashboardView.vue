<script setup lang="ts">
import { ref, computed } from 'vue';
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
const scanResult = ref({
  calories: 190,
  protein: 16.5,
  fat: 3.2,
  carbs: 22.0,
  accuracy: 100,
});

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
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#2D3B1E]">Trang chủ</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <RouterLink to="/profile" class="hover:text-[#2D3B1E]">Thành viên NutriMate</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="text-[#2D3B1E] font-bold">Nhật ký & Bảng điều khiển Dinh dưỡng</span>
    </nav>

    <!-- Header Actions Bar (Figma 08) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Bảng điều khiển Dinh dưỡng & Calo
        </h1>
        <p class="text-xs text-[#7A866E] mt-1">
          Theo dõi năng lượng nạp vào, phân bổ Macros và nhật ký ăn uống hôm nay theo khuyến nghị của NutriBot AI.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Date Selector -->
        <button
          type="button"
          class="px-3.5 py-2 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E] flex items-center gap-1.5 shadow-2xs hover:bg-[#FAF9F5]"
        >
          <Calendar class="w-3.5 h-3.5 text-[#4D6A34]" />
          <span>‹ Hôm nay, 24 Tháng 10, 2024 ›</span>
        </button>

        <!-- Scan AI Camera -->
        <button
          type="button"
          @click="handleScanSimulate"
          class="px-3.5 py-2 rounded-2xl bg-[#3B4E24] hover:bg-[#2D3B1E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Camera class="w-3.5 h-3.5" />
          <span>Quét nhãn dinh dưỡng (Scan AI)</span>
        </button>

        <!-- + Thêm món -->
        <button
          type="button"
          class="px-3.5 py-2 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>+ Thêm món ăn hôm nay</span>
        </button>
      </div>
    </div>

    <!-- Top 3 Metric Cards (Calo Donut, Macros, Water Tracker) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      <!-- 1. Mục tiêu Calo Hôm Nay (Figma 08) -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-4">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
          <div>
            <h3 class="font-heading text-xs font-bold text-[#2D3B1E]">Mục tiêu Calo Hôm Nay</h3>
            <span class="text-[10px] text-[#7A866E]">Kế hoạch giảm mỡ khoa học</span>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">
            Thâm hụt an toàn
          </span>
        </div>

        <div class="flex items-center gap-6 py-2">
          <!-- Donut Graphic Mockup -->
          <div class="relative w-28 h-28 shrink-0 flex items-center justify-center">
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
              <span class="text-[10px] text-[#7A866E]">Còn lại</span>
              <span class="font-heading text-xl font-black text-[#2D3B1E]">710</span>
              <span class="text-[9px] text-[#7A866E]">kcal</span>
            </div>
          </div>

          <!-- Chỉ số phụ -->
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#7A866E]"></span>
              <span class="text-[#7A866E]">Mục tiêu ngày:</span>
              <span class="font-bold text-[#2D3B1E]">1.550 kcal</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#4D6A34]"></span>
              <span class="text-[#7A866E]">Đã nạp vào:</span>
              <span class="font-bold text-[#2D3B1E]">1.120 kcal</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span class="text-[#7A866E]">Đốt cháy vận động:</span>
              <span class="font-bold text-rose-600">-280 kcal</span>
            </div>
          </div>
        </div>

        <div class="p-2.5 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] text-[11px] text-[#3B4E24] flex items-center gap-1.5">
          <span>✓</span>
          <span><strong>Đánh giá nhanh:</strong> Đang duy trì thâm hụt calo hoàn hảo cho mục tiêu Giảm Mỡ Tăng Cơ!</span>
        </div>
      </div>

      <!-- 2. Phân bổ Macros (Figma 08) -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-4">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
          <div>
            <h3 class="font-heading text-xs font-bold text-[#2D3B1E]">Phân bổ Macros</h3>
            <span class="text-[10px] text-[#7A866E]">Cân bằng lượng đạm và tinh bột tốt</span>
          </div>
          <span class="text-[10px] text-[#7A866E]">Đã nạp 3 bữa</span>
        </div>

        <!-- 4 Thanh tiến độ Macro -->
        <div class="space-y-3 text-xs">
          <!-- Protein -->
          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="font-bold text-[#2D3B1E]">■ Đạm (Protein)</span>
              <span class="font-bold text-[#4D6A34]">68g / 80g (85%)</span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-[#4D6A34] rounded-full" style="width: 85%"></div>
            </div>
          </div>

          <!-- Carbs -->
          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="font-bold text-[#2D3B1E]">■ Tinh bột tốt (Carbs)</span>
              <span class="font-bold text-[#2D3B1E]">105g / 150g (70%)</span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-[#7F9C5B] rounded-full" style="width: 70%"></div>
            </div>
          </div>

          <!-- Fat -->
          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="font-bold text-[#2D3B1E]">■ Chất béo tốt (Fat)</span>
              <span class="font-bold text-[#2D3B1E]">32g / 45g (71%)</span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-[#D4A373] rounded-full" style="width: 71%"></div>
            </div>
          </div>

          <!-- Sugar -->
          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="font-bold text-[#2D3B1E]">■ Lượng đường nạp (Sugar)</span>
              <span class="font-bold text-sky-700">14g / tối đa 25g (56%)</span>
            </div>
            <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-sky-500 rounded-full" style="width: 56%"></div>
            </div>
          </div>
        </div>

        <div class="flex justify-between text-[11px] text-[#7A866E] pt-2 border-t border-[#F0F3EC]">
          <span class="text-[#4D6A34] font-semibold">✓ Đạt chuẩn ít đường</span>
          <span class="text-amber-700 font-bold">Thiếu: 12g Đạm</span>
        </div>
      </div>

      <!-- 3. Theo dõi Nước (Figma 08) -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs flex flex-col justify-between space-y-4">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
          <div class="flex items-center gap-2">
            <Droplet class="w-4 h-4 text-[#4D6A34]" />
            <h3 class="font-heading text-xs font-bold text-[#2D3B1E]">Theo dõi Nước</h3>
          </div>
          <span class="text-xs font-bold text-[#4D6A34]">75%</span>
        </div>

        <div>
          <div class="flex items-baseline justify-between mb-3">
            <span class="font-heading text-2xl font-black text-[#2D3B1E]">
              {{ waterCurrentMl }} <span class="text-xs font-normal text-[#7A866E]">/ {{ waterTargetMl }} ml</span>
            </span>
          </div>

          <!-- 8 Ly nước tương tác -->
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="(filled, idx) in waterGlasses"
              :key="idx"
              type="button"
              @click="toggleGlass(idx)"
              class="p-2 rounded-xl border text-center transition-all cursor-pointer"
              :class="
                filled
                  ? 'bg-[#EBF1E6] border-[#4D6A34] text-[#4D6A34]'
                  : 'bg-[#FAF9F5] border-[#E3E8DC] text-[#7A866E] opacity-60 hover:opacity-100'
              "
            >
              <Droplet class="w-4 h-4 mx-auto" :class="{ 'fill-[#4D6A34]': filled }" />
              <span class="text-[9px] block mt-1 font-bold">275ml</span>
            </button>
          </div>
        </div>

        <!-- 2 Nút thêm nhanh & Nhắc nhở -->
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="addWater(250)"
              class="py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#EBF1E6] text-[#4D6A34] text-xs font-bold border border-[#CCD7BC] transition-colors"
            >
              + 250ml
            </button>
            <button
              type="button"
              @click="addWater(500)"
              class="py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#EBF1E6] text-[#4D6A34] text-xs font-bold border border-[#CCD7BC] transition-colors"
            >
              + 500ml
            </button>
          </div>

          <div class="p-2 rounded-xl bg-[#F6F8F3] text-[10px] text-[#4E5C3E] flex items-center gap-1.5">
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
          <h2 class="font-heading text-xl font-extrabold text-[#2D3B1E]">
            Nhật ký 4 Bữa Ăn Trong Ngày
          </h2>
          <p class="text-xs text-[#7A866E]">
            Chi tiết thành phần, chỉ số calo và đạm cho từng món ăn nạp vào hôm nay.
          </p>
        </div>
        <button type="button" class="text-xs font-bold text-[#4D6A34] hover:underline">
          Xem báo cáo tuần &gt;
        </button>
      </div>

      <!-- 4 Cards Bữa Ăn -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- 1. Bữa Sáng -->
        <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-2">
              <div>
                <h4 class="font-heading text-xs font-bold text-[#2D3B1E] flex items-center gap-1">
                  🍳 Bữa Sáng
                </h4>
                <span class="text-[10px] text-[#7A866E]">Đã hoàn thành lúc 07:30</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-[#2D3B1E] block">380 kcal</span>
                <span class="text-[10px] text-[#4D6A34]">22g Protein</span>
              </div>
            </div>

            <!-- Items -->
            <div class="space-y-2 text-xs">
              <div class="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#2D3B1E] block">Granola Yến Mạch NutriMate (40g)</span>
                  <span class="text-[10px] text-[#7A866E]">152 kcal • 14g Đạm</span>
                </div>
                <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
              </div>

              <div class="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#2D3B1E]">Sữa chua Hy Lạp không đường (100g)</span>
                  <span class="text-[10px] text-[#7A866E]">98 kcal • 10g Đạm</span>
                </div>
                <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
              </div>

              <div class="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#2D3B1E]">Nửa quả táo xanh và hạt chia</span>
                  <span class="text-[10px] text-[#7A866E]">130 kcal • 2g Đạm</span>
                </div>
                <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-[#F0F3EC] flex items-center justify-between text-[11px] text-[#4D6A34]">
            <button class="hover:underline">Xem nhãn Nutrition</button>
            <button class="font-bold hover:underline">+ Thêm món</button>
          </div>
        </div>

        <!-- 2. Bữa Trưa -->
        <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-2">
              <div>
                <h4 class="font-heading text-xs font-bold text-[#2D3B1E] flex items-center gap-1">
                  ☀️ Bữa Trưa
                </h4>
                <span class="text-[10px] text-[#7A866E]">Đã hoàn thành lúc 12:15</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-[#2D3B1E] block">450 kcal</span>
                <span class="text-[10px] text-[#4D6A34]">32g Protein</span>
              </div>
            </div>

            <!-- Items -->
            <div class="space-y-2 text-xs">
              <div class="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#2D3B1E] block">Ức gà sấy giòn thảo mộc (100g)</span>
                  <span class="text-[10px] text-[#7A866E]">220 kcal • 28g Đạm</span>
                </div>
                <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
              </div>

              <div class="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#2D3B1E]">Khoai lang luộc & Rau củ sốt mè</span>
                  <span class="text-[10px] text-[#7A866E]">230 kcal • 4g Đạm</span>
                </div>
                <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-[#F0F3EC] flex items-center justify-between text-[11px] text-[#4D6A34]">
            <button class="hover:underline">Xem nhãn Nutrition</button>
            <button class="font-bold hover:underline">+ Thêm món</button>
          </div>
        </div>

        <!-- 3. Bữa Xế / Snack -->
        <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-2">
              <div>
                <h4 class="font-heading text-xs font-bold text-[#2D3B1E] flex items-center gap-1">
                  🕒 Bữa Xế / Snack
                </h4>
                <span class="text-[10px] text-[#7A866E]">Đã nạp lúc 15:30</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-[#2D3B1E] block">150 kcal</span>
                <span class="text-[10px] text-[#4D6A34]">8g Protein</span>
              </div>
            </div>

            <!-- Items -->
            <div class="space-y-2 text-xs">
              <div class="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#2D3B1E] block">Protein Bar sô-cô-la đen (1/2 thanh)</span>
                  <span class="text-[10px] text-[#7A866E]">110 kcal • 7.5g Đạm</span>
                </div>
                <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
              </div>

              <div class="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#F0F3EC] flex items-start justify-between">
                <div>
                  <span class="font-bold text-[#2D3B1E]">Trà xanh không đường</span>
                  <span class="text-[10px] text-[#7A866E]">0 kcal • 0g Đạm</span>
                </div>
                <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-[#F0F3EC] flex items-center justify-between text-[11px] text-[#4D6A34]">
            <button class="hover:underline">Xem nhãn Nutrition</button>
            <button class="font-bold hover:underline">+ Thêm món</button>
          </div>
        </div>

        <!-- 4. Bữa Tối (Khuyến nghị NutriBot) -->
        <div class="bg-[#F6F8F3] p-5 rounded-3xl border border-[#CCD7BC] shadow-2xs space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-[#CCD7BC] pb-2">
              <div>
                <h4 class="font-heading text-xs font-bold text-[#2D3B1E] flex items-center gap-1">
                  🌙 Bữa Tối
                </h4>
                <span class="text-[10px] text-[#7A866E]">Dự kiến khoảng 19:00</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-[#2D3B1E] block">340 kcal</span>
                <span class="text-[10px] text-[#4D6A34]">20g Protein</span>
              </div>
            </div>

            <!-- Lời gợi ý AI -->
            <div class="p-3 rounded-2xl bg-white border border-[#DEE5D4] text-xs space-y-2">
              <div class="flex items-center gap-1.5 text-[11px] font-bold text-[#4D6A34]">
                <Bot class="w-3.5 h-3.5" />
                <span>Gợi ý từ NutriBot:</span>
              </div>
              <p class="text-[11px] text-[#4E5C3E] leading-relaxed">
                "Salad cá hồi hoặc Salad ức gà với mì Konjac ít calo để tối ưu hóa việc đốt mỡ ban đêm."
              </p>
              <span class="text-[10px] text-[#7A866E] italic block">Chưa ghi nhận món ăn thực tế.</span>
            </div>
          </div>

          <button
            type="button"
            @click="chatStore.openChat()"
            class="w-full py-2.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>NutriBot gợi ý món tối phù hợp</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Section: Quét Nhãn Dinh Dưỡng Thông Minh NutriVision AI (Figma 08) -->
    <div class="p-6 sm:p-10 rounded-4xl bg-white border border-[#E3E8DC] shadow-sm">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Cột Trái -->
        <div class="lg:col-span-7 space-y-4">
          <span class="text-[10px] font-bold text-[#4D6A34] bg-[#EBF1E6] px-3 py-1 rounded-full border border-[#CCD7BC]">
            📷 Công nghệ Trí tuệ Nhân tạo NutriVision
          </span>
          <h3 class="font-heading text-xl sm:text-2xl font-black text-[#2D3B1E]">
            Quét nhãn dinh dưỡng thông minh bằng Camera
          </h3>
          <p class="text-xs sm:text-sm text-[#576449] leading-relaxed">
            Chụp ảnh bảng thành phần dinh dưỡng phía sau bất kỳ bao bì thực phẩm nào, NutriBot sẽ tự động trích xuất Calo, Đạm, Đường và đồng bộ ngay vào Nhật ký dinh dưỡng của bạn mà không cần nhập thủ công.
          </p>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              @click="handleScanSimulate"
              class="px-5 py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Camera class="w-4 h-4" />
              <span>Mở máy quét ngay</span>
            </button>
            <button
              type="button"
              @click="handleScanSimulate"
              class="px-5 py-3 rounded-2xl bg-[#FAF9F5] hover:bg-[#F0F3EC] text-[#2D3B1E] text-xs font-bold border border-[#CCD7BC] flex items-center gap-2 transition-colors"
            >
              <Upload class="w-4 h-4 text-[#7A866E]" />
              <span>Tải ảnh nhãn có sẵn</span>
            </button>
          </div>
        </div>

        <!-- Cột Phải: Mockup Kết quả quét nhãn -->
        <div class="lg:col-span-5">
          <div class="p-5 rounded-3xl bg-[#FAF9F5] border-2 border-dashed border-[#4D6A34] space-y-3 text-xs">
            <div class="flex items-center justify-between border-b border-[#CCD7BC] pb-2">
              <span class="font-bold text-[#2D3B1E] uppercase">Nutrition Facts AI</span>
              <span class="text-[10px] text-[#4D6A34] font-bold">✓ Đã nhận diện 100%</span>
            </div>

            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Calories:</span>
                <span class="font-bold text-[#2D3B1E]">190 kcal</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Protein:</span>
                <span class="font-bold text-[#4D6A34]">16.5g</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Total Fat:</span>
                <span class="font-bold text-[#2D3B1E]">3.2g</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Carbohydrates:</span>
                <span class="font-bold text-[#2D3B1E]">22.0g</span>
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
          <h2 class="font-heading text-xl font-extrabold text-[#2D3B1E] flex items-center gap-2">
            <span>🌱</span> Gợi ý Thực phẩm Bổ sung Thiếu hụt
          </h2>
          <p class="text-xs text-[#7A866E]">
            Hôm nay bạn còn thiếu <strong>12g Protein</strong> để đạt mốc 80g mục tiêu. Dưới đây là các lựa chọn tiện lợi từ cửa hàng NutriMate:
          </p>
        </div>
        <RouterLink to="/catalog" class="text-xs font-bold text-[#4D6A34] hover:underline">
          Xem tất cả thực phẩm sạch &gt;
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Item 1 -->
        <div class="p-5 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=140&q=80"
            alt="bot-dam"
            class="w-20 h-20 rounded-2xl object-cover shrink-0"
          />
          <div class="flex-1 min-w-0 space-y-1">
            <span class="text-[10px] font-bold text-[#4D6A34] bg-[#EBF1E6] px-2 py-0.5 rounded-full">
              Bổ sung 15g Protein
            </span>
            <h4 class="font-heading text-sm font-bold text-[#2D3B1E] truncate">Bột đạm hạt bí hữu cơ NutriMate</h4>
            <p class="text-[11px] text-[#7A866E]">Dễ pha với sữa hạt chua hoặc sinh tố, không gây đầy bụng.</p>
            <div class="pt-2 flex items-center justify-between">
              <span class="font-bold text-sm text-[#2D3B1E]">120.000đ</span>
              <button
                type="button"
                @click="handleAddDeficitProduct('Bột đạm hạt bí hữu cơ NutriMate', 120000, 15)"
                class="px-3 py-1.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <ShoppingBag class="w-3.5 h-3.5" />
                <span>+ Thêm vào giỏ</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Item 2 -->
        <div class="p-5 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=140&q=80"
            alt="snack-uc-ga"
            class="w-20 h-20 rounded-2xl object-cover shrink-0"
          />
          <div class="flex-1 min-w-0 space-y-1">
            <span class="text-[10px] font-bold text-[#4D6A34] bg-[#EBF1E6] px-2 py-0.5 rounded-full">
              Bổ sung 20g Protein
            </span>
            <h4 class="font-heading text-sm font-bold text-[#2D3B1E] truncate">Snack Ức gà sấy giòn thảo mộc</h4>
            <p class="text-[11px] text-[#7A866E]">Ăn liền tiện lợi lúc xế chiều, giòn rụm và giàu axit amin.</p>
            <div class="pt-2 flex items-center justify-between">
              <span class="font-bold text-sm text-[#2D3B1E]">110.000đ</span>
              <button
                type="button"
                @click="handleAddDeficitProduct('Snack Ức gà sấy giòn thảo mộc', 110000, 20)"
                class="px-3 py-1.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1 transition-colors"
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
