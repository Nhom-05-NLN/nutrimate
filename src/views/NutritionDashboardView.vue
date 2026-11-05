<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cartStore';
import { useToastStore } from '../stores/toastStore';
import { fetchCaloriePlan, fetchNutritionDiary, fetchProducts, postNutritionImage, postNutritionMeal, postNutritionWater } from '../services/api';
import type { CaloriePlanResponse, CreateNutritionDiaryMeal, MealType, NutritionDiaryDay, NutritionImagePrediction, Product } from '../types';
import { useAuthStore } from '../stores/authStore';
import {
  Calendar,
  Camera,
  ChevronDown,
  Plus,
  Upload,
  Scan,
  ShoppingBag,
  Flame,
  PieChart,
  Bell,
  Check,
} from 'lucide-vue-next';

const cartStore = useCartStore();
const router = useRouter();
const toastStore = useToastStore();
const authStore = useAuthStore();

const today = new Date().toLocaleDateString('en-CA');
const selectedDate = ref(today);
const diary = ref<NutritionDiaryDay | null>(null);
const isLoadingDiary = ref(true);
const isSavingDiary = ref(false);
const diaryError = ref('');
const caloriePlan = ref<CaloriePlanResponse | null>(null);
const caloriePlanError = ref('');
const isCaloriePlanLoading = ref(true);
const isScanLoading = ref(false);
const isProductPickerOpen = ref(false);
const isProductPickerLoading = ref(false);
const productPickerSearch = ref('');
const productPickerError = ref('');
const mealProductOptions = ref<Product[]>([]);
const scanError = ref('');
const scanResult = ref<NutritionImagePrediction | null>(null);
const scanIsLabel = computed(() => (scanResult.value?.labelFacts.length ?? 0) > 0);
const scanLabelRows = computed(() => {
  const normalize = (label: string) => label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const coreGroup = (key: string) => {
    if (/^(?:energy|calories?|nangluong)$/.test(key)) return 'energy';
    if (/^(?:protein|chatdam|dam)$/.test(key)) return 'protein';
    if (/^(?:fat|totalfat|chatbeo|chatbeotongso|tongchatbeo)$/.test(key)) return 'fat';
    if (/^(?:carb|carbs|carbohydrates?|carbohydrats?|hydratcacbon)$/.test(key)) return 'carbs';
    if (/^(?:sugars?|totalsugars?|duong|duongtongso|duongtong)$/.test(key)) return 'sugar';
    return key;
  };
  const rows: { label: string; value: string }[] = [];
  const seen = new Set<string>();
  for (const fact of scanResult.value?.labelFacts ?? []) {
    const label = fact.label.trim();
    const value = fact.value.trim();
    if (!label || !value) continue;
    const key = coreGroup(normalize(label));
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ label, value });
    if (rows.length >= 40) break;
  }
  return rows;
});
const scanInput = ref<HTMLInputElement | null>(null);
const weekReportOpen = ref(false);
const weekReportLoading = ref(false);
const weekReportError = ref('');
const weekDays = ref<NutritionDiaryDay[]>([]);
const recommendedProducts = ref<Product[]>([]);
const recommendationError = ref('');
const failedProductImages = ref<string[]>([]);
const waterCurrentMl = computed(() => diary.value?.totals.waterMl ?? 0);
const waterTargetMl = 2200;
const reminderTime = computed(() => {
  if (selectedDate.value !== today || waterCurrentMl.value >= waterTargetMl) return null;
  const now = new Date();
  const deadline = new Date(now);
  deadline.setHours(16, 0, 0, 0);
  if (now >= deadline) return null;

  const remainingMl = waterTargetMl - waterCurrentMl.value;
  const glasses = Math.ceil(remainingMl / 250);
  const glassLabel = glasses === 1 ? '1 ly' : `${glasses} ly`;
  return { text: `Còn ${remainingMl.toLocaleString('vi-VN')} ml (${glassLabel}) để đạt mục tiêu hôm nay.`, deadline: '16:00' };
});
const waterGlasses = computed(() => Array.from({ length: 8 }, (_, index) => ({
  ml: index === 7 ? '200ml' : '250ml',
  drank: waterCurrentMl.value >= (index === 7 ? 1950 : (index + 1) * 250),
})));

const mealOptions: { id: MealType; title: string; emoji: string }[] = [
  { id: 'breakfast', title: 'Bữa Sáng', emoji: '🥣' },
  { id: 'lunch', title: 'Bữa Trưa', emoji: '☀️' },
  { id: 'snack', title: 'Bữa Xế / Snack', emoji: '🕒' },
  { id: 'dinner', title: 'Bữa Tối', emoji: '🌙' },
];
const mealsByType = computed(() => mealOptions.map((meal) => {
  const items = (diary.value?.meals ?? []).filter((item) => item.mealType === meal.id);
  return { ...meal, items, calories: items.reduce((sum, item) => sum + item.calories, 0), protein: items.reduce((sum, item) => sum + item.protein, 0) };
}));

