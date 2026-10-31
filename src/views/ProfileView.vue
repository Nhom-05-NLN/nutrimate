<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ActivityLevel, CaloriePlanResponse, CalorieProfileInput, NutritionGoal } from '../types';
import { fetchCaloriePlan, saveCalorieProfile } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import {
  ChevronRight,
  Camera,
  Edit3,
  ArrowRight,
  Save,
  Bot,
  Activity,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const toastStore = useToastStore();

const isEditing = ref(false);

const profile = ref({
  name: authStore.currentUser?.name || '',
  birthDate: authStore.currentUser?.birthDate || '1998-06-18',
  phone: authStore.currentUser?.phone || '0912 345 678',
  email: authStore.currentUser?.email || 'minhanh.fit@gmail.com',
  city: authStore.currentUser?.city || 'TP. Hồ Chí Minh',
  heightCm: null as number | null,
  weightKg: null as number | null,
  age: null as number | null,
  gender: null as CalorieProfileInput['gender'] | null,
});

watch(
  () => authStore.currentUser?.name,
  (name) => {
    if (name) profile.value.name = name;
  },
  { immediate: true },
);

const caloriePlanData = ref<CaloriePlanResponse | null>(null);
const caloriePlan = computed(() => caloriePlanData.value?.plan ?? null);
const planLoading = ref(true);
const planSaving = ref(false);
const planError = ref('');
const selectedGoal = ref<NutritionGoal | null>(null);
const activityLevel = ref<ActivityLevel | null>(null);
const goalLabels: Record<NutritionGoal, string> = {
  lose_weight: 'Giảm cân',
  maintain_weight: 'Duy trì cân nặng',
  gain_weight: 'Tăng cân lành mạnh',
};
const goalOptions: { value: NutritionGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Giảm cân' },
  { value: 'maintain_weight', label: 'Duy trì cân nặng' },
  { value: 'gain_weight', label: 'Tăng cân lành mạnh' },
];
const activityOptions: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Ít vận động' },
  { value: 'light', label: 'Vận động nhẹ' },
  { value: 'moderate', label: 'Vận động vừa' },
  { value: 'high', label: 'Vận động nhiều' },
];
const bmiCategory = computed(() => {
  const bmi = caloriePlan.value?.bmi;
  if (bmi === undefined) return 'Chưa đủ dữ liệu';
  if (bmi < 18.5) return 'Thiếu cân';
  if (bmi < 23) return 'Bình thường';
  if (bmi < 25) return 'Thừa cân';
  return 'Béo phì';
});
const dietPreferences = ref(['Low-Carb', 'Giàu Protein', 'Ít đường', 'Không bột ngọt']);

function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('vi-VN');
}

function applyCaloriePlan(data: CaloriePlanResponse) {
  caloriePlanData.value = data;
  profile.value.heightCm = data.profile.heightCm;
  profile.value.weightKg = data.profile.weightKg;
  profile.value.age = data.profile.age;
  profile.value.gender = data.profile.gender;
  selectedGoal.value = data.profile.nutritionGoal;
  activityLevel.value = data.profile.activityLevel;
}

async function loadCaloriePlan() {
  planLoading.value = true;
  planError.value = '';
  try {
    applyCaloriePlan(await fetchCaloriePlan());
  } catch (error: unknown) {
    planError.value = error instanceof Error ? error.message : 'Không thể tải hồ sơ Calories.';
  } finally {
    planLoading.value = false;
  }
}

async function saveCaloriePlan() {
  if (
    profile.value.heightCm === null || profile.value.weightKg === null ||
    profile.value.age === null || profile.value.gender === null ||
    activityLevel.value === null || selectedGoal.value === null
  ) {
    planError.value = 'Vui lòng nhập đầy đủ chỉ số cơ thể, mức độ hoạt động và mục tiêu.';
    return;
  }

  const payload: CalorieProfileInput = {
    heightCm: profile.value.heightCm,
    weightKg: profile.value.weightKg,
    age: profile.value.age,
    gender: profile.value.gender,
    activityLevel: activityLevel.value,
    nutritionGoal: selectedGoal.value,
  };

  planSaving.value = true;
  planError.value = '';
  try {
    applyCaloriePlan(await saveCalorieProfile(payload));
    isEditing.value = false;
    toastStore.show('Đã lưu hồ sơ và cập nhật lộ trình Calories.', 'success');
  } catch (error: unknown) {
    planError.value = error instanceof Error ? error.message : 'Không thể lưu lộ trình Calories.';
  } finally {
    planSaving.value = false;
  }
}

