<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import {
  ChevronRight,
  Camera,
  Edit3,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Save,
  Bot,
  Activity,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const isEditing = ref(false);

const profile = ref({
  name: authStore.currentUser?.name || 'Nguyễn Minh Anh',
  birthDate: authStore.currentUser?.birthDate || '1998-06-18',
  phone: authStore.currentUser?.phone || '0912 345 678',
  email: authStore.currentUser?.email || 'minhanh.fit@gmail.com',
  city: authStore.currentUser?.city || 'TP. Hồ Chí Minh',
  heightCm: authStore.currentUser?.heightCm || 165,
  weightKg: authStore.currentUser?.weightKg || 58.5,
  age: authStore.currentUser?.age || 26,
  gender: authStore.currentUser?.gender || 'female',
});

const selectedGoal = ref('Giảm mỡ tăng cơ');
const dietPreferences = ref(['Low-Carb', 'Giàu Protein', 'Ít đường', 'Không bột ngọt']);

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
              {{ profile.name }}
            </h1>

            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#CCD7BC] text-xs font-bold text-[#E8A020]">
              <span>★</span>
              <span class="text-[#242424]">Hội Viên Vàng (Gold Member) • 490 NutriPoints</span>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-sm text-[#576449] pt-1">
              <span>Chế độ ăn: <strong class="text-[#242424]">Eat Clean & Low-Carb</strong></span>
              <span>•</span>
              <span>Mục tiêu: <strong class="text-[#242424]">Giảm 3kg mỡ và săn chắc cơ bắp</strong></span>
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
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">165 <span class="text-xs font-normal">cm</span></span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Cân nặng</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">58.5 <span class="text-xs font-normal">kg</span></span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Tuổi</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">26</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Giới tính</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">Nữ</span>
            </div>
          </div>

          <!-- Card Chỉ Số Khối Cơ Thể BMI -->
          <div class="p-5 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] space-y-4">
            <div class="flex items-baseline justify-between">
              <div>
                <span class="text-xs text-[#7A866E] uppercase font-bold block">Chỉ số khối cơ thể (BMI)</span>
                <span class="font-heading text-4xl font-black text-[#242424]">21.5 <span class="text-sm font-normal text-[#7A866E]">kg/m²</span></span>
              </div>
              <div class="text-right">
                <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#4D6A34] text-white text-xs font-bold shadow-2xs">
                  ✓ Bình thường
                </span>
                <span class="text-xs text-[#4D6A34] block font-semibold mt-1">Thể trạng Cân đối lý tưởng</span>
              </div>
            </div>

            <!-- Thước Đo Phân Vùng Chuẩn WHO 4 Màu -->
            <div class="space-y-2 pt-2">
              <div class="flex justify-between text-xs text-[#7A866E]">
                <span>Thước đo phân vùng chuẩn WHO</span>
                <span class="font-bold text-[#4D6A34]">Điểm rơi: 21.5</span>
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
              <span class="font-heading text-xl font-black text-[#242424] mt-0.5 block">1.340 <span class="text-xs font-normal">kcal</span></span>
              <span class="text-xs text-[#7A866E] block mt-1">Tiêu hao cơ bản tĩnh</span>
            </div>
            <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC]">
              <span class="text-xs text-[#7A866E] font-medium block">🏃 Chỉ số TDEE</span>
              <span class="font-heading text-xl font-black text-[#4D6A34] mt-0.5 block">1.850 <span class="text-xs font-normal">kcal</span></span>
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
            <p class="text-xs sm:text-sm text-[#4E5C3E] leading-relaxed">
              "Với BMI 21.5 và thể trạng cân đối, để săn chắc cơ bắp, mức calo thâm hụt nhẹ an toàn là <strong>1.550 kcal/ngày</strong>. Ưu tiên nạp 75–85g Protein từ ức gà sấy và các loại hạt dinh dưỡng NutriMate."
            </p>
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
                v-for="goal in ['Giảm mỡ tăng cơ', 'Duy trì cân nặng', 'Tăng cân lành mạnh', 'Ăn sạch Eat Clean']"
                :key="goal"
                type="button"
                @click="selectedGoal = goal"
                class="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer"
                :class="
                  selectedGoal === goal
                    ? 'bg-[#4D6A34] text-white border-[#4D6A34] shadow-2xs'
                    : 'bg-[#FAF9F5] text-[#576449] border-[#DEE5D4] hover:bg-white'
                "
              >
                {{ goal }}
              </button>
            </div>
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

          <!-- Tỷ lệ phân bổ Macros mục tiêu (1.550 kcal) -->
          <div class="space-y-3.5 pt-3 border-t border-[#F0F3EC]">
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="font-bold text-[#242424]">Tỷ lệ phân bổ Macros mục tiêu (1.550 kcal)</span>
              <span class="text-[#4D6A34] font-bold">100% Khớp mục tiêu</span>
            </div>

            <!-- Macro Progress Bar -->
            <div class="h-4 w-full rounded-full bg-slate-200 overflow-hidden flex">
              <div class="w-[25%] bg-[#4D6A34]" title="Protein 25%"></div>
              <div class="w-[45%] bg-[#7F9C5B]" title="Carbs 45%"></div>
              <div class="w-[30%] bg-[#D4A373]" title="Fat 30%"></div>
            </div>

            <div class="grid grid-cols-3 gap-3 text-center text-xs">
              <div class="p-3.5 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4]">
                <span class="text-xs text-[#7A866E] block font-medium">Protein (25%)</span>
                <span class="font-heading text-base font-black text-[#4D6A34] mt-0.5 block">80g</span>
                <span class="text-[11px] text-[#7A866E] block">320 kcal</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4]">
                <span class="text-xs text-[#7A866E] block font-medium">Carbs (45%)</span>
                <span class="font-heading text-base font-black text-[#242424] mt-0.5 block">150g</span>
                <span class="text-[11px] text-[#7A866E] block">600 kcal</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4]">
                <span class="text-xs text-[#7A866E] block font-medium">Fat tốt (30%)</span>
                <span class="font-heading text-base font-black text-[#D4A373] mt-0.5 block">45g</span>
                <span class="text-[11px] text-[#7A866E] block">405 kcal</span>
              </div>
            </div>

            <button
              type="button"
              @click="router.push('/nutrition')"
              class="w-full py-3.5 rounded-2xl bg-[#EBF7E5] hover:bg-[#DEE7D7] text-[#4D6A34] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer"
            >
              <Sparkles class="w-4 h-4" />
              <span>Để NutriBot tối ưu lại lộ trình calo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
