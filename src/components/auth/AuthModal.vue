<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { postLogin } from '../../services/api';
import {
  X,
  Leaf,
  Mail,
  Lock,
  User,
  LogIn,
  Sparkles,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();

const mode = ref<'login' | 'register'>('login');
const name = ref('');
const email = ref('');
const password = ref('');

async function handleSubmit() {
  if (mode.value === 'login') {
    try {
      const user = await postLogin({ identifier: email.value, password: password.value });
      authStore.login(user, user.accessToken);
      if (user.role === 'admin') {
        await router.push('/admin');
      }
    } catch (err: unknown) {
      toastStore.show(
        err instanceof Error ? err.message : 'Không thể đăng nhập. Vui lòng thử lại.',
        'error'
      );
    }
    return;
  }

  const displayName = name.value.trim() || (email.value ? email.value.split('@')[0] || 'Khách hàng' : 'Khách hàng NutriMate');
  authStore.login({
    id: `usr-${Date.now()}`,
    name: displayName,
    email: email.value || 'minhanh.fit@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '0912 345 678',
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
    bmiClassification: 'Bình thường',
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
    dietPreferences: ['Low-Carb', 'Giàu Protein', 'Ít đường'],
  });
}
</script>

<template>
  <div
    v-if="authStore.isAuthModalOpen"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    @click.self="authStore.closeAuthModal()"
  >
    <div
      class="bg-white w-full max-w-md rounded-4xl overflow-hidden shadow-2xl border border-[#E3E8DC] relative animate-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click="authStore.closeAuthModal()"
        class="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF9F5] hover:bg-slate-200 text-[#2D3B1E] flex items-center justify-center transition-colors z-10 min-h-[44px] min-w-[44px]"
        aria-label="Đóng cửa sổ"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Modal Header -->
      <div class="p-6 sm:p-8 bg-[#3B4E24] text-white">
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-9 h-9 rounded-xl bg-[#4D6A34] text-white flex items-center justify-center">
            <Leaf class="w-5 h-5 text-[#EBF1E6]" />
          </div>
          <span class="text-xl font-bold font-heading text-white">
            NutriMate
          </span>
        </div>

        <h2 class="text-xl font-bold font-heading text-white mt-2">
          {{ mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Thành Viên' }}
        </h2>
        <p class="text-xs text-[#DCE7D0] mt-1">
          Đăng nhập để lưu trữ lịch sử đơn hàng và cá nhân hóa thực đơn ăn kiêng.
        </p>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 sm:p-8 space-y-4">
        <div v-if="mode === 'register'" class="space-y-1">
          <label class="text-xs font-semibold text-[#2D3B1E]">Họ và tên của bạn</label>
          <div class="relative">
            <User class="w-4 h-4 text-[#7A866E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              v-model="name"
              required
              placeholder="Nguyễn Minh Anh"
              class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CCD7BC] text-xs font-medium text-[#2D3B1E] focus:border-[#4D6A34] outline-none"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-[#2D3B1E]">Email / SĐT</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-[#7A866E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              v-model="email"
              required
              placeholder="minhanh.fit@gmail.com"
              class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CCD7BC] text-xs font-medium text-[#2D3B1E] focus:border-[#4D6A34] outline-none"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-[#2D3B1E]">Mật khẩu</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-[#7A866E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              v-model="password"
              required
              placeholder="••••••••"
              class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CCD7BC] text-xs font-medium text-[#2D3B1E] focus:border-[#4D6A34] outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <LogIn class="w-4 h-4" />
          <span>{{ mode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản' }}</span>
        </button>

        <div class="text-center pt-2">
          <button
            type="button"
            @click="mode = mode === 'login' ? 'register' : 'login'"
            class="text-xs text-[#576449] hover:underline"
          >
            {{ mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