async function loadDiary() {
  isLoadingDiary.value = true;
  diaryError.value = '';
  diary.value = null;
  try { diary.value = await fetchNutritionDiary(selectedDate.value); }
  catch (error: unknown) { diaryError.value = error instanceof Error ? error.message : 'Không thể tải nhật ký.'; }
  finally { isLoadingDiary.value = false; }
}
onMounted(loadDiary);
onMounted(async () => {
  try { caloriePlan.value = await fetchCaloriePlan(); }
  catch (error: unknown) { caloriePlanError.value = error instanceof Error ? error.message : 'Không thể tải mục tiêu Calories.'; }
  finally { isCaloriePlanLoading.value = false; }
  try {
    const result = await fetchProducts();
    recommendedProducts.value = result.products.filter((product) => product.stock > 0 &&
      (product.nutrition.protein > 0 || product.nutrition.carbs > 0 || product.nutrition.fat > 0));
  } catch (error: unknown) {
    recommendedProducts.value = [];
    recommendationError.value = error instanceof Error ? error.message : 'Không thể tải sản phẩm gợi ý.';
  }
});

const calorieTarget = computed(() => caloriePlan.value?.plan?.targetCalories ?? null);
const mealTotals = computed(() => (diary.value?.meals ?? []).reduce((totals, meal) => ({
  calories: totals.calories + meal.calories,
  protein: totals.protein + meal.protein,
  carbs: totals.carbs + meal.carbs,
  fat: totals.fat + meal.fat,
  sugar: totals.sugar + meal.sugar,
}), { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }));
const remainingCalories = computed(() => calorieTarget.value === null ? null : Math.max(0, calorieTarget.value - mealTotals.value.calories));
const nutritionGoal = computed(() => caloriePlan.value?.plan?.nutritionGoal ?? null);
const goalLabel = computed(() => ({
  lose_weight: 'Giảm cân',
  maintain_weight: 'Duy trì cân nặng',
  gain_weight: 'Tăng cân',
}[nutritionGoal.value ?? ''] ?? 'Chưa thiết lập mục tiêu'));
const goalSubtitle = computed(() => ({
  lose_weight: 'Thâm hụt năng lượng có kiểm soát',
  maintain_weight: 'Duy trì cân nặng theo hồ sơ',
  gain_weight: 'Thặng dư năng lượng có kiểm soát',
}[nutritionGoal.value ?? ''] ?? 'Hoàn thiện hồ sơ để cá nhân hóa mục tiêu'));
const macroTargets = computed(() => {
  const plan = caloriePlan.value?.plan;
  if (!plan) return null;
  // Adult RDA baseline: 0.8 g protein/kg/day. Distribute remaining energy
  // using 55% carbohydrate and 30% fat, within adult AMDR ranges.
  const proteinGrams = Math.round(plan.weightKg * 0.8);
  const proteinCalories = proteinGrams * 4;
  const remainingCaloriesForCarbsAndFat = Math.max(0, plan.targetCalories - proteinCalories);
  return {
    protein: proteinGrams,
    carbs: Math.round(remainingCaloriesForCarbsAndFat * 0.55 / 4),
    fat: Math.round(remainingCaloriesForCarbsAndFat * 0.30 / 9),
  };
});
const proteinTarget = computed(() => macroTargets.value?.protein ?? null);
const carbsTarget = computed(() => macroTargets.value?.carbs ?? null);
const fatTarget = computed(() => macroTargets.value?.fat ?? null);
const macroDeficits = computed(() => {
  if (!macroTargets.value) return [];
  return [
    { key: 'protein', label: 'Protein', current: mealTotals.value.protein, target: macroTargets.value.protein },
    { key: 'carbs', label: 'Carbs', current: mealTotals.value.carbs, target: macroTargets.value.carbs },
    { key: 'fat', label: 'Fat', current: mealTotals.value.fat, target: macroTargets.value.fat },
  ].map((macro) => ({ ...macro, remaining: Math.max(0, macro.target - macro.current) }))
    .filter((macro) => macro.remaining > 0);
});
const rankedRecommendedProducts = computed(() => {
  const deficits = macroDeficits.value;
  if (!deficits.length) return recommendedProducts.value.slice(0, 2);
  const macroFields = { protein: 'protein', carbs: 'carbs', fat: 'fat' } as const;
  return [...recommendedProducts.value].sort((a, b) => {
    const score = (product: Product) => deficits.reduce((total, deficit) => {
      const amount = product.nutrition[macroFields[deficit.key as keyof typeof macroFields]];
      return total + Math.min(amount, deficit.remaining) / deficit.remaining;
    }, 0);
    return score(b) - score(a);
  }).slice(0, 2);
});
const sugarMax = 25;
const hasDiaryData = computed(() => (diary.value?.meals.length ?? 0) > 0);
const dailySugarExceeded = computed(() => hasDiaryData.value && mealTotals.value.sugar > sugarMax);
const proteinRemaining = computed(() => proteinTarget.value === null ? null : Math.max(0, proteinTarget.value - mealTotals.value.protein));
const proteinOverTarget = computed(() => proteinTarget.value === null ? 0 : Math.max(0, mealTotals.value.protein - proteinTarget.value));
const proteinSuggestionMessage = computed(() => {
  if (!macroTargets.value) return 'Hoàn thiện hồ sơ sức khỏe để cá nhân hóa mục tiêu dinh dưỡng.';
  if (selectedDate.value !== today) return 'Đang gợi ý sản phẩm theo các chất còn thiếu trong ngày đã chọn.';
  if (!macroDeficits.value.length) return 'Bạn đã đạt các mục tiêu Protein, Carbs và Fat hôm nay. Khám phá các sản phẩm phù hợp.';
  const deficitText = macroDeficits.value.map((macro) => `thiếu ${macro.remaining.toFixed(1)}g ${macro.label}`).join(', ');
  return `Hôm nay bạn ${deficitText}. Gợi ý sản phẩm dựa trên các chất còn thiếu.`;
});
function markProductImageFailed(productId: string) {
  if (!failedProductImages.value.includes(productId)) failedProductImages.value.push(productId);
}
const carbsPercent = computed(() => carbsTarget.value ? mealTotals.value.carbs / carbsTarget.value * 100 : 0);
const fatPercent = computed(() => fatTarget.value ? mealTotals.value.fat / fatTarget.value * 100 : 0);
const sugarPercent = computed(() => sugarMax ? mealTotals.value.sugar / sugarMax * 100 : 0);

