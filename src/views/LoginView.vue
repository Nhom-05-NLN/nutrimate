<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Star,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const email = ref('minhanh.fit@gmail.com');
const password = ref('12345678');
const showPassword = ref(false);
const rememberMe = ref(true);

function handleLogin() {
  authStore.login({
    id: 'user-01',
    name: 'Nguyễn Minh Anh',
    email: email.value || 'minhanh.fit@gmail.com',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    birthDate: '1998-06-18',
    city: 'TP. Hồ Chí Minh',
    membershipTier: 'Gold',
    nutriPoints: 490,
    currentDiet: 'Eat Clean & Low-Carb',
    fitnessGoal: 'Giảm 3kg mỡ và săn chắc cơ bắp',
    heightCm: 165,
    weightKg: 58.5,
    age: 26,
    gender: 'female',
    bmi: 21.5,
    bmiClassification: 'Bình thường (Thể trạng Cân đối lý tưởng)',
    bmrKcal: 1340,
    tdeeKcal: 1850,
    targetDailyCalories: 1550,
    targetMacros: {
      proteinPercent: 25,
      proteinGrams: 80,
      proteinKcal: 320,
      carbsPercent: 45,
      carbsGrams: 150,
      carbsKcal: 600,
      fatPercent: 30,
      fatGrams: 45,
      fatKcal: 405,
    },
    dietPreferences: ['Low-Carb', 'Giàu Protein', 'Ít đường', 'Không bột ngọt'],
  });
  router.push('/profile');
}
</script>

<template>
  <div class="min-h-[85vh] grid grid-cols-1 lg:grid-cols-12 rounded-4xl overflow-hidden bg-white border border-[#E3E8DC] shadow-xl my-6">
    <!-- Cột Trái: Giới thiệu & Giá trị (Figma 15) -->
    <div class="lg:col-span-5 bg-[#FAF9F5] p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#ECEFE7] space-y-8">
      <div class="space-y-6">
        <RouterLink to="/" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#4D6A34] text-white flex items-center justify-center">
            <Leaf class="w-5 h-5 text-[#EBF1E6]" />
          </div>
          <div>
            <span class="font-heading text-2xl font-black text-[#2D3B1E]">NutriMate</span>
            <p class="text-[10px] text-[#7A866E] font-medium">Dinh Dưỡng Khoa Học Cho Vóc Dáng Của Bạn</p>
          </div>
        </RouterLink>

        <!-- Ảnh đĩa ăn healthy -->
        <div class="rounded-3xl overflow-hidden border border-[#DEE5D4] bg-white shadow-xs">
          <div class="relative">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"
              alt="Healthy Meal"
              class="w-full h-48 object-cover"
            />
            <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-[10px] font-bold text-[#3B4E24] shadow-2xs">
              ● NutriBot Khuyên Dùng: 520 kcal
            </span>
          </div>

          <div class="p-3 grid grid-cols-3 text-center text-xs text-[#576449] border-t border-[#F0F3EC]">
            <div>● Protein: <strong>42g</strong></div>
            <div>● Carbs tốt: <strong>38g</strong></div>
            <div>● Chất béo: <strong>12g</strong></div>
          </div>
        </div>

        <!-- Card Review Khách hàng -->
        <div class="p-5 rounded-3xl bg-white border border-[#E3E8DC] shadow-2xs space-y-3">
          <div class="flex items-center gap-1 text-[#E8A020]">
            <Star v-for="i in 5" :key="i" class="w-3.5 h-3.5 fill-[#E8A020]" />
            <span class="text-[10px] text-[#7A866E] ml-2">Đã xác minh</span>
          </div>
          <p class="text-xs text-[#4E5C3E] italic leading-relaxed">
            "NutriBot AI đã giúp tôi giảm 4kg mỡ thừa và chọn đúng thực phẩm ăn kiêng phù hợp mà không hề cảm thấy kiệt sức."
          </p>
          <div class="flex items-center gap-2.5 pt-2 border-t border-[#F0F3EC]">
            <div class="w-7 h-7 rounded-full bg-[#EBF1E6] text-[#4D6A34] text-[10px] font-bold flex items-center justify-center">
              MA
            </div>
            <div>
              <span class="text-xs font-bold text-[#2D3B1E] block">Nguyễn Minh Anh</span>
              <span class="text-[10px] text-[#7A866E]">Hội viên Vàng NutriMate Club</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3 Tiêu chí chân trang -->
      <div class="space-y-2 text-xs text-[#576449] pt-6 border-t border-[#ECEFE7]">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
          <span>100% Thực phẩm hữu cơ kiểm định VietGAP & USDA</span>
        </div>
        <div class="flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-[#4D6A34] shrink-0" />
          <span>Cá nhân hóa calo theo BMI & TDEE khoa học</span>
        </div>
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-4 h-4 text-[#4D6A34] shrink-0" />
          <span>Bảo mật thông tin sức khỏe chuẩn ISO 27001</span>
        </div>
      </div>
    </div>

    <!-- Cột Phải: Form Đăng Nhập (Figma 15) -->
    <div class="lg:col-span-7 p-8 sm:p-14 flex flex-col justify-center max-w-lg mx-auto w-full space-y-6">
      <div class="space-y-2">
        <h2 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Chào mừng trở lại! 👋
        </h2>
        <p class="text-xs text-[#7A866E]">
          Đăng nhập để theo dõi chỉ số calo và quản lý thực đơn dinh dưỡng của bạn.
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Email -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#2D3B1E] block">Email / Số điện thoại</label>
          <div class="relative">
            <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            <input
              type="text"
              v-model="email"
              required
              placeholder="ví dụ: minhanh.fit@gmail.com hoặc 0912 345 678"
              class="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none shadow-2xs"
            />
          </div>
        </div>

        <!-- Mật khẩu -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#2D3B1E] block">Mật khẩu</label>
          <div class="relative">
            <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              placeholder="Nhập mật khẩu bảo mật của bạn"
              class="w-full pl-11 pr-11 py-3 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none shadow-2xs"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A866E] hover:text-[#2D3B1E]"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Remember & Forgot Password -->
        <div class="flex items-center justify-between text-xs pt-1">
          <label class="flex items-center gap-2 text-[#576449] cursor-pointer">
            <input type="checkbox" v-model="rememberMe" class="accent-[#4D6A34] rounded" />
            <span>Ghi nhớ tài khoản trên thiết bị này</span>
          </label>
          <a href="#" class="font-bold text-[#4D6A34] hover:underline">Quên mật khẩu?</a>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[44px]"
        >
          <span>Đăng Nhập Ngay</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </form>

      <!-- Switch to Register -->
      <div class="text-center text-xs text-[#576449]">
        Chưa có tài khoản NutriMate?
        <RouterLink to="/register" class="font-bold text-[#4D6A34] hover:underline ml-1">
          Đăng ký ngay
        </RouterLink>
      </div>

      <div class="text-[10px] text-center text-[#8C9484] pt-4 border-t border-[#F0F3EC]">
        Bằng cách đăng nhập, bạn đồng ý với <a href="#" class="underline">Điều khoản dịch vụ</a> và <a href="#" class="underline">Chính sách bảo mật dữ liệu dinh dưỡng của NutriMate</a>.
      </div>
    </div>
  </div>
</template>
