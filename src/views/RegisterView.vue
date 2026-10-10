<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import {
  Leaf,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Gift,
  Bot,
  Camera,
  CheckCircle2,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const fullName = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const isAgreed = ref(true);

function handleRegister() {
  if (password.value !== confirmPassword.value) {
    toastStore.show('Mật khẩu xác nhận không khớp', 'error');
    return;
  }

  authStore.login({
    id: `user-${Date.now()}`,
    name: fullName.value || 'Nguyễn Minh Anh',
    email: email.value || 'minhanh.fit@gmail.com',
    phone: phone.value || '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    birthDate: '1998-06-18',
    city: 'TP. Hồ Chí Minh',
    membershipTier: 'Silver',
    nutriPoints: 50,
    currentDiet: 'Eat Clean',
    fitnessGoal: 'Duy trì vóc dáng và sống khỏe',
    heightCm: 165,
    weightKg: 58.5,
    age: 26,
    gender: 'female',
    bmi: 21.5,
    bmiClassification: 'Bình thường',
    bmrKcal: 1340,
    tdeeKcal: 1850,
    targetDailyCalories: 1650,
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
    dietPreferences: ['Low-Carb', 'Giàu Protein'],
  });

  toastStore.show('Đăng ký tài khoản thành công!', 'success', 'Bạn nhận được 50 NutriPoints & Voucher 15%');
  router.push('/profile');
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
    <div class="min-h-[80vh] grid grid-cols-1 lg:grid-cols-12 rounded-4xl overflow-hidden bg-white border border-[#E3E8DC] shadow-xl">
    <!-- Cột Trái: Quyền lợi Thành viên Mới (Figma 16) -->
    <div class="lg:col-span-5 bg-[#FAF9F5] p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#ECEFE7] space-y-6">
      <div class="space-y-6">
        <RouterLink to="/" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#4D6A34] text-white flex items-center justify-center">
            <Leaf class="w-5 h-5 text-[#EBF1E6]" />
          </div>
          <span class="font-heading text-2xl font-black text-[#2D3B1E]">NutriMate</span>
        </RouterLink>

        <div class="space-y-2">
          <span class="px-2.5 py-1 rounded-full bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">
            ★ Đặc quyền thành viên mới
          </span>
          <h2 class="font-heading text-xl sm:text-2xl font-black text-[#2D3B1E] leading-snug">
            Bắt đầu hành trình sống khỏe cùng NutriMate
          </h2>
          <p class="text-xs text-[#576449] leading-relaxed">
            Hệ thống dinh dưỡng cá nhân hóa tiên phong tại Việt Nam, kết nối bữa ăn lành mạnh và trí tuệ nhân tạo.
          </p>
        </div>

        <!-- Thẻ Calo mục tiêu -->
        <div class="p-4 rounded-3xl bg-white border border-[#CCD7BC] shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] text-[#7A866E] uppercase font-bold block">Calo mục tiêu hôm nay</span>
            <span class="font-heading text-lg font-black text-[#2D3B1E]">1,650 kcal <span class="text-xs font-normal">/ ngày</span></span>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-[#EBF1E6] text-xs font-bold text-[#4D6A34]">
            ● Chuẩn BMI 21.4
          </span>
        </div>

        <!-- 3 Thẻ quyền lợi thành viên -->
        <div class="space-y-3">
          <div class="p-3.5 rounded-2xl bg-white border border-[#E3E8DC] flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center shrink-0 mt-0.5">
              <Gift class="w-4 h-4" />
            </div>
            <div>
              <h4 class="font-bold text-xs text-[#2D3B1E]">Tặng ngay 50 NutriPoints & Voucher 15%</h4>
              <p class="text-[11px] text-[#7A866E] mt-0.5 leading-snug">
                Áp dụng trực tiếp cho đơn hàng thực phẩm sạch hữu cơ đầu tiên.
              </p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-[#E3E8DC] flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center shrink-0 mt-0.5">
              <Bot class="w-4 h-4" />
            </div>
            <div>
              <h4 class="font-bold text-xs text-[#2D3B1E]">NutriBot AI xây dựng thực đơn cá nhân</h4>
              <p class="text-[11px] text-[#7A866E] mt-0.5 leading-snug">
                Đồng bộ tỷ lệ macro (Đạm, Carb, Chất béo) dựa theo cân nặng và vận động.
              </p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-[#E3E8DC] flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center shrink-0 mt-0.5">
              <Camera class="w-4 h-4" />
            </div>
            <div>
              <h4 class="font-bold text-xs text-[#2D3B1E]">Nhật ký Calo & Quét nhãn Nutrition miễn phí</h4>
              <p class="text-[11px] text-[#7A866E] mt-0.5 leading-snug">
                Quét mã vạch kiểm tra thành phần thực phẩm và phụ gia trọn đời.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-[#ECEFE7] text-xs text-[#576449]">
        Hơn <strong>15.000+</strong> người Việt đã tối ưu hóa bữa ăn mỗi ngày cùng NutriMate.
      </div>
    </div>

    <!-- Cột Phải: Form Đăng Ký (Figma 16) -->
    <div class="lg:col-span-7 p-8 sm:p-14 flex flex-col justify-center max-w-lg mx-auto w-full space-y-6">
      <div class="space-y-2">
        <h2 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Đăng ký tài khoản NutriMate 🌱
        </h2>
        <p class="text-xs text-[#7A866E]">
          Khởi tạo tài khoản chỉ trong 30 giây để nhận lộ trình dinh dưỡng của bạn.
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <!-- Họ và tên -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-[#2D3B1E] block">Họ và tên *</label>
          <div class="relative">
            <User class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            <input
              type="text"
              v-model="fullName"
              required
              placeholder="Ví dụ: Nguyễn Minh Anh"
              class="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none shadow-2xs"
            />
          </div>
        </div>

        <!-- 2 Cột: Email & SĐT -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-bold text-[#2D3B1E] block">Email *</label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
              <input
                type="email"
                v-model="email"
                required
                placeholder="minhanh.fit@gmail.com"
                class="w-full pl-10 pr-3 py-3 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] outline-none shadow-2xs"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-[#2D3B1E] block">Số điện thoại *</label>
            <div class="relative">
              <Phone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
              <input
                type="tel"
                v-model="phone"
                required
                placeholder="0912 345 678 (Giao 2H)"
                class="w-full pl-10 pr-3 py-3 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] outline-none shadow-2xs"
              />
            </div>
          </div>
        </div>

        <!-- Mật khẩu -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <label class="font-bold text-[#2D3B1E]">Mật khẩu *</label>
            <span class="text-[#7A866E] text-[10px]">Tối thiểu 8 ký tự & số</span>
          </div>
          <div class="relative">
            <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              minlength="8"
              placeholder="Nhập ít nhất 8 ký tự & số"
              class="w-full pl-11 pr-11 py-3 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] outline-none shadow-2xs"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A866E]"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Xác nhận Mật khẩu -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-[#2D3B1E] block">Xác nhận mật khẩu *</label>
          <div class="relative">
            <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="confirmPassword"
              required
              placeholder="Nhập lại mật khẩu"
              class="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-semibold text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] outline-none shadow-2xs"
            />
          </div>
        </div>

        <!-- Checkbox Điều Khoản -->
        <label class="flex items-start gap-2.5 pt-1 text-xs text-[#576449] cursor-pointer">
          <input type="checkbox" v-model="isAgreed" class="accent-[#4D6A34] w-4 h-4 rounded mt-0.5" />
          <span>Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu sức khỏe của NutriMate.</span>
        </label>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[44px]"
        >
          <span>Đăng Ký Tài Khoản Ngay</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </form>

      <!-- Switch to Login -->
      <div class="text-center text-xs text-[#576449]">
        Bạn đã có tài khoản NutriMate?
        <RouterLink to="/login" class="font-bold text-[#4D6A34] hover:underline ml-1">
          Đăng nhập tại đây
        </RouterLink>
      </div>

      <div class="text-[10px] text-center text-[#8C9484] pt-4 border-t border-[#F0F3EC]">
        © 2026 NutriMate Vietnam. Nền tảng thực phẩm sạch và dinh dưỡng AI.
      </div>
    </div>
  </div>
</div>
</template>
