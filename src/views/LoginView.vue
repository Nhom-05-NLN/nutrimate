<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { postLogin } from '../services/api';
import {
  Leaf,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Check,
  Star,
  AtSign,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);

async function handleLogin() {
  try {
    const user = await postLogin({
      identifier: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    });
    authStore.login(user, rememberMe.value);
    await router.push(user.role === 'admin' ? '/admin' : '/profile');
  } catch (err: unknown) {
    toastStore.show(
      err instanceof Error ? err.message : 'Không thể đăng nhập. Vui lòng thử lại.',
      'error'
    );
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex flex-col lg:flex-row bg-white">
    <!-- CỘT TRÁI: GIỚI THIỆU & GIÁ TRỊ (NỀN KEM #F7F3E8 - FIGMA 15) -->
    <div class="w-full lg:w-[480px] xl:w-[540px] bg-[#F7F3E8] p-8 sm:p-12 lg:p-14 flex flex-col justify-between shrink-0 space-y-8 border-r border-[#E8ECE2]">
      <div class="space-y-7">
        <!-- Logo NutriMate -->
        <RouterLink to="/" class="flex items-center gap-3.5 group">
          <div class="w-11 h-11 rounded-2xl bg-[#6B7A3A] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
            <Leaf class="w-6 h-6 text-[#EBF7E5]" />
          </div>
          <div>
            <span class="font-heading text-2xl font-black tracking-tight text-[#242424] block leading-none">NutriMate</span>
            <span class="text-xs text-[#68725F] font-medium block mt-1">Dinh Dưỡng Khoa Học Cho Vóc Dáng Của Bạn</span>
          </div>
        </RouterLink>

        <!-- Thẻ đĩa ăn healthy -->
        <div class="rounded-3xl overflow-hidden border border-[#DEE5D4] bg-white shadow-xs">
          <div class="relative">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80"
              alt="Healthy Meal NutriMate"
              class="w-full h-56 object-cover"
            />
            <span class="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/95 text-xs font-bold text-[#3B4E24] shadow-xs">
              ● NutriBot Khuyên Dùng: 520 kcal
            </span>
          </div>

          <div class="p-3.5 grid grid-cols-3 text-center text-xs font-bold text-[#4E5C3E] border-t border-[#F0F3EC]">
            <div>● Protein: <span class="text-[#242424]">42g</span></div>
            <div>● Carbs tốt: <span class="text-[#242424]">38g</span></div>
            <div>● Chất béo: <span class="text-[#242424]">12g</span></div>
          </div>
        </div>

        <!-- Thẻ Testimonial Khách hàng (Figma 15) -->
        <div class="p-6 rounded-3xl bg-white border border-[#E3E8DC] shadow-2xs space-y-3.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1 text-[#536124]">
              <Star v-for="i in 5" :key="i" class="w-4 h-4 fill-[#536124]" />
            </div>
            <span class="text-xs text-[#7A866E] font-medium">Đã xác minh</span>
          </div>

          <p class="text-xs sm:text-sm text-[#3E4A2E] leading-relaxed italic">
            "NutriBot AI đã giúp tôi giảm 4kg mỡ thừa và chọn đúng thực phẩm ăn kiêng phù hợp mà không hề cảm thấy kiệt sức."
          </p>

          <div class="flex items-center gap-3 pt-3 border-t border-[#F0F3EC]">
            <div class="w-9 h-9 rounded-full bg-[#EBF7E5] text-[#536124] text-xs font-black flex items-center justify-center">
              MA
            </div>
            <div>
              <span class="text-xs sm:text-sm font-bold text-[#242424] block">Nguyễn Minh Anh</span>
              <span class="text-[11px] text-[#7A866E]">Hội viên Vàng NutriMate Club</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3 Tiêu chí chân trang cột trái (Figma 15) -->
      <div class="space-y-2.5 text-xs font-semibold text-[#4E5C3E] pt-6 border-t border-[#DEE5D4]">
        <div class="flex items-center gap-2.5">
          <div class="w-4 h-4 rounded-full bg-[#6B7A3A] text-white flex items-center justify-center shrink-0">
            <Check class="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>100% Thực phẩm hữu cơ kiểm định VietGAP & USDA</span>
        </div>
        <div class="flex items-center gap-2.5">
          <TrendingUp class="w-4 h-4 text-[#6B7A3A] shrink-0" />
          <span>Cá nhân hóa calo theo BMI & TDEE khoa học</span>
        </div>
        <div class="flex items-center gap-2.5">
          <ShieldCheck class="w-4 h-4 text-[#6B7A3A] shrink-0" />
          <span>Bảo mật thông tin sức khỏe chuẩn ISO 27001</span>
        </div>
      </div>
    </div>

    <!-- CỘT PHẢI: FORM ĐĂNG NHẬP (NỀN TRẮNG TINH KHIẾT - FIGMA 15) -->
    <div class="flex-1 bg-white p-8 sm:p-14 lg:p-20 flex flex-col justify-between min-h-screen">
      <!-- Canh giữa form -->
      <div class="max-w-[460px] w-full mx-auto my-auto space-y-7">
        <div class="space-y-2">
          <h2 class="font-heading text-3xl sm:text-4xl font-black text-[#242424]">
            Chào mừng trở lại! 👋
          </h2>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Email Field -->
          <div class="space-y-1.5">
            <label class="text-xs sm:text-sm font-bold text-[#242424] block">Email</label>
            <div class="flex items-center px-4 py-3.5 rounded-2xl border border-[#CCD7BC] bg-white focus-within:border-[#536124] focus-within:ring-2 focus-within:ring-[#536124]/20 transition-all shadow-2xs">
              <AtSign class="w-4.5 h-4.5 text-[#7A866E] mr-3 shrink-0" />
              <input
                type="text"
                v-model="email"
                required
                placeholder="ví dụ: minhanh.fit@gmail.com hoặc 0912 345 678"
                class="w-full bg-transparent text-sm text-[#242424] placeholder-[#8C9882] outline-none"
              />
            </div>
          </div>

          <!-- Mật khẩu Field -->
          <div class="space-y-1.5">
            <label class="text-xs sm:text-sm font-bold text-[#242424] block">Mật khẩu</label>
            <div class="flex items-center px-4 py-3.5 rounded-2xl border border-[#CCD7BC] bg-white focus-within:border-[#536124] focus-within:ring-2 focus-within:ring-[#536124]/20 transition-all shadow-2xs">
              <Lock class="w-4.5 h-4.5 text-[#7A866E] mr-3 shrink-0" />
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                required
                placeholder="Nhập mật khẩu bảo mật của bạn"
                class="w-full bg-transparent text-sm text-[#242424] placeholder-[#8C9882] outline-none"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="text-[#7A866E] hover:text-[#242424] ml-2 cursor-pointer"
              >
                <EyeOff v-if="showPassword" class="w-4.5 h-4.5" />
                <Eye v-else class="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <!-- Remember & Forgot Password -->
          <div class="flex items-center justify-between text-xs pt-1">
            <label class="flex items-center gap-2 text-[#576449] cursor-pointer">
              <input type="checkbox" v-model="rememberMe" class="accent-[#536124] w-4 h-4 rounded" />
              <span>Ghi nhớ tài khoản trên thiết bị này</span>
            </label>
            <a href="#" class="font-bold text-[#242424] hover:underline">Quên mật khẩu?</a>
          </div>

          <!-- Nút Submit (Xanh rêu đậm Figma 15) -->
          <button
            type="submit"
            class="w-full py-4 rounded-2xl bg-[#6B7A3A] hover:bg-[#536124] active:bg-[#434F1D] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer"
          >
            <span>Đăng Nhập Ngay</span>
            <ArrowRight class="w-4.5 h-4.5" />
          </button>
        </form>

        <!-- Chuyển sang Đăng ký -->
        <div class="text-center text-sm text-[#576449]">
          Chưa có tài khoản NutriMate?
          <RouterLink to="/register" class="font-bold text-[#242424] hover:underline ml-1">
            Đăng ký ngay
          </RouterLink>
        </div>
      </div>

      <!-- Footer chân trang cột phải (Figma 15) -->
      <div class="max-w-[460px] w-full mx-auto text-xs text-[#7A866E] text-center pt-8 border-t border-[#F0F3EC]">
        Bằng cách đăng nhập, bạn đồng ý với <a href="#" class="underline text-[#242424]">Điều khoản dịch vụ</a> và <a href="#" class="underline text-[#242424]">Chính sách bảo mật dữ liệu dinh dưỡng của NutriMate</a>.
      </div>
    </div>
  </div>
</template>
