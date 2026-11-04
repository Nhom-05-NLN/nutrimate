<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { postAdminLogin, postLogin } from '../services/api';
import {
  Leaf,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AtSign,
  Sparkles,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();
const isAdminLogin = computed(() => route.path === '/admin/login');

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);

async function handleLogin() {
  try {
    const payload = {
      identifier: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    };
    const user = isAdminLogin.value
      ? await postAdminLogin(payload)
      : await postLogin(payload);
    if ((isAdminLogin.value && user.role !== 'admin') || (!isAdminLogin.value && user.role !== 'customer')) {
      throw new Error('Vai trò tài khoản không phù hợp với trang đăng nhập này.');
    }
    authStore.login(user, user.accessToken, rememberMe.value);
    await router.push(isAdminLogin.value ? '/admin' : '/profile');
  } catch (err: unknown) {
    toastStore.show(
      err instanceof Error ? err.message : 'Không thể đăng nhập. Vui lòng thử lại.',
      'error'
    );
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F5EE] px-4 py-5 sm:px-8 sm:py-8 lg:flex lg:items-center lg:justify-center lg:px-6 lg:py-4">
    <div class="mx-auto grid min-h-[min(820px,calc(100vh-5rem))] w-full max-w-6xl overflow-hidden rounded-[30px] border border-[#E3E8DC] bg-white shadow-[0_24px_80px_rgba(45,59,30,0.12)] lg:grid-cols-2">
      <section class="relative flex min-h-[300px] flex-col overflow-hidden bg-[#34451F] p-6 text-white sm:p-9 lg:min-h-full lg:p-8">
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
            {{ isAdminLogin ? 'Không gian quản trị' : 'Hành trình sống khỏe' }}
          </p>
          <h1 class="max-w-lg font-heading text-3xl font-black leading-tight sm:text-4xl">
            {{ isAdminLogin ? 'Quản lý NutriMate, bắt đầu từ đây.' : 'Ăn uống lành mạnh, theo cách của riêng bạn.' }}
          </h1>
          <p class="mt-3 max-w-md text-sm leading-6 text-white/70">
            {{ isAdminLogin ? 'Đăng nhập bằng tài khoản quản trị được cấp để tiếp tục.' : 'Theo dõi dinh dưỡng, khám phá thực phẩm tốt và nhận gợi ý phù hợp với mục tiêu của bạn.' }}
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
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Gợi ý hôm nay</p>
                <p class="mt-1 font-heading text-lg font-bold">Nuôi dưỡng cơ thể khỏe mạnh</p>
              </div>
              <span class="shrink-0 rounded-xl bg-white/90 px-3 py-2 text-[10px] font-bold text-[#34451F] shadow-lg">
                NutriBot AI
              </span>
            </div>
          </div>
        </div>

        <div class="relative mt-4 grid grid-cols-3 divide-x divide-white/15 rounded-2xl border border-white/10 bg-white/5 px-2 py-2.5 text-center lg:mt-3 lg:py-2">
          <div class="px-1">
            <p class="font-heading text-lg font-black">AI</p>
            <p class="mt-0.5 text-[10px] text-white/65">Gợi ý cá nhân</p>
          </div>
          <div class="px-1">
            <p class="font-heading text-lg font-black">BMI</p>
            <p class="mt-0.5 text-[10px] text-white/65">Theo dõi sức khỏe</p>
          </div>
          <div class="px-1">
            <p class="font-heading text-lg font-black"><ShieldCheck class="mx-auto h-5 w-5 text-[#DCE9C5]" /></p>
            <p class="mt-0.5 text-[10px] text-white/65">Tài khoản an toàn</p>
          </div>
        </div>
      </section>

      <section class="flex items-center justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-10 lg:py-5">
        <div class="w-full max-w-md">
          <RouterLink to="/" class="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A866E] transition hover:text-[#536124] lg:mb-4">
            <ArrowRight class="h-3.5 w-3.5 rotate-180" />
            Về trang chủ
          </RouterLink>

          <div class="mb-6 lg:mb-4">
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#71813B]">
              {{ isAdminLogin ? 'ADMIN PORTAL' : 'CHÀO MỪNG BẠN TRỞ LẠI' }}
            </p>
            <h2 class="font-heading text-3xl font-black tracking-tight text-[#26321D] sm:text-[2.1rem]">
              {{ isAdminLogin ? 'Đăng nhập quản trị' : 'Đăng nhập tài khoản' }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-[#7A866E]">
              {{ isAdminLogin ? 'Sử dụng tài khoản được cấp quyền quản trị để tiếp tục.' : 'Tiếp tục hành trình chăm sóc sức khỏe cùng NutriMate.' }}
            </p>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5 lg:space-y-3">
            <div class="space-y-2 lg:space-y-1">
              <label for="login-identifier" class="block text-xs font-bold text-[#35432A] sm:text-sm">Email hoặc số điện thoại</label>
              <div class="flex items-center rounded-2xl border border-[#DDE4D3] bg-[#FCFDFB] px-4 transition focus-within:border-[#71813B] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#71813B]/10">
                <AtSign class="mr-3 h-4.5 w-4.5 shrink-0 text-[#8C9882]" />
                <input
                  id="login-identifier"
                  v-model="email"
                  type="text"
                  name="username"
                  autocomplete="username"
                  required
                  :placeholder="isAdminLogin ? 'Email hoặc số điện thoại quản trị' : 'Email hoặc số điện thoại'"
                  class="h-13 w-full bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#A0A897] lg:h-11"
                />
              </div>
            </div>

            <div class="space-y-2 lg:space-y-1">
              <label for="login-password" class="block text-xs font-bold text-[#35432A] sm:text-sm">Mật khẩu</label>
              <div class="flex items-center rounded-2xl border border-[#DDE4D3] bg-[#FCFDFB] px-4 transition focus-within:border-[#71813B] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#71813B]/10">
                <Lock class="mr-3 h-4.5 w-4.5 shrink-0 text-[#8C9882]" />
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  name="password"
                  autocomplete="current-password"
                  required
                  placeholder="Nhập mật khẩu của bạn"
                  class="h-13 w-full bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#A0A897] lg:h-11"
                />
                <button
                  type="button"
                  :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                  class="ml-2 rounded-lg p-1.5 text-[#8C9882] transition hover:bg-[#F1F4EB] hover:text-[#536124]"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="h-4.5 w-4.5" />
                  <Eye v-else class="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-0.5">
              <label class="inline-flex cursor-pointer items-center gap-2 text-xs text-[#64705B]">
                <input type="checkbox" v-model="rememberMe" class="h-4 w-4 rounded accent-[#536124]" />
                <span>{{ isAdminLogin ? 'Ghi nhớ đăng nhập' : 'Ghi nhớ tôi trên thiết bị này' }}</span>
              </label>
              <a href="#" class="text-xs font-bold text-[#536124] transition hover:text-[#34451F] hover:underline">Quên mật khẩu?</a>
            </div>

            <button
              type="submit"
              class="group flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#536124] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#536124]/15 transition hover:-translate-y-0.5 hover:bg-[#3F4C20] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536124]"
            >
              <span>{{ isAdminLogin ? 'Đăng nhập quản trị' : 'Đăng nhập' }}</span>
              <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div v-if="!isAdminLogin" class="mt-7 text-center text-sm text-[#7A866E] lg:mt-4">
            Chưa có tài khoản?
            <RouterLink to="/register" class="ml-1 font-bold text-[#536124] hover:underline">Tạo tài khoản mới</RouterLink>
            <div class="mt-5 border-t border-[#EEF1E9] pt-4 lg:mt-3 lg:pt-3">
              <RouterLink to="/admin/login" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C9882] transition hover:text-[#536124]">
                <ShieldCheck class="h-3.5 w-3.5" />
                Đăng nhập quản trị viên
              </RouterLink>
            </div>
          </div>
          <div v-else class="mt-7 text-center text-sm text-[#7A866E] lg:mt-4">
            <RouterLink to="/login" class="font-bold text-[#536124] hover:underline">Quay lại đăng nhập khách hàng</RouterLink>
          </div>

          <p class="mt-8 border-t border-[#EEF1E9] pt-5 text-center text-[11px] leading-5 text-[#9AA292] lg:mt-4 lg:pt-3">
            Thông tin tài khoản được bảo vệ và chỉ sử dụng để cung cấp dịch vụ NutriMate.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
