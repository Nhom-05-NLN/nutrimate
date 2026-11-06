<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { DEFAULT_USER_AVATAR } from '../constants/avatar';
import { postRegister } from '../services/api';
import {
  Leaf,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
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
const showConfirmPassword = ref(false);
const isAgreed = ref(false);

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    toastStore.show('Mật khẩu xác nhận không khớp', 'error');
    return;
  }

  if (!isAgreed.value) {
    toastStore.show('Vui lòng đồng ý với các điều khoản để đăng ký', 'error');
    return;
  }

  try {
    const registeredUser = await postRegister({
      fullName: fullName.value,
      email: email.value,
      phone: phone.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      acceptedTerms: isAgreed.value,
    });

    authStore.login({
      id: registeredUser.id,
      name: registeredUser.name,
      email: registeredUser.email,
      phone: registeredUser.phone,
      role: registeredUser.role,
      avatar: DEFAULT_USER_AVATAR,
      birthDate: '1998-06-18',
      city: 'TP. Hồ Chí Minh',
      membershipTier: 'Silver',
      nutriPoints: 50,
      currentDiet: 'Chưa chọn',
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
      dietPreferences: [],
    }, registeredUser.accessToken);

    toastStore.show('Đăng ký tài khoản thành công!', 'success');
    router.push('/profile');
  } catch (err: unknown) {
    toastStore.show(
      err instanceof Error ? err.message : 'Không thể đăng ký tài khoản. Vui lòng thử lại.',
      'error'
    );
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F5EE] px-4 py-5 sm:px-8 sm:py-8 lg:flex lg:items-center lg:justify-center lg:px-6 lg:py-4">
    <div class="mx-auto flex w-full max-w-7xl flex-col overflow-hidden rounded-[30px] border border-[#E3E8DC] bg-white shadow-[0_24px_80px_rgba(45,59,30,0.12)] lg:min-h-[calc(100vh-4rem)] lg:flex-row">
    <!-- CỘT TRÁI: BỐ CỤC THƯƠNG HIỆU ĐỒNG NHẤT VỚI ĐĂNG NHẬP -->
    <div class="relative flex min-h-[300px] w-full shrink-0 flex-col overflow-hidden bg-[#34451F] p-6 text-white sm:p-9 lg:min-h-full lg:w-[390px] lg:p-8 xl:w-[430px]">
      <div class="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full border border-white/10"></div>
      <div class="pointer-events-none absolute -right-12 -top-8 h-48 w-48 rounded-full border border-white/10"></div>
      <RouterLink to="/" class="relative z-10 inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
        <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
          <Leaf class="h-6 w-6 text-[#DCE9C5]" />
        </span>
        <span>
          <span class="block font-heading text-xl font-black leading-tight">NutriMate</span>
          <span class="mt-0.5 block text-[10px] font-medium tracking-wide text-white/65">Dinh dưỡng khoa học mỗi ngày</span>
        </span>
      </RouterLink>

      <div class="relative z-10 mt-6 lg:mt-auto">
        <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#E4EDCF] ring-1 ring-white/10">
          <Sparkles class="h-3.5 w-3.5" />
          Bắt đầu hành trình của bạn
        </p>
        <h1 class="max-w-lg font-heading text-3xl font-black leading-tight sm:text-4xl">
          Bắt đầu hành trình sống khỏe cùng NutriMate
        </h1>
        <p class="mt-3 max-w-md text-sm leading-6 text-white/70">
          Hệ thống dinh dưỡng cá nhân hóa tiên phong tại Việt Nam, kết nối bữa ăn lành mạnh và trí tuệ nhân tạo.
        </p>
      </div>

      <div class="relative mt-5 overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-sm lg:mt-4">
        <div class="relative h-36 overflow-hidden rounded-[20px] sm:h-48 lg:h-40">
          <img
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85"
            alt="Bữa ăn lành mạnh với rau củ tươi"
            class="h-full w-full object-cover"
          />
          <div class="absolute inset-0 bg-linear-to-t from-[#1D2A14]/80 via-transparent to-transparent"></div>
          <div class="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white sm:inset-x-5 sm:bottom-5">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">NutriMate</p>
              <p class="mt-1 font-heading text-lg font-bold">Ăn cân bằng, sống khỏe hơn</p>
            </div>
            <span class="shrink-0 rounded-xl bg-white/90 px-3 py-2 text-[10px] font-bold text-[#34451F] shadow-lg">
              NutriBot AI
            </span>
          </div>
        </div>
      </div>

      <div class="relative mt-4 grid grid-cols-3 divide-x divide-white/15 rounded-2xl border border-white/10 bg-white/5 px-2 py-2.5 text-center lg:mt-3 lg:py-2">
        <div class="px-1">
          <p class="flex h-7 items-center justify-center font-heading text-lg font-black">AI</p>
          <p class="mt-0.5 text-[10px] text-white/65">Gợi ý cá nhân</p>
        </div>
        <div class="px-1">
          <p class="flex h-7 items-center justify-center font-heading text-lg font-black">BMI</p>
          <p class="mt-0.5 text-[10px] text-white/65">Theo dõi sức khỏe</p>
        </div>
        <div class="px-1">
          <p class="flex h-7 items-center justify-center font-heading text-lg font-black"><ShieldCheck class="h-5 w-5 text-[#DCE9C5]" /></p>
          <p class="mt-0.5 text-[10px] text-white/65">Tài khoản an toàn</p>
        </div>
      </div>
    </div>

    <!-- CỘT PHẢI: FORM ĐĂNG KÝ (NỀN TRẮNG TINH KHIẾT - FIGMA 16) -->
    <div class="flex flex-1 flex-col justify-between bg-white p-6 sm:p-10 lg:px-10 lg:py-5">
      <div class="my-auto mx-auto w-full max-w-[720px] space-y-4 lg:space-y-3">
        <div class="space-y-2">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-[#71813B]">TẠO TÀI KHOẢN MIỄN PHÍ</p>
          <h2 class="font-heading text-3xl font-black tracking-tight text-[#26321D] sm:text-[2.5rem] lg:text-3xl">
            Tham gia NutriMate
          </h2>
          <p class="text-sm leading-6 text-[#7A866E] sm:text-base lg:text-sm">Điền thông tin để bắt đầu hành trình dinh dưỡng phù hợp với bạn.</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-5 lg:space-y-3">
          <!-- Họ và tên * -->
          <div class="space-y-2 lg:space-y-1">
            <label for="register-name" class="block text-xs font-bold text-[#35432A] sm:text-sm">Họ và tên *</label>
            <div class="flex items-center rounded-2xl border border-[#DDE4D3] bg-[#FCFDFB] px-4 transition focus-within:border-[#71813B] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#71813B]/10">
              <User class="w-4.5 h-4.5 text-[#7A866E] mr-3 shrink-0" />
              <input
                id="register-name"
                type="text"
                v-model="fullName"
                name="name"
                autocomplete="name"
                required
                placeholder="Ví dụ: Nguyễn Minh Anh"
                class="h-13 w-full bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#A0A897] sm:text-base lg:h-11 lg:text-sm"
              />
            </div>
          </div>

          <!-- 2 Cột: Email & SĐT (Cùng dòng Figma 16) -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="space-y-2 lg:space-y-1">
              <label for="register-email" class="block text-xs font-bold text-[#35432A] sm:text-sm">Email *</label>
              <div class="flex items-center rounded-2xl border border-[#DDE4D3] bg-[#FCFDFB] px-4 transition focus-within:border-[#71813B] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#71813B]/10">
                <Mail class="w-4.5 h-4.5 text-[#7A866E] mr-2.5 shrink-0" />
                <input
                  id="register-email"
                  type="email"
                  v-model="email"
                  name="email"
                  autocomplete="email"
                  required
                  placeholder="minhanh.fit@gmail.com"
                  class="h-13 w-full min-w-0 bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#A0A897] sm:text-base lg:h-11 lg:text-sm"
                />
              </div>
            </div>

            <div class="space-y-2 lg:space-y-1">
              <label for="register-phone" class="block text-xs font-bold text-[#35432A] sm:text-sm">Số điện thoại *</label>
              <div class="flex items-center rounded-2xl border border-[#DDE4D3] bg-[#FCFDFB] px-4 transition focus-within:border-[#71813B] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#71813B]/10">
                <Phone class="w-4.5 h-4.5 text-[#7A866E] mr-2.5 shrink-0" />
                <input
                  id="register-phone"
                  type="tel"
                  v-model="phone"
                  name="tel"
                  autocomplete="tel"
                  required
                  placeholder="0912 345 678"
                  class="h-13 w-full min-w-0 bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#A0A897] sm:text-base lg:h-11 lg:text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Mật khẩu * -->
          <div class="space-y-2 lg:space-y-1">
            <div class="flex justify-between items-center text-xs">
              <label for="register-password" class="font-bold text-[#35432A] sm:text-sm">Mật khẩu *</label>
              <span class="font-medium text-[#8C9882]">Ít nhất 8 ký tự</span>
            </div>
            <div class="flex items-center rounded-2xl border border-[#DDE4D3] bg-[#FCFDFB] px-4 transition focus-within:border-[#71813B] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#71813B]/10">
              <Lock class="w-4.5 h-4.5 text-[#7A866E] mr-3 shrink-0" />
              <input
                id="register-password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                name="new-password"
                autocomplete="new-password"
                required
                minlength="8"
                placeholder="Tạo mật khẩu an toàn"
                class="h-13 w-full bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#A0A897] sm:text-base lg:h-11 lg:text-sm"
              />
              <button
                type="button"
                :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                @click="showPassword = !showPassword"
                class="ml-2 rounded-lg p-1.5 text-[#8C9882] transition hover:bg-[#F1F4EB] hover:text-[#536124]"
              >
                <EyeOff v-if="showPassword" class="w-4.5 h-4.5" />
                <Eye v-else class="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <!-- Xác nhận mật khẩu * -->
          <div class="space-y-2 lg:space-y-1">
            <div class="flex justify-between items-center text-xs">
              <label for="register-confirm-password" class="font-bold text-[#35432A] sm:text-sm">Xác nhận mật khẩu *</label>
              <span class="font-medium text-[#8C9882]">Nhập lại mật khẩu</span>
            </div>
            <div class="flex items-center rounded-2xl border border-[#DDE4D3] bg-[#FCFDFB] px-4 transition focus-within:border-[#71813B] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#71813B]/10">
              <Lock class="w-4.5 h-4.5 text-[#7A866E] mr-3 shrink-0" />
              <input
                id="register-confirm-password"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="confirmPassword"
                name="confirm-password"
                autocomplete="new-password"
                required
                minlength="8"
                placeholder="Nhập ít nhất 8 ký tự & số"
                class="h-13 w-full bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#A0A897] sm:text-base lg:h-11 lg:text-sm"
              />
              <button
                type="button"
                :aria-label="showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'"
                @click="showConfirmPassword = !showConfirmPassword"
                class="ml-2 rounded-lg p-1.5 text-[#8C9882] transition hover:bg-[#F1F4EB] hover:text-[#536124]"
              >
                <EyeOff v-if="showConfirmPassword" class="w-4.5 h-4.5" />
                <Eye v-else class="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <!-- Checkbox Điều Khoản -->
          <label class="flex cursor-pointer items-center gap-2 pt-0.5 text-xs leading-5 text-[#64705B] sm:text-sm lg:text-xs lg:leading-4">
            <input type="checkbox" v-model="isAgreed" required class="h-4 w-4 shrink-0 rounded accent-[#536124]" />
            <span>Tôi đồng ý với <a href="#" class="font-bold text-[#35432A] underline underline-offset-2">Điều khoản dịch vụ</a> và <a href="#" class="font-bold text-[#35432A] underline underline-offset-2">Chính sách bảo vệ dữ liệu sức khỏe</a> của NutriMate.</span>
          </label>

          <!-- Nút Submit (Xanh rêu đậm Figma 16) -->
          <button
            type="submit"
            :disabled="!isAgreed"
            class="group flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#536124] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#536124]/15 transition hover:-translate-y-0.5 hover:bg-[#3F4C20] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536124] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#536124] disabled:hover:shadow-lg"
          >
            <span>Tạo tài khoản</span>
            <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <!-- Chuyển sang Đăng nhập -->
        <div class="text-center text-sm text-[#576449] lg:text-xs">
          Bạn đã có tài khoản NutriMate?
          <RouterLink to="/login" class="ml-1 font-bold text-[#536124] hover:underline">
            Đăng nhập tại đây
          </RouterLink>
        </div>
      </div>

      <!-- Footer chân trang cột phải (Figma 16) -->
      <div class="mx-auto flex w-full max-w-[720px] flex-col items-center justify-between gap-2 border-t border-[#F0F3EC] pt-4 text-center text-xs text-[#7A866E] sm:flex-row sm:text-left lg:pt-3 lg:text-[11px]">
        <span>© 2026 NutriMate Vietnam. Nền tảng thực phẩm sạch và dinh dưỡng AI.</span>
        <div class="flex items-center gap-4 font-semibold text-[#242424]">
          <a href="#" class="hover:underline">Trợ giúp</a>
          <a href="#" class="hover:underline">Chính sách bảo mật</a>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
