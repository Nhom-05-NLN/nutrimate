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
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#2D3B1E]">Trang chủ</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="hover:text-[#2D3B1E]">Thành viên NutriMate</span>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="text-[#2D3B1E] font-bold">Hồ sơ dinh dưỡng cá nhân</span>
    </nav>

    <!-- Top Profile Banner Card (Figma 07) -->
    <div class="p-6 sm:p-8 rounded-4xl bg-linear-to-r from-[#EBF1E6] via-[#F4F7EE] to-[#FAF9F5] border border-[#CCD7BC] shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
          <!-- Avatar với Icon Camera -->
          <div class="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              alt="Avatar"
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-white shadow-md"
            />
            <button
              type="button"
              class="absolute -bottom-1 -right-1 p-2 rounded-xl bg-[#4D6A34] text-white hover:bg-[#3B4E24] shadow-xs transition-colors"
              title="Thay đổi ảnh đại diện"
            >
              <Camera class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Thông tin tổng quan -->
          <div class="space-y-1.5">
            <h1 class="font-heading text-xl sm:text-2xl font-black text-[#2D3B1E]">
              {{ profile.name }}
            </h1>

            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#CCD7BC] text-[11px] font-bold text-[#E8A020]">
              <span>★</span>
              <span class="text-[#2D3B1E]">Hội Viên Vàng (Gold Member) • 490 NutriPoints</span>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-xs text-[#576449] pt-1">
              <span>Chế độ ăn: <strong>Eat Clean & Low-Carb</strong></span>
              <span>•</span>
              <span>Mục tiêu: <strong>Giảm 3kg mỡ và săn chắc cơ bắp</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="isEditing = !isEditing"
          class="px-5 py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 min-h-[44px]"
        >
          <Edit3 class="w-4 h-4" />
          <span>Cập nhật số đo hôm nay</span>
        </button>
      </div>
    </div>

    <!-- 2 Columns Grid: BMI Analysis (Left) vs Personal Info & Macro Goals (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Cột Trái: Phân tích Thể Trạng & Chỉ Số BMI (Figma 07) -->
      <div class="lg:col-span-5 space-y-6">
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
            <div class="flex items-center gap-2">
              <span class="text-base">📋</span>
              <h2 class="font-heading text-sm font-bold text-[#2D3B1E]">
                Phân tích Thể Trạng & Chỉ Số BMI
              </h2>
            </div>
            <span class="text-[10px] text-[#7A866E] uppercase font-bold">WHO 2024</span>
          </div>

          <!-- 4 Ô Thông số thể trạng -->
          <div class="grid grid-cols-4 gap-2 text-center">
            <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-[10px] text-[#7A866E] block font-medium">Chiều cao</span>
              <span class="font-heading text-sm font-bold text-[#2D3B1E]">165 <span class="text-[10px] font-normal">cm</span></span>
            </div>
            <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-[10px] text-[#7A866E] block font-medium">Cân nặng</span>
              <span class="font-heading text-sm font-bold text-[#2D3B1E]">58.5 <span class="text-[10px] font-normal">kg</span></span>
            </div>
            <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-[10px] text-[#7A866E] block font-medium">Tuổi</span>
              <span class="font-heading text-sm font-bold text-[#2D3B1E]">26</span>
            </div>
            <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-[10px] text-[#7A866E] block font-medium">Giới tính</span>
              <span class="font-heading text-sm font-bold text-[#2D3B1E]">Nữ</span>
            </div>
          </div>

          <!-- Card Chỉ Số Khối Cơ Thể BMI -->
          <div class="p-4 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] space-y-3">
            <div class="flex items-baseline justify-between">
              <div>
                <span class="text-[10px] text-[#7A866E] uppercase font-bold block">Chỉ số khối cơ thể (BMI)</span>
                <span class="font-heading text-3xl font-black text-[#2D3B1E]">21.5 <span class="text-xs font-normal text-[#7A866E]">kg/m²</span></span>
              </div>
              <div class="text-right">
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#4D6A34] text-white text-xs font-bold shadow-2xs">
                  ✓ Bình thường
                </span>
                <span class="text-[10px] text-[#4D6A34] block font-semibold mt-1">Thể trạng Cân đối lý tưởng</span>
              </div>
            </div>

            <!-- Thước Đo Phân Vùng Chuẩn WHO 4 Màu -->
            <div class="space-y-1.5 pt-2">
              <div class="flex justify-between text-[10px] text-[#7A866E]">
                <span>Thước đo phân vùng chuẩn WHO</span>
                <span class="font-bold text-[#4D6A34]">Điểm rơi: 21.5</span>
              </div>

              <!-- Thanh phân vùng -->
              <div class="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex relative">
                <div class="w-[20%] bg-sky-300" title="Thiếu cân < 18.5"></div>
                <div class="w-[45%] bg-[#4D6A34]" title="Cân đối 18.5 - 22.9"></div>
                <div class="w-[20%] bg-amber-400" title="Thừa cân 23.0 - 24.9"></div>
                <div class="w-[15%] bg-rose-400" title="Béo phì >= 25.0"></div>
              </div>

              <div class="grid grid-cols-4 text-[9px] text-[#7A866E] text-center pt-1">
                <div>Thiếu cân<br />&lt; 18.5</div>
                <div class="font-bold text-[#4D6A34]">Cân đối<br />18.5 - 22.9</div>
                <div>Thừa cân<br />23.0 - 24.9</div>
                <div>Béo phì<br />≥ 25.0</div>
              </div>
            </div>
          </div>

          <!-- BMR & TDEE -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC]">
              <span class="text-[10px] text-[#7A866E] font-medium block">⚡ Chỉ số BMR</span>
              <span class="font-heading text-lg font-black text-[#2D3B1E]">1.340 <span class="text-xs font-normal">kcal</span></span>
              <span class="text-[10px] text-[#7A866E] block mt-0.5">Tiêu hao cơ bản tĩnh</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC]">
              <span class="text-[10px] text-[#7A866E] font-medium block">🏃 Chỉ số TDEE</span>
              <span class="font-heading text-lg font-black text-[#4D6A34]">1.850 <span class="text-xs font-normal">kcal</span></span>
              <span class="text-[10px] text-[#7A866E] block mt-0.5">Tiêu hao kèm vận động</span>
            </div>
          </div>

          <!-- Lời khuyên từ NutriBot AI -->
          <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-[#2D3B1E] flex items-center gap-1.5">
                <Bot class="w-4 h-4 text-[#4D6A34]" />
                Lời khuyên từ NutriBot AI
              </span>
              <span class="text-[10px] text-[#7A866E]">Cá nhân hoá</span>
            </div>
            <p class="text-xs text-[#4E5C3E] leading-relaxed">
              "Với BMI 21.5 và thể trạng cân đối, để săn chắc cơ bắp, mức calo thâm hụt nhẹ an toàn là <strong>1.550 kcal/ngày</strong>. Ưu tiên nạp 75–85g Protein từ ức gà sấy và các loại hạt dinh dưỡng NutriMate."
            </p>
          </div>
        </div>

        <!-- Gói thực phẩm gợi ý -->
        <div class="p-4 rounded-3xl bg-white border border-[#E3E8DC] shadow-2xs flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=120&q=80"
              alt="combo"
              class="w-14 h-14 rounded-2xl object-cover"
            />
            <div>
              <span class="text-[10px] font-bold text-[#7A866E] uppercase block">Gói thực phẩm gợi ý</span>
              <h4 class="font-heading text-xs font-bold text-[#2D3B1E]">Combo Eat Clean Săn Cơ</h4>
              <span class="text-[11px] text-[#4D6A34] font-semibold">Giàu Protein, chuẩn 1.550 kcal</span>
            </div>
          </div>
          <RouterLink
            to="/catalog"
            class="w-10 h-10 rounded-2xl bg-[#EBF1E6] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>

      <!-- Cột Phải: Thông Tin Cá Nhân & Mục Tiêu Macro (Figma 07) -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Card 1: Thông tin cá nhân & liên hệ -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
            <h2 class="font-heading text-sm font-bold text-[#2D3B1E]">
              Thông tin cá nhân & Liên hệ
            </h2>
            <span class="px-2.5 py-0.5 rounded-full bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">
              ✓ Đã xác thực
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Họ và tên</label>
              <input
                type="text"
                v-model="profile.name"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Ngày sinh</label>
              <input
                type="date"
                v-model="profile.birthDate"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Số điện thoại</label>
              <input
                type="text"
                v-model="profile.phone"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Email</label>
              <input
                type="email"
                v-model="profile.email"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
              />
            </div>
          </div>

          <div>
            <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Tỉnh / Thành phố</label>
            <input
              type="text"
              v-model="profile.city"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
            />
          </div>

          <div class="pt-2 flex justify-end">
            <button
              type="button"
              @click="handleSave"
              class="px-6 py-2.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Save class="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>

        <!-- Card 2: Mục tiêu dinh dưỡng & Chế độ ăn uống (Figma 07) -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
          <div class="border-b border-[#F0F3EC] pb-3">
            <h2 class="font-heading text-sm font-bold text-[#2D3B1E]">
              Mục tiêu dinh dưỡng & Chế độ ăn uống
            </h2>
            <p class="text-[11px] text-[#7A866E]">Định hình tỷ lệ Macro và lượng Calo hàng ngày</p>
          </div>

          <!-- Mục tiêu thể chất trọng tâm -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-[#2D3B1E] block">Mục tiêu thể chất trọng tâm</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="goal in ['Giảm mỡ tăng cơ', 'Duy trì cân nặng', 'Tăng cân lành mạnh', 'Ăn sạch Eat Clean']"
                :key="goal"
                type="button"
                @click="selectedGoal = goal"
                class="px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center"
                :class="
                  selectedGoal === goal
                    ? 'bg-[#4D6A34] text-white border-[#4D6A34]'
                    : 'bg-[#FAF9F5] text-[#576449] border-[#DEE5D4] hover:bg-white'
                "
              >
                {{ goal }}
              </button>
            </div>
          </div>

          <!-- Tiêu chí chế độ dinh dưỡng áp dụng -->
          <div class="space-y-2 pt-2 border-t border-[#F0F3EC]">
            <span class="text-xs font-bold text-[#2D3B1E] block">Tiêu chí chế độ dinh dưỡng áp dụng</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="pref in ['Low-Carb', 'Giàu Protein', 'Ít đường', 'Không bột ngọt', 'Keto chuẩn']"
                :key="pref"
                type="button"
                @click="togglePreference(pref)"
                class="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5"
                :class="
                  dietPreferences.includes(pref)
                    ? 'bg-[#EBF1E6] text-[#3B4E24] border-[#CCD7BC] font-bold'
                    : 'bg-white text-[#7A866E] border-[#E3E8DC]'
                "
              >
                <span v-if="dietPreferences.includes(pref)">✓</span>
                <span>{{ pref }}</span>
              </button>
            </div>
          </div>

          <!-- Tỷ lệ phân bổ Macros mục tiêu (1.550 kcal) -->
          <div class="space-y-3 pt-2 border-t border-[#F0F3EC]">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-[#2D3B1E]">Tỷ lệ phân bổ Macros mục tiêu (1.550 kcal)</span>
              <span class="text-[#4D6A34] font-semibold">100% Khớp mục tiêu</span>
            </div>

            <!-- Macro Progress Bar -->
            <div class="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
              <div class="w-[25%] bg-[#4D6A34]" title="Protein 25%"></div>
              <div class="w-[45%] bg-[#7F9C5B]" title="Carbs 45%"></div>
              <div class="w-[30%] bg-[#D4A373]" title="Fat 30%"></div>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div class="p-2.5 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4]">
                <span class="text-[10px] text-[#7A866E] block font-medium">Protein (25%)</span>
                <span class="font-heading text-sm font-bold text-[#4D6A34]">80g</span>
                <span class="text-[10px] text-[#7A866E] block">320 kcal</span>
              </div>
              <div class="p-2.5 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4]">
                <span class="text-[10px] text-[#7A866E] block font-medium">Carbs (45%)</span>
                <span class="font-heading text-sm font-bold text-[#2D3B1E]">150g</span>
                <span class="text-[10px] text-[#7A866E] block">600 kcal</span>
              </div>
              <div class="p-2.5 rounded-2xl bg-[#F6F8F3] border border-[#DEE5D4]">
                <span class="text-[10px] text-[#7A866E] block font-medium">Fat tốt (30%)</span>
                <span class="font-heading text-sm font-bold text-[#D4A373]">45g</span>
                <span class="text-[10px] text-[#7A866E] block">405 kcal</span>
              </div>
            </div>

            <button
              type="button"
              @click="router.push('/nutrition')"
              class="w-full py-3 rounded-2xl bg-[#EBF1E6] hover:bg-[#DEE7D7] text-[#4D6A34] font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
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
