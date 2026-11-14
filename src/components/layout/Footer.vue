
<script setup lang="ts">
import { ref } from 'vue';
import { useToastStore } from '../../stores/toastStore';
import {
  ArrowRight,
  ShieldCheck,
  Mail,
  MapPin,
  Phone,
} from 'lucide-vue-next';

const toastStore = useToastStore();
const email = ref('');

function handleSubscribe() {
  if (email.value.trim()) {
    toastStore.show(
      'Đăng ký bản tin thành công!',
      'success',
      'Mã giảm giá 10% đã gửi vào email của bạn.'
    );
    email.value = '';
  }
}
</script>

<template>
  <footer class="border-t border-[#A9B18A] bg-[#C0C59F] text-[#242A1D]">
    <div class="mx-auto max-w-[1316px] px-4 py-7 sm:px-8 sm:py-8">
      <div class="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-10">
        <div class="max-w-xl">
          <RouterLink
            to="/"
            class="inline-flex rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B4E24]"
          >
            <img
              src="../../public/logo_nutrimate_transparent.png"
              alt="NutriMate"
              class="h-10 w-auto max-w-[190px] object-contain sm:h-12 sm:max-w-[220px]"
            />
          </RouterLink>
          <h2 class="mt-3 font-heading text-lg font-black leading-snug text-[#242424] sm:text-xl">
            Ăn lành mạnh hơn,<br class="hidden sm:block" /> sống trọn mỗi ngày.
          </h2>
          <p class="mt-2 max-w-lg text-xs leading-5 text-[#576449]">
            Thực phẩm lành mạnh và kiến thức dinh dưỡng cho lựa chọn phù hợp mỗi ngày.
          </p>
        </div>

        <div class="rounded-2xl border border-[#D5DFC8] bg-white/70 p-4 shadow-sm sm:p-5">
          <div class="flex items-center gap-2 text-[#3B4E24]">
            <Mail class="h-4 w-4" />
            <h3 class="text-xs font-bold uppercase tracking-[0.14em]">Bản tin NutriMate</h3>
          </div>
          <p class="mt-1.5 text-xs leading-5 text-[#576449]">
            Nhận mẹo dinh dưỡng, thực đơn và ưu đãi mới.
          </p>
          <form @submit.prevent="handleSubscribe" class="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              v-model="email"
              type="email"
              placeholder="Email của bạn"
              required
              aria-label="Email đăng ký bản tin"
              class="min-h-10 min-w-0 flex-1 rounded-xl border border-[#D5DFC8] bg-white px-3.5 text-xs text-[#242424] outline-none transition placeholder:text-[#7A866E] focus:border-[#6B7A3A] focus:ring-2 focus:ring-[#6B7A3A]/20"
            />
            <button
              type="submit"
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#4D6A34] px-4 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#3B4E24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7A3A] focus-visible:ring-offset-2"
            >
              Đăng ký
              <ArrowRight class="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div class="my-6 h-px bg-[#8E966D]/60 sm:my-7"></div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-[1.25fr_0.8fr_0.95fr] lg:gap-10">
        <div>
          <h3 class="text-xs font-bold uppercase tracking-[0.14em] text-[#35432A]">Liên hệ</h3>
          <ul class="mt-3 space-y-2 text-xs text-[#576449]">
            <li class="flex items-start gap-3">
              <Phone class="mt-0.5 h-4 w-4 shrink-0 text-[#6B7A3A]" />
              <a href="tel:19006767" class="footer-link transition hover:text-[#2D3B1E]">Hotline: 1900 6767</a>
            </li>
            <li class="flex items-start gap-3">
              <Mail class="mt-0.5 h-4 w-4 shrink-0 text-[#6B7A3A]" />
              <a href="mailto:contact@nutrimate.vn" class="footer-link transition hover:text-[#2D3B1E]">contact@nutrimate.vn</a>
            </li>
            <li class="flex items-start gap-3">
              <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-[#6B7A3A]" />
              <span>Đại học Cần Thơ, 3/2, Ninh Kiều, Cần Thơ.</span>
            </li>
          </ul>
        </div>

        <nav aria-label="Liên kết về NutriMate">
          <h3 class="text-xs font-bold uppercase tracking-[0.14em] text-[#35432A]">Khám phá</h3>
          <ul class="mt-3 space-y-2 text-xs text-[#576449]">
            <li><RouterLink to="/" class="footer-link transition hover:text-[#2D3B1E]">Trang chủ</RouterLink></li>
            <li><RouterLink to="/catalog" class="footer-link transition hover:text-[#2D3B1E]">Sản phẩm</RouterLink></li>
            <li><RouterLink to="/blogs" class="footer-link transition hover:text-[#2D3B1E]">Kiến thức dinh dưỡng</RouterLink></li>
            <li><RouterLink to="/partners" class="footer-link transition hover:text-[#2D3B1E]">Hệ thống đối tác</RouterLink></li>
          </ul>
        </nav>

        <nav aria-label="Hỗ trợ khách hàng">
          <h3 class="text-xs font-bold uppercase tracking-[0.14em] text-[#35432A]">Hỗ trợ</h3>
          <ul class="mt-3 space-y-2 text-xs text-[#576449]">
            <li><RouterLink to="/returns" class="footer-link transition hover:text-[#2D3B1E]">Chính sách đổi trả</RouterLink></li>
            <li><RouterLink to="/privacy" class="footer-link transition hover:text-[#2D3B1E]">Chính sách bảo mật</RouterLink></li>
            <li><RouterLink to="/nutribot-guide" class="footer-link transition hover:text-[#2D3B1E]">Hướng dẫn NutriBot</RouterLink></li>
            <li><RouterLink to="/help" class="footer-link transition hover:text-[#2D3B1E]">Trung tâm trợ giúp</RouterLink></li>
          </ul>
        </nav>
      </div>
    </div>
    <div class="mx-auto max-w-[1316px] px-4 pb-5 text-center sm:px-8">
      <div class="border-t border-[#8E966D]/60 pt-4 text-[11px] text-[#3E4A2E]">
        © 2026 NutriMate. All rights reserved.
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  position: relative;
}

.footer-link::after {
  position: absolute;
  right: 0;
  bottom: -3px;
  left: 0;
  height: 1px;
  background: #536124;
  content: '';
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease;
}

.footer-link:hover {
  transform: translateX(3px);
}

.footer-link:hover::after,
.footer-link:focus-visible::after {
  transform: scaleX(1);
}

.footer-link:focus-visible {
  border-radius: 2px;
  outline: 2px solid #6b7a3a;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .footer-link,
  .footer-link::after {
    transition: none;
  }
}
</style>