function shiftSelectedDate(days: number) {
  const date = new Date(`${selectedDate.value}T12:00:00`);
  date.setDate(date.getDate() + days);
  selectedDate.value = date.toLocaleDateString('en-CA');
  loadDiary();
}

async function loadWeekReport() {
  weekReportOpen.value = true;
  weekReportLoading.value = true;
  weekReportError.value = '';
  try {
    const date = new Date(`${selectedDate.value}T12:00:00`);
    const dayOfWeek = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dayOfWeek);
    const dates = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(date);
      day.setDate(date.getDate() + index);
      return day.toLocaleDateString('en-CA');
    });
    weekDays.value = await Promise.all(dates.map(fetchNutritionDiary));
  } catch (error: unknown) { weekReportError.value = error instanceof Error ? error.message : 'Không thể tải báo cáo tuần.'; }
  finally { weekReportLoading.value = false; }
}

async function analyzeSelectedImage() {
  const image = scanInput.value?.files?.[0];
  if (!image) { scanError.value = 'Vui lòng chọn ảnh thực phẩm.'; return; }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) { scanError.value = 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.'; return; }
  if (image.size > 5 * 1024 * 1024) { scanError.value = 'Ảnh không được vượt quá 5 MB.'; return; }
  if (!authStore.accessToken) { scanError.value = 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'; return; }
  isScanLoading.value = true;
  scanError.value = '';
  scanResult.value = null;
  try {
    scanResult.value = await postNutritionImage(image, authStore.accessToken, '', '', '', false);
  }
  catch (error: unknown) { scanError.value = error instanceof Error ? error.message : 'Không thể phân tích ảnh.'; }
  finally { isScanLoading.value = false; if (scanInput.value) scanInput.value.value = ''; }
}

function addScanResultToDiary() {
  if (!scanResult.value || scanResult.value.status !== 'completed' || scanResult.value.predictedCalories === null || scanResult.value.predictedProtein === null || scanResult.value.predictedFat === null) return;
  mealForm.value = {
    date: selectedDate.value, mealType: 'snack', foodName: 'Món ăn từ ảnh (ước lượng AI)',
    calories: scanResult.value.predictedCalories, protein: scanResult.value.predictedProtein,
    carbs: scanResult.value.predictedCarbs ?? 0, fat: scanResult.value.predictedFat,
    sugar: scanResult.value.predictedSugar ?? 0,
  };
  isMealModalOpen.value = true;
}

async function openMealProductPicker() {
  isProductPickerOpen.value = true;
  productPickerSearch.value = '';
  productPickerError.value = '';
  await loadMealProducts();
}

async function loadMealProducts() {
  isProductPickerLoading.value = true;
  productPickerError.value = '';
  try {
    const result = await fetchProducts(productPickerSearch.value.trim() ? { search: productPickerSearch.value.trim() } : {});
    mealProductOptions.value = result.products.filter(product => product.stock > 0 && product.nutrition
      && [product.nutrition.calories, product.nutrition.protein, product.nutrition.carbs, product.nutrition.fat, product.nutrition.sugar].every(Number.isFinite));
  } catch (error: unknown) {
    mealProductOptions.value = [];
    productPickerError.value = error instanceof Error ? error.message : 'Không tải được danh sách sản phẩm.';
  } finally {
    isProductPickerLoading.value = false;
  }
}

function chooseMealProduct(product: Product) {
  mealForm.value = {
    date: selectedDate.value,
    mealType: 'breakfast',
    foodName: product.name,
    calories: product.nutrition.calories,
    protein: product.nutrition.protein,
    carbs: product.nutrition.carbs,
    fat: product.nutrition.fat,
    sugar: product.nutrition.sugar,
  };
  isProductPickerOpen.value = false;
  isMealModalOpen.value = true;
}

function addRecommendedProduct(product: Product) {
  cartStore.addItem(product, 1, product.nutrition.servingSize || 'Mặc định');
}

function openRecommendedProduct(product: Product) {
  void router.push(`/product/${encodeURIComponent(product.id)}`);
}

const isMealModalOpen = ref(false);
const mealForm = ref<CreateNutritionDiaryMeal>({ date: selectedDate.value, mealType: 'breakfast', foodName: '', calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 });
function openMealForm(type: MealType = 'breakfast') {
  mealForm.value = { date: selectedDate.value, mealType: type, foodName: '', calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };
  isMealModalOpen.value = true;
}
async function saveMeal() {
  if (!mealForm.value.foodName.trim()) { toastStore.show('Vui lòng nhập tên món ăn.', 'error'); return; }
  isSavingDiary.value = true;
  try { diary.value = await postNutritionMeal({ ...mealForm.value }); isMealModalOpen.value = false; toastStore.show('Đã lưu món ăn vào nhật ký.', 'success'); }
  catch (error: unknown) { toastStore.show(error instanceof Error ? error.message : 'Không thể lưu món ăn.', 'error'); }
  finally { isSavingDiary.value = false; }
}

async function addWater(amount: number) {
  isSavingDiary.value = true;
  try { diary.value = await postNutritionWater(selectedDate.value, amount); toastStore.show(`Đã ghi nhận +${amount}ml nước`, 'success', `Tổng lượng nước: ${waterCurrentMl.value}ml / ${waterTargetMl}ml`); }
  catch (error: unknown) { toastStore.show(error instanceof Error ? error.message : 'Không thể lưu lượng nước.', 'error'); }
  finally { isSavingDiary.value = false; }
}

</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <div v-if="weekReportOpen" class="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" @click.self="weekReportOpen = false">
      <section class="max-h-[85vh] w-full max-w-2xl space-y-4 overflow-auto rounded-3xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="week-report-title">
        <header class="flex items-center justify-between"><h2 id="week-report-title" class="font-heading text-xl font-bold">Báo cáo dinh dưỡng tuần</h2><button type="button" aria-label="Đóng" @click="weekReportOpen = false">×</button></header>
        <p v-if="weekReportLoading" aria-live="polite">Đang tải báo cáo...</p>
        <p v-else-if="weekReportError" class="text-red-700" role="alert">{{ weekReportError }} <button type="button" class="underline" @click="loadWeekReport">Thử lại</button></p>
        <div v-else class="space-y-2"><article v-for="day in weekDays" :key="day.date" class="flex justify-between rounded-xl bg-[#FAF9F5] p-3 text-sm"><span>{{ new Date(`${day.date}T12:00:00`).toLocaleDateString('vi-VN') }}</span><span>{{ Math.round(day.totals.calories) }} kcal · {{ Math.round(day.totals.protein) }}g protein · {{ day.totals.waterMl }}ml nước</span></article></div>
      </section>
    </div>
    <div v-if="isProductPickerOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" @click.self="isProductPickerOpen = false">
      <section class="w-full max-w-2xl space-y-4 rounded-3xl bg-white p-5 shadow-xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="meal-product-picker-title">
        <header class="flex items-start justify-between gap-4">
          <div>
            <h2 id="meal-product-picker-title" class="font-heading text-xl font-bold">Chọn sản phẩm NutriMate</h2>
            <p class="mt-1 text-sm text-[#68725F]">Chọn sản phẩm để điền sẵn tên và Nutrition Facts vào bữa ăn.</p>
          </div>
          <button type="button" aria-label="Đóng" class="rounded-lg px-3 py-1 text-lg hover:bg-[#F3F6EE]" @click="isProductPickerOpen = false">×</button>
        </header>
        <form class="flex gap-2" @submit.prevent="loadMealProducts">
          <input v-model="productPickerSearch" type="search" placeholder="Tìm sản phẩm theo tên..." class="min-w-0 flex-1 rounded-xl border border-[#D5DFC8] px-3 py-2.5 text-sm focus:border-[#536124] focus:outline-none" />
          <button type="submit" :disabled="isProductPickerLoading" class="rounded-xl bg-[#536124] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Tìm</button>
        </form>
        <p v-if="productPickerError" role="alert" class="text-sm text-red-700">{{ productPickerError }}</p>
        <p v-else-if="isProductPickerLoading" class="py-8 text-center text-sm text-[#68725F]" aria-live="polite">Đang tải sản phẩm...</p>
        <p v-else-if="mealProductOptions.length === 0" class="py-8 text-center text-sm text-[#68725F]">Không tìm thấy sản phẩm còn hàng có đủ thông tin dinh dưỡng.</p>
        <ul v-else class="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          <li v-for="product in mealProductOptions" :key="product.id">
            <button type="button" class="flex w-full items-center gap-3 rounded-2xl border border-[#E3E8DC] p-3 text-left transition hover:border-[#8EA675] hover:bg-[#F7FAF3]" @click="chooseMealProduct(product)">
              <img :src="product.image" :alt="product.name" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <span class="min-w-0 flex-1">
                <strong class="block truncate text-sm text-[#2D3B1E]">{{ product.name }}</strong>
                <span class="mt-1 block text-xs text-[#68725F]">{{ product.nutrition.calories }} kcal · {{ product.nutrition.protein }}g protein · {{ product.nutrition.carbs }}g carbs</span>
              </span>
              <span class="shrink-0 rounded-xl bg-[#536124] px-3 py-2 text-xs font-bold text-white">Chọn</span>
            </button>
          </li>
        </ul>
      </section>
    </div>
    <div v-if="isMealModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" @click.self="isMealModalOpen = false">
      <form class="w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 shadow-xl" @submit.prevent="saveMeal">
        <div class="flex items-center justify-between"><h2 class="font-heading text-xl font-bold">Ghi món ăn</h2><button type="button" aria-label="Đóng" @click="isMealModalOpen = false">×</button></div>
        <label class="block text-sm">Tên món ăn<input v-model="mealForm.foodName" required maxlength="200" class="mt-1 w-full rounded-xl border p-3" /></label>
        <label class="block text-sm">Bữa ăn<span class="relative mt-1 block"><select v-model="mealForm.mealType" class="w-full appearance-none rounded-xl border p-3 pr-12"><option v-for="meal in mealOptions" :key="meal.id" :value="meal.id">{{ meal.title }}</option></select><ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#536124]" aria-hidden="true" /></span></label>
        <div class="grid grid-cols-2 gap-3">
          <label v-for="field in (['calories','protein','carbs','fat','sugar'] as const)" :key="field" class="block text-sm">{{ field === 'calories' ? 'Calories (kcal)' : `${field} (g)` }}<input v-model.number="mealForm[field]" type="number" min="0" :max="field === 'calories' ? 10000 : 1000" step="0.1" required class="mt-1 w-full rounded-xl border p-3" /></label>
        </div>
        <p class="text-xs text-[#68725F]">Nhập số liệu từ nhãn thực phẩm hoặc khẩu phần bạn đã xác nhận.</p>
        <div class="flex justify-end gap-3"><button type="button" class="rounded-full border px-4 py-2" @click="isMealModalOpen = false">Hủy</button><button :disabled="isSavingDiary" class="rounded-full bg-[#536124] px-5 py-2 font-bold text-white disabled:opacity-50">{{ isSavingDiary ? 'Đang lưu...' : 'Lưu món ăn' }}</button></div>
      </form>
    </div>
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
          <div class="px-4 py-2 rounded-full bg-white border border-[#D5DFC8] text-xs font-bold text-[#242424] flex items-center gap-2 shadow-2xs">
            <button type="button" aria-label="Ngày trước" @click="shiftSelectedDate(-1)">‹</button>
            <Calendar class="w-3.5 h-3.5 text-[#536124]" />
            <input aria-label="Ngày nhật ký" type="date" v-model="selectedDate" @change="loadDiary" class="bg-transparent text-xs font-bold" />
            <button type="button" aria-label="Ngày sau" @click="shiftSelectedDate(1)">›</button>
          </div>

          <button
            type="button"
            @click="openMealForm()"
            class="px-4 py-2 rounded-full bg-[#CCD7BC] hover:bg-[#BFCBB0] text-[#2D3B1E] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm món ăn hôm nay</span>
          </button>
        </div>

        <!-- Hàng 2: Nút Quét nhãn dinh dưỡng (Scan AI) -->
        <button
          type="button"
          @click="scanInput?.click()"
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
                <span class="text-[11px] text-[#7A866E]">{{ goalSubtitle }}</span>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full bg-white border border-[#D5DFC8] text-[11px] font-bold text-[#536124]">
              {{ goalLabel }}
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
                  :stroke-dasharray="`${calorieTarget === null ? 0 : Math.min(100, (diary?.totals.calories ?? 0) / calorieTarget * 100)}, 100`"
                  stroke-width="3.8"
                  stroke-linecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="absolute flex flex-col items-center justify-center text-center">
                <span class="text-[11px] text-[#7A866E] font-medium leading-none">Còn lại</span>
                <span class="font-heading text-2xl font-black text-[#242424] leading-tight mt-0.5">{{ remainingCalories ?? '—' }}</span>
                <span class="text-[10px] text-[#7A866E] font-bold leading-none">kcal</span>
              </div>
            </div>

            <!-- Cột thông số Calo bên phải -->
            <div class="space-y-2.5 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#7A866E]"></span>
                <span class="text-[#7A866E]">Mục tiêu ngày:</span>
                <span class="font-bold text-[#242424]">{{ calorieTarget === null ? 'Chưa thiết lập' : `${calorieTarget.toLocaleString('vi-VN')} kcal` }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#536124]"></span>
                <span class="text-[#7A866E]">Đã nạp vào:</span>
                <span class="font-bold text-[#242424]">{{ diary?.totals.calories ?? 0 }} kcal</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hộp Đánh giá nhanh dưới đáy -->
        <div class="p-3.5 rounded-2xl bg-[#EBF7E5] border border-[#CCD7BC] text-xs text-[#2D3B1E] flex items-center gap-2">
          <span class="text-sm">🍃</span>
          <span><strong>Đánh giá nhanh:</strong> {{ calorieTarget === null ? 'Hãy hoàn thiện hồ sơ để thiết lập mục tiêu Calories.' : `Đã ghi ${diary?.totals.calories ?? 0} / ${calorieTarget} kcal.` }}</span>
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
            <span class="text-xs text-[#7A866E]">Đã ghi {{ diary?.meals.length ?? 0 }} món</span>
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
                <span class="text-[#242424]">{{ mealTotals.protein.toFixed(1) }}g <span class="text-[#7A866E] font-normal">/ {{ proteinTarget === null ? '—' : `${proteinTarget}g` }}</span></span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-[#F0F4EA] overflow-hidden">
                <div class="h-full bg-[#536124] rounded-full" :style="{ width: `${proteinTarget ? Math.min(100, mealTotals.protein / proteinTarget * 100) : 0}%` }"></div>
              </div>
            </div>

            <!-- Carbs -->
            <div>
              <div class="flex justify-between text-xs mb-1.5 font-bold">
                <span class="text-[#242424]">■ Carbohydrate (Carbs)</span>
                <span class="text-[#242424]">{{ mealTotals.carbs.toFixed(1) }}g <span class="text-[#7A866E] font-normal">/ {{ carbsTarget === null ? '—' : `${carbsTarget}g` }}</span></span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-[#F0F4EA] overflow-hidden">
                <div class="h-full bg-[#A38038] rounded-full" :style="{ width: `${Math.min(100, carbsPercent)}%` }"></div>
              </div>
            </div>

            <!-- Fat -->
            <div>
              <div class="flex justify-between text-xs mb-1.5 font-bold">
                <span class="text-[#242424]">■ Chất béo (Fat)</span>
                <span class="text-[#242424]">{{ mealTotals.fat.toFixed(1) }}g <span class="text-[#7A866E] font-normal">/ {{ fatTarget === null ? '—' : `${fatTarget}g` }}</span></span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-[#F0F4EA] overflow-hidden">
                <div class="h-full bg-[#C2672B] rounded-full" :style="{ width: `${Math.min(100, fatPercent)}%` }"></div>
              </div>
            </div>

            <!-- Sugar -->
            <div>
              <div class="flex justify-between text-xs mb-1.5 font-bold">
                <span class="text-[#242424]">■ Đường (Sugar)</span>
                <span class="text-[#242424]">{{ mealTotals.sugar.toFixed(1) }}g <span class="text-[#7A866E] font-normal">/ tối đa {{ sugarMax }}g</span></span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-[#F0F4EA] overflow-hidden">
                <div class="h-full bg-[#4A729A] rounded-full" :style="{ width: `${Math.min(100, sugarPercent)}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between text-xs pt-3 border-t border-[#F0F3EC]">
          <span class="text-[#536124] font-bold flex items-center gap-1">
            <Check v-if="hasDiaryData && !dailySugarExceeded" class="w-3.5 h-3.5 stroke-[2.5]" />
            <span :class="dailySugarExceeded ? 'text-[#C5281C]' : ''">{{ !hasDiaryData ? 'Chưa có dữ liệu bữa ăn' : dailySugarExceeded ? `Vượt giới hạn đường ${ (mealTotals.sugar - sugarMax).toFixed(1) }g` : 'Trong giới hạn đường' }}</span>
          </span>
          <span class="text-[#68725F]" :class="proteinOverTarget > 0 ? 'text-[#C5281C]' : ''">
            {{ proteinRemaining === null ? 'Hoàn thiện hồ sơ để đặt mục tiêu macro' : proteinOverTarget > 0 ? `Vượt ${proteinOverTarget.toFixed(1)}g Đạm` : `Thiếu: ${proteinRemaining.toFixed(1)}g Đạm` }}
          </span>
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
            <span class="text-xs font-bold text-[#242424]">{{ Math.min(100, Math.round(waterCurrentMl / waterTargetMl * 100)) }}%</span>
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
              @click="addWater(idx === 7 ? 200 : 250)"
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
            <span v-if="reminderTime">Nhắc nhở: {{ reminderTime.text }} Uống trước {{ reminderTime.deadline }}.</span>
            <span v-else-if="selectedDate !== today">Nhắc nhở chỉ áp dụng cho ngày hôm nay.</span>
            <span v-else-if="waterCurrentMl >= waterTargetMl">Bạn đã đạt mục tiêu uống nước hôm nay.</span>
            <span v-else>Không còn nhắc uống trước 16:00 hôm nay. Hãy tiếp tục uống nước đều đặn.</span>
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
        <button type="button" @click="loadWeekReport" class="text-xs sm:text-sm font-bold text-[#536124] hover:underline">Xem báo cáo tuần →</button>
      </div>

      <!-- 4 Cards Bữa Ăn (3 thẻ trắng, Thẻ thứ 4 có nền Xanh Mint Nhạt #EBF7E5 như Figma 08) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <p v-if="isLoadingDiary" class="col-span-full text-center text-sm text-[#7A866E]">Đang tải nhật ký...</p>
        <div v-else-if="diaryError" class="col-span-full rounded-2xl bg-red-50 p-4 text-sm text-red-800" role="alert">
          {{ diaryError }} <button type="button" class="ml-2 font-bold underline" @click="loadDiary">Thử lại</button>
        </div>
        <article v-for="meal in mealsByType" :key="meal.id" class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
          <header class="flex items-start justify-between border-b border-[#F0F3EC] pb-3.5">
            <h3 class="font-heading text-sm font-bold">{{ meal.emoji }} {{ meal.title }}</h3>
            <div class="text-right text-xs"><strong>{{ meal.calories }} kcal</strong></div>
          </header>
          <p v-if="meal.items.length === 0" class="py-4 text-xs text-[#7A866E]">Chưa ghi nhận món ăn.</p>
          <ul v-else class="space-y-2 text-xs">
            <li v-for="item in meal.items" :key="item.id" class="rounded-xl bg-[#FAF9F5] p-3">
              <strong class="block">{{ item.foodName }}</strong>
              <span class="text-[#7A866E]">{{ item.calories }} kcal · {{ item.protein }}g đạm · {{ item.carbs }}g carbs · {{ item.fat }}g fat · {{ item.sugar }}g sugar</span>
            </li>
          </ul>
          <button type="button" class="font-bold text-xs text-[#536124] hover:underline" @click="openMealForm(meal.id)">+ Thêm món</button>
        </article>

      </div>
    </div>

    <!-- Section: Quét Nhãn Dinh Dưỡng Thông Minh Bằng Camera (Nền Mint Nhạt #EDF4E7 Chuẩn Figma 08) -->
    <div class="p-8 sm:p-12 rounded-4xl bg-[#EDF4E7] border border-[#CCD7BC] shadow-xs">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <!-- Cột Trái -->
        <div class="lg:col-span-7 space-y-5">
          <span class="inline-block text-xs font-bold text-[#536124] bg-white px-3.5 py-1.5 rounded-full border border-[#CCD7BC]">
            Công nghệ Trí tuệ Nhân tạo NutriVision
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#242424]">
            Quét nhãn dinh dưỡng thông minh bằng Camera
          </h2>
          <p class="text-xs sm:text-sm text-[#576449] leading-relaxed max-w-xl">
            Chụp ảnh bảng thành phần dinh dưỡng phía sau bất kỳ bao bì thực phẩm nào, NutriBot sẽ tự động trích xuất Calo, Đạm, Đường và đồng bộ ngay vào Nhật ký dinh dưỡng của bạn mà không cần nhập thủ công.
          </p>

          <input ref="scanInput" class="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" @change="analyzeSelectedImage" />
          <p v-if="scanError" class="text-sm text-red-700" role="alert">{{ scanError }}</p>
          <p v-if="isScanLoading" class="text-sm" aria-live="polite">Đang phân tích ảnh...</p>
          <div class="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              @click="openMealProductPicker"
              class="px-6 py-3.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingBag class="w-4.5 h-4.5" />
              <span>Chọn sản phẩm NutriMate</span>
            </button>
            <button
              type="button"
              @click="scanInput?.click()"
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

            <div v-if="!scanIsLabel" class="space-y-2.5 text-xs sm:text-sm border-t border-b border-[#F0F3EC] py-3">
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Calories:</span>
                <span class="font-bold text-[#242424]">{{ scanResult?.predictedCalories ?? '—' }} kcal</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Protein:</span>
                <span class="font-bold text-[#242424]">{{ scanResult?.predictedProtein ?? '—' }}g</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Total Fat:</span>
                <span class="font-bold text-[#242424]">{{ scanResult?.predictedFat ?? '—' }}g</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Carbohydrates:</span>
                <span class="font-bold text-[#242424]">{{ scanResult?.predictedCarbs ?? '—' }}g</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#7A866E]">Total Sugar:</span>
                <span class="font-bold text-[#242424]">{{ scanResult?.predictedSugar ?? '—' }}g</span>
              </div>
            </div>

            <div v-if="scanIsLabel && scanLabelRows.length" class="space-y-2.5 border-y border-[#F0F3EC] py-3 text-xs sm:text-sm">
              <div v-for="row in scanLabelRows" :key="row.label" class="flex justify-between gap-4">
                <span class="text-[#7A866E]">{{ row.label }}:</span>
                <span class="text-right font-bold text-[#242424]">{{ row.value }}</span>
              </div>
            </div>

            <p class="text-center text-xs font-bold text-[#536124]">{{ scanResult?.status === 'completed' ? (scanIsLabel ? 'Đã đọc thông tin trên nhãn' : 'Đã ước lượng dinh dưỡng từ ảnh') : scanResult?.status === 'unrecognized' ? 'Không nhận diện được món ăn/nhãn.' : 'Chưa có kết quả phân tích.' }}</p>
            <p class="text-center text-xs text-[#68725F]">Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.</p>
            <button v-if="scanResult?.status === 'completed'" type="button" class="w-full rounded-xl bg-[#536124] p-3 font-bold text-white" @click="addScanResultToDiary">Kiểm tra và ghi vào nhật ký</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Gợi Ý Thực Phẩm Bổ Sung Thiếu Hụt (Figma 08) -->
    <div class="space-y-6 pt-2">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-heading text-2xl font-black text-[#242424] flex items-center gap-2">
            Gợi ý Thực phẩm Bổ sung Thiếu hụt
          </h2>
          <p class="text-xs sm:text-sm text-[#7A866E] mt-1">{{ proteinSuggestionMessage }}</p>
        </div>
        <RouterLink to="/catalog" class="text-xs sm:text-sm font-bold text-[#536124] hover:underline">
          Xem tất cả thực phẩm sạch →
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <p v-if="recommendationError" class="col-span-full rounded-2xl bg-white p-6 text-sm text-[#7A866E]">{{ recommendationError }}</p>
        <p v-else-if="rankedRecommendedProducts.length === 0" class="col-span-full rounded-2xl bg-white p-6 text-sm text-[#7A866E]">Hiện không có sản phẩm còn hàng phù hợp.</p>
        <article v-for="product in rankedRecommendedProducts" :key="product.id" class="flex items-center gap-5 rounded-3xl border border-[#E3E8DC] bg-white p-6">
          <button type="button" class="shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#536124]" :aria-label="`Xem chi tiết ${product.name}`" @click="openRecommendedProduct(product)">
            <img v-if="product.image && !failedProductImages.includes(product.id)" :src="product.image" :alt="product.name" class="h-24 w-24 rounded-2xl object-cover" @error="markProductImageFailed(product.id)" />
            <span v-else class="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#EBF7E5] p-2 text-center text-xs text-[#536124]">{{ product.name }}</span>
          </button>
          <div class="min-w-0 flex-1"><h3 class="truncate font-bold"><button type="button" class="text-left hover:text-[#536124] hover:underline" @click="openRecommendedProduct(product)">{{ product.name }}</button></h3><p class="text-xs text-[#7A866E]">{{ product.nutrition.protein }}g Protein · {{ product.nutrition.carbs }}g Carbs · {{ product.nutrition.fat }}g Fat / {{ product.nutrition.servingSize }}</p><p class="font-bold">{{ product.price.toLocaleString("vi-VN") }} đ</p><button type="button" :disabled="product.stock <= 0" class="rounded-xl bg-[#536124] px-4 py-2 text-xs font-bold text-white disabled:opacity-50" @click="addRecommendedProduct(product)">Thêm vào giỏ</button></div>
        </article>
      </div>
    </div>
  </div>
</template>