onMounted(loadCaloriePlan);

function togglePreference(pref: string) {
  if (dietPreferences.value.includes(pref)) {
    dietPreferences.value = dietPreferences.value.filter((p) => p !== pref);
  } else {
    dietPreferences.value.push(pref);
  }
}

function handleSave() {
  authStore.updateProfile({
    name: profile.value.name,
    phone: profile.value.phone,
    email: profile.value.email,
    city: profile.value.city,
    birthDate: profile.value.birthDate,
  });
  toastStore.show('Đã lưu thông tin hồ sơ cá nhân thành công!', 'success');
}
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#242424]">Trang chủ</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <span class="hover:text-[#242424]">Thành viên NutriMate</span>
      <ChevronRight class="w-4 h-4" />
      <span class="text-[#242424] font-bold">Hồ sơ dinh dưỡng cá nhân</span>
    </nav>

    <!-- Top Profile Banner Card (Figma 07) -->
    <div class="p-7 sm:p-9 rounded-4xl bg-linear-to-r from-[#EBF7E5] via-[#F4F7EE] to-[#FAF9F5] border border-[#CCD7BC] shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <!-- Avatar với Icon Camera -->
          <div class="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              alt="Avatar"
              class="w-22 h-22 sm:w-26 sm:h-26 rounded-3xl object-cover border-2 border-white shadow-md"
            />
            <button
              type="button"
              class="absolute -bottom-1 -right-1 p-2 rounded-xl bg-[#4D6A34] text-white hover:bg-[#3B4E24] shadow-xs transition-colors cursor-pointer"
              title="Thay đổi ảnh đại diện"
            >
              <Camera class="w-4 h-4" />
            </button>
          </div>

          <!-- Thông tin tổng quan (To, rõ, dễ đọc) -->
          <div class="space-y-2">
            <h1 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#242424]">
              {{ profile.name || 'Tài khoản' }}
            </h1>

            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#CCD7BC] text-xs font-bold text-[#E8A020]">
              <span>★</span>
              <span class="text-[#242424]">Hội Viên Vàng (Gold Member) • 490 NutriPoints</span>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-sm text-[#576449] pt-1">
              <span>Chế độ ăn: <strong class="text-[#242424]">Eat Clean & Low-Carb</strong></span>
              <span>•</span>
              <span>Mục tiêu: <strong class="text-[#242424]">{{ selectedGoal ? goalLabels[selectedGoal] : 'Chưa thiết lập' }}</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="isEditing = !isEditing"
          class="px-6 py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 min-h-[46px] cursor-pointer"
        >
          <Edit3 class="w-4 h-4" />
          <span>Cập nhật số đo hôm nay</span>
        </button>
      </div>
    </div>

    <!-- 2 Columns Grid: BMI Analysis (Left) vs Personal Info & Macro Goals (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <!-- Cột Trái: Phân tích Thể Trạng & Chỉ Số BMI (Figma 07) -->
      <div class="lg:col-span-5 space-y-6">
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-6">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
            <div class="flex items-center gap-2.5">
              <Activity class="w-5 h-5 text-[#4D6A34]" />
              <h2 class="font-heading text-base font-bold text-[#242424]">
                Phân tích Thể Trạng & Chỉ Số BMI
              </h2>
            </div>
            <span class="text-xs text-[#7A866E] uppercase font-bold">WHO 2024</span>
          </div>

          <!-- 4 Ô Thông số thể trạng (Font to rõ ràng) -->
          <div class="grid grid-cols-4 gap-2.5 text-center">
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Chiều cao</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">{{ profile.heightCm ?? '—' }} <span class="text-xs font-normal">cm</span></span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Cân nặng</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">{{ profile.weightKg ?? '—' }} <span class="text-xs font-normal">kg</span></span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Tuổi</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">{{ profile.age ?? '—' }}</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Giới tính</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">{{ profile.gender === 'female' ? 'Nữ' : profile.gender === 'male' ? 'Nam' : profile.gender === 'other' ? 'Khác' : '—' }}</span>
            </div>
          </div>

          <div v-if="isEditing" class="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-[#CCD7BC] bg-[#FAF9F5] p-4">
            <label class="text-xs font-bold text-[#576449]">Chiều cao (cm)
              <input v-model.number="profile.heightCm" type="number" min="80" max="250" step="0.1" class="mt-1 w-full rounded-xl border border-[#DEE5D4] bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-bold text-[#576449]">Cân nặng (kg)
              <input v-model.number="profile.weightKg" type="number" min="20" max="400" step="0.1" class="mt-1 w-full rounded-xl border border-[#DEE5D4] bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-bold text-[#576449]">Tuổi
              <input v-model.number="profile.age" type="number" min="13" max="120" step="1" class="mt-1 w-full rounded-xl border border-[#DEE5D4] bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-bold text-[#576449]">Giới tính dùng cho công thức
              <select v-model="profile.gender" class="mt-1 w-full rounded-xl border border-[#DEE5D4] bg-white px-3 py-2 text-sm">
                <option :value="null" disabled>Chọn giới tính</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác / hệ số trung bình</option>
              </select>
            </label>
            <label class="text-xs font-bold text-[#576449] sm:col-span-2">Mức độ hoạt động
              <select v-model="activityLevel" class="mt-1 w-full rounded-xl border border-[#DEE5D4] bg-white px-3 py-2 text-sm">
                <option :value="null" disabled>Chọn mức độ hoạt động</option>
                <option v-for="option in activityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
          </div>

          <!-- Card Chỉ Số Khối Cơ Thể BMI -->
          <div class="p-5 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] space-y-4">
            <div class="flex items-baseline justify-between">
              <div>
                <span class="text-xs text-[#7A866E] uppercase font-bold block">Chỉ số khối cơ thể (BMI)</span>
                <span class="font-heading text-4xl font-black text-[#242424]">{{ caloriePlan?.bmi ?? '—' }} <span class="text-sm font-normal text-[#7A866E]">kg/m²</span></span>
              </div>
              <div class="text-right">
                <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#4D6A34] text-white text-xs font-bold shadow-2xs">
                  {{ caloriePlan ? `✓ ${bmiCategory}` : bmiCategory }}
                </span>
                <span class="text-xs text-[#4D6A34] block font-semibold mt-1">{{ caloriePlan ? 'Chỉ số tham khảo theo BMI' : 'Bổ sung hồ sơ để xem phân tích' }}</span>
              </div>
            </div>

            <!-- Thước Đo Phân Vùng Chuẩn WHO 4 Màu -->
            <div class="space-y-2 pt-2">
              <div class="flex justify-between text-xs text-[#7A866E]">
                <span>Thước đo phân vùng chuẩn WHO</span>
                <span class="font-bold text-[#4D6A34]">Điểm rơi: {{ caloriePlan?.bmi ?? '—' }}</span>
              </div>

              <!-- Thanh phân vùng -->
              <div class="h-3.5 w-full rounded-full bg-slate-200 overflow-hidden flex relative">
                <div class="w-[20%] bg-sky-300" title="Thiếu cân < 18.5"></div>
                <div class="w-[45%] bg-[#4D6A34]" title="Cân đối 18.5 - 22.9"></div>
                <div class="w-[20%] bg-amber-400" title="Thừa cân 23.0 - 24.9"></div>
                <div class="w-[15%] bg-rose-400" title="Béo phì >= 25.0"></div>
              </div>

              <div class="grid grid-cols-4 text-[10px] text-[#7A866E] text-center pt-1 font-medium">
                <div>Thiếu cân<br />&lt; 18.5</div>
                <div class="font-bold text-[#4D6A34]">Cân đối<br />18.5 - 22.9</div>
                <div>Thừa cân<br />23.0 - 24.9</div>
                <div>Béo phì<br />≥ 25.0</div>
              </div>
            </div>
          </div>

          <!-- BMR & TDEE (Chỉ số to rõ) -->
          <div class="grid grid-cols-2 gap-3.5">
            <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC]">
              <span class="text-xs text-[#7A866E] font-medium block">⚡ Chỉ số BMR</span>
              <span class="font-heading text-xl font-black text-[#242424] mt-0.5 block">{{ formatNumber(caloriePlan?.bmrKcal) }} <span class="text-xs font-normal">kcal</span></span>
              <span class="text-xs text-[#7A866E] block mt-1">Tiêu hao cơ bản tĩnh</span>
            </div>
            <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC]">
              <span class="text-xs text-[#7A866E] font-medium block">🏃 Chỉ số TDEE</span>
              <span class="font-heading text-xl font-black text-[#4D6A34] mt-0.5 block">{{ formatNumber(caloriePlan?.tdeeKcal) }} <span class="text-xs font-normal">kcal</span></span>
              <span class="text-xs text-[#7A866E] block mt-1">Tiêu hao kèm vận động</span>
            </div>
          </div>

          <!-- Lời khuyên từ NutriBot AI -->
          <div class="p-5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] space-y-2.5">
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="font-bold text-[#242424] flex items-center gap-2">
                <Bot class="w-4.5 h-4.5 text-[#4D6A34]" />
                Lời khuyên từ NutriBot AI
              </span>
              <span class="text-xs text-[#7A866E]">Cá nhân hoá</span>
            </div>
            <p v-if="caloriePlan" class="text-xs sm:text-sm text-[#4E5C3E] leading-relaxed">
              Theo hồ sơ hiện tại, mục tiêu của bạn là <strong>{{ goalLabels[caloriePlan.nutritionGoal] }}</strong> với mức năng lượng tham khảo <strong>{{ formatNumber(caloriePlan.targetCalories) }} kcal/ngày</strong>.
              Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.
            </p>
            <p v-else class="text-xs sm:text-sm text-[#4E5C3E] leading-relaxed">{{ planLoading ? 'Đang tải lộ trình Calories…' : 'Chưa có lộ trình. Hãy cập nhật số đo và mục tiêu ở mục bên phải.' }}</p>
          </div>
        </div>

        <!-- Gói thực phẩm gợi ý -->
        <div class="p-5 rounded-3xl bg-white border border-[#E3E8DC] shadow-2xs flex items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=140&q=80"
              alt="combo"
              class="w-16 h-16 rounded-2xl object-cover"
            />
            <div>
              <span class="text-xs font-bold text-[#7A866E] uppercase block">Gói thực phẩm gợi ý</span>
              <h4 class="font-heading text-sm font-bold text-[#242424]">Combo Eat Clean Săn Cơ</h4>
              <span class="text-xs text-[#4D6A34] font-semibold">Giàu Protein, chuẩn 1.550 kcal</span>
            </div>
          </div>
          <RouterLink
            to="/catalog"
            class="w-11 h-11 rounded-2xl bg-[#EBF7E5] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowRight class="w-5 h-5" />
          </RouterLink>
        </div>
      </div>

      <!-- Cột Phải: Thông Tin Cá Nhân & Mục Tiêu Macro (Figma 07) -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Card 1: Thông tin cá nhân & liên hệ -->
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
            <h2 class="font-heading text-base font-bold text-[#242424]">
              Thông tin cá nhân & Liên hệ
            </h2>
            <span class="px-3 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34]">
              ✓ Đã xác thực
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-[#576449] block mb-1.5">Họ và tên</label>
              <input
                type="text"
                v-model="profile.name"
                class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-[#576449] block mb-1.5">Ngày sinh</label>
              <input
                type="date"
                v-model="profile.birthDate"
                class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-[#576449] block mb-1.5">Số điện thoại</label>
              <input
                type="text"
                v-model="profile.phone"
                class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-[#576449] block mb-1.5">Email</label>
              <input
                type="email"
                v-model="profile.email"
                class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-[#576449] block mb-1.5">Tỉnh / Thành phố</label>
            <input
              type="text"
              v-model="profile.city"
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
            />
          </div>

          <div class="pt-3 flex justify-end">
            <button
              type="button"
              @click="handleSave"
              class="px-7 py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Save class="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>

        <!-- Card 2: Mục tiêu dinh dưỡng & Chế độ ăn uống (Figma 07) -->
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-6">
          <div class="border-b border-[#F0F3EC] pb-4">
            <h2 class="font-heading text-base font-bold text-[#242424]">
              Mục tiêu dinh dưỡng & Chế độ ăn uống
            </h2>
            <p class="text-xs text-[#7A866E]">Định hình tỷ lệ Macro và lượng Calo hàng ngày</p>
          </div>

          <!-- Mục tiêu thể chất trọng tâm -->
          <div class="space-y-2.5">
            <span class="text-xs font-bold text-[#242424] block">Mục tiêu thể chất trọng tâm</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                v-for="goal in goalOptions"
                :key="goal.value"
                type="button"
                @click="selectedGoal = goal.value"
                class="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer"
                :class="
                  selectedGoal === goal.value
                    ? 'bg-[#4D6A34] text-white border-[#4D6A34] shadow-2xs'
                    : 'bg-[#FAF9F5] text-[#576449] border-[#DEE5D4] hover:bg-white'
                "
              >
                {{ goal.label }}
              </button>
            </div>
          </div>

          <div class="space-y-2.5 pt-3 border-t border-[#F0F3EC]">
            <label class="text-xs font-bold text-[#242424] block" for="profile-activity-level">Mức độ hoạt động để tính Calories</label>
            <select id="profile-activity-level" v-model="activityLevel" class="w-full sm:max-w-md px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm text-[#242424]">
              <option :value="null" disabled>Chọn mức độ hoạt động</option>
              <option v-for="option in activityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>

          <!-- Tiêu chí chế độ dinh dưỡng áp dụng -->
          <div class="space-y-2.5 pt-3 border-t border-[#F0F3EC]">
            <span class="text-xs font-bold text-[#242424] block">Tiêu chí chế độ dinh dưỡng áp dụng</span>
            <div class="flex flex-wrap gap-2.5">
              <button
                v-for="pref in ['Low-Carb', 'Giàu Protein', 'Ít đường', 'Không bột ngọt', 'Keto chuẩn']"
                :key="pref"
                type="button"
                @click="togglePreference(pref)"
                class="px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer"
                :class="
                  dietPreferences.includes(pref)
                    ? 'bg-[#EBF7E5] text-[#3B4E24] border-[#CCD7BC] font-bold'
                    : 'bg-white text-[#7A866E] border-[#E3E8DC]'
                "
              >
                <span v-if="dietPreferences.includes(pref)">✓</span>
                <span>{{ pref }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-4 pt-3 border-t border-[#F0F3EC]">
            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span class="font-bold text-[#242424]">Mục tiêu Calories mỗi ngày</span>
              <span v-if="caloriePlan" class="font-heading text-xl font-black text-[#4D6A34]">{{ formatNumber(caloriePlan.targetCalories) }} kcal/ngày</span>
              <span v-else class="text-xs text-[#7A866E]">{{ planLoading ? 'Đang tải…' : 'Chưa có lộ trình' }}</span>
            </div>

            <div v-if="caloriePlan" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div class="rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4] p-4">
                <span class="text-xs text-[#7A866E] block">TDEE theo hoạt động</span>
                <strong class="mt-1 block text-[#242424]">{{ formatNumber(caloriePlan.tdeeKcal) }} kcal/ngày</strong>
              </div>
              <div class="rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4] p-4">
                <span class="text-xs text-[#7A866E] block">Điều chỉnh theo mục tiêu</span>
                <strong class="mt-1 block text-[#242424]">{{ caloriePlan.adjustmentKcal > 0 ? '+' : '' }}{{ formatNumber(caloriePlan.adjustmentKcal) }} kcal/ngày</strong>
              </div>
            </div>

            <p v-if="planError" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">{{ planError }}</p>
            <p class="text-xs leading-5 text-[#7A866E]">Ước tính dùng công thức Mifflin–St Jeor và hệ số hoạt động đã chọn; mục tiêu giảm/tăng dùng mức điều chỉnh 300 kcal/ngày. Đây là giả định tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.</p>
            <button
              type="button"
              :disabled="planSaving || planLoading"
              @click="saveCaloriePlan"
              class="w-full py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] disabled:opacity-60 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer"
            >
              <Save class="w-4 h-4" />
              <span>{{ planSaving ? 'Đang lưu hồ sơ…' : 'Lưu hồ sơ và cập nhật lộ trình Calories' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
