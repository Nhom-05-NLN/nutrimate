<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/authStore';
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

const mode = ref<'login' | 'register'>('login');
const name = ref('');
const email = ref('');
const password = ref('');

function handleSubmit() {
  const displayName = name.value.trim() || (email.value ? email.value.split('@')[0] || 'Khách hàng' : 'Khách hàng NutriMate');
  authStore.login({
    id: `usr-${Date.now()}`,
    name: displayName,
    email: email.value || 'khachhang@nutrimate.vn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '0987654321',
    isLoggedIn: true,
  });
}
</script>

<template>
  <div
    v-if="authStore.isAuthModalOpen"
    class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
    @click.self="authStore.closeAuthModal()"
  >
    <div
      class="bg-white w-full max-w-md rounded-4xl overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click="authStore.closeAuthModal()"
        class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors z-10 min-h-[44px] min-w-[44px]"
        aria-label="Đóng cửa sổ"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Modal Header -->
      <div class="p-6 sm:p-8 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white">
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center">
            <Leaf class="w-5 h-5" />
          </div>
          <span class="text-xl font-bold font-heading text-white">
            Nutri<span class="text-emerald-400">Mate</span>
          </span>
        </div>

        <h2 class="text-xl font-bold font-heading text-white mt-2">
          {{ mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Thành Viên' }}
        </h2>
        <p class="text-xs text-emerald-200 mt-1">
          Đăng nhập để lưu trữ lịch sử đơn hàng và cá nhân hóa thực đơn ăn kiêng.
        </p>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 sm:p-8 space-y-4">
        <div v-if="mode === 'register'" class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Họ và tên của bạn</label>
          <div class="relative">
            <User class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              v-model="name"
              placeholder="VD: Trần Tường Vy"
              required
              class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Địa chỉ Email</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              v-model="email"
              placeholder="name@example.com"
              required
              class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Mật khẩu</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              v-model="password"
              placeholder="••••••••"
              required
              class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
        >
          <LogIn class="w-4 h-4" />
          <span>{{ mode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản' }}</span>
        </button>

        <!-- Quick Demo Login Button -->
        <button
          type="button"
          @click="authStore.loginDemo()"
          class="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles class="w-3.5 h-3.5 text-emerald-600" />
          <span>Đăng nhập nhanh tài khoản mẫu (Trần Tường Vy)</span>
        </button>

        <!-- Toggle Mode -->
        <div class="text-center pt-2 text-xs text-slate-500">
          <span v-if="mode === 'login'">
            Chưa có tài khoản?
            <button
              type="button"
              @click="mode = 'register'"
              class="text-emerald-700 font-bold hover:underline ml-1"
            >
              Đăng ký ngay
            </button>
          </span>
          <span v-else>
            Đã có tài khoản?
            <button
              type="button"
              @click="mode = 'login'"
              class="text-emerald-700 font-bold hover:underline ml-1"
            >
              Đăng nhập
            </button>
          </span>
        </div>
      </form>
    </div>
  </div>
</template>
