
<script setup lang="ts">
import { ref } from 'vue';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';
import {
  Leaf,
  ArrowRight,
  ShieldCheck,
  Mail,
  MapPin,
  Phone,
  Facebook,
  Instagram,
  Github
} from 'lucide-vue-next';

const toastStore = useToastStore();
const authStore = useAuthStore();
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
  <footer class="bg-[#C0C59F] text-[#242424] pt-8 pb-5 border-t border-[#B0B68E]">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <!-- MAIN FOOTER -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-5 pb-7 border-b border-[#AFB58C]">
        <!-- COLUMN 1: BRAND & CONTACT -->
        <div class="space-y-3">
          <RouterLink to="/" class="inline-flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-[#4D6A34] flex items-center justify-center">
              <Leaf class="w-5 h-5 text-white" />
            </div>

            <span class="font-heading text-xl font-black tracking-tight text-[#242424]">
              NutriMate
            </span>
          </RouterLink>

          <p class="text-xs text-[#3E4A2E] leading-relaxed">
            Nền tảng dinh dưỡng thông minh và thực phẩm sạch hàng đầu Việt Nam. Tối ưu năng lượng, bảo vệ sức khỏe gia đình bằng giải pháp khoa học và công nghệ AI.
          </p>

          <!-- CONTACT INFORMATION -->
          <div class="space-y-2 pt-1">
            <div
              class="flex items-center gap-2 text-xs
                     text-[#3E4A2E]"
            >
              <Phone class="w-4 h-4 text-[#4D6A34] shrink-0" />
              <span>Hotline: 1900 6767</span>
            </div>
            <a
              href="mailto:contact@nutrimate.vn"
              class="flex items-center gap-2 text-xs
                     text-[#3E4A2E] hover:text-[#4D6A34]
                     transition-colors"
            >
              <Mail class="w-4 h-4 text-[#4D6A34] shrink-0" />
              contact@nutrimate.vn
            </a>

            <div
              class="flex items-center gap-2 text-xs
                     text-[#3E4A2E]"
            >
              <MapPin class="w-4 h-4 text-[#4D6A34] shrink-0" />
              <span>Đại học Cần Thơ, 3/2, Ninh Kiều, Cần Thơ.</span>
            </div>

          </div>

          <!-- SOCIAL MEDIA -->
          <div class="pt-1">
            <div class="flex items-center gap-2">
              <a
                href="https://www.facebook.com/your-page"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                class="w-8 h-8 rounded-full bg-[#E9EDD9]
                       flex items-center justify-center
                       text-[#4D6A34] hover:bg-[#4D6A34]
                       hover:text-white transition-all"
              >
                <Facebook class="w-4 h-4" />
              </a>

              <a
                href="https://www.instagram.com/your-page"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                class="w-8 h-8 rounded-full bg-[#E9EDD9]
                       flex items-center justify-center
                       text-[#4D6A34] hover:bg-[#4D6A34]
                       hover:text-white transition-all"
              >
                <Instagram class="w-4 h-4" />
              </a>

              <a
                href="https://www.youtube.com/@your-channel"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                class="w-8 h-8 rounded-full bg-[#E9EDD9]
                       flex items-center justify-center
                       text-[#4D6A34] hover:bg-[#4D6A34]
                       hover:text-white transition-all"
              >
                <Github class="w-4 h-4" />
              </a>

            </div>
          </div>
        </div>

        <!-- COLUMN 2: ABOUT -->
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-[#242424] uppercase tracking-wider">
            Về NutriMate
          </h4>

          <ul class="space-y-2 text-xs text-[#3E4A2E] font-medium">

            <li>
              <RouterLink to="/" class="hover:text-black transition-colors">
                Trang chủ
              </RouterLink>
            </li>

            <li>
              <RouterLink to="/catalog" class="hover:text-black transition-colors">
                Sản phẩm
              </RouterLink>
            </li>

            <li>
              <RouterLink to="/blogs" class="hover:text-black transition-colors">
                Kiến thức dinh dưỡng
              </RouterLink>
            </li>

            <li>
              <RouterLink to="#" class="hover:text-black transition-colors">
                Hệ thống đối tác
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- COLUMN 3: SUPPORT -->
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-[#242424] uppercase tracking-wider" >
            Hỗ trợ khách hàng
          </h4>

          <ul class="space-y-2 text-xs text-[#3E4A2E] font-medium">

            <li>
              <a href="#" class="hover:text-black transition-colors">
                Chính sách đổi trả
              </a>
            </li>

            <li>
              <a href="#" class="hover:text-black transition-colors">
                Chính sách bảo mật
              </a>
            </li>

            <li v-if="authStore.currentUser">
              <RouterLink to="/nutrition" class="hover:text-black transition-colors">
                Hướng dẫn sử dụng NutriBot
              </RouterLink>
            </li>

            <li>
              <RouterLink to="/orders" class="hover:text-black transition-colors">
                Trung tâm trợ giúp
              </RouterLink>
            </li>

          </ul>
        </div>

        <!-- COLUMN 4: NEWSLETTER -->
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-[#242424] uppercase tracking-wider">
            Bản tin dinh dưỡng
          </h4>

          <p class="text-xs text-[#3E4A2E] leading-relaxed">
            Nhận thực đơn mẫu, kiến thức dinh dưỡng
            và những ưu đãi mới nhất từ NutriMate.
          </p>

          <form @submit.prevent="handleSubscribe" class="space-y-2">

            <input
              type="email"
              v-model="email"
              placeholder="Email của bạn..."
              required
              class="w-full px-3.5 py-2.5 rounded-xl
                     bg-white border border-[#A6AC82]
                     text-xs text-[#242424]
                     placeholder-[#7A866E]
                     focus:outline-none
                     focus:ring-2 focus:ring-[#4D6A34]"
            />

            <button
              type="submit"
              class="w-full py-2.5 px-4 rounded-xl
                     bg-[#4D6A34] hover:bg-[#3B4E24]
                     text-white text-xs font-bold
                     transition-all flex items-center
                     justify-center gap-2"
            >
              Đăng ký ngay
              <ArrowRight class="w-3.5 h-3.5" />
            </button>

          </form>
        </div>
      </div>

      <!-- BOTTOM FOOTER -->
      <div class="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#3E4A2E]">
        <p class="text-center sm:text-left">
          © 2026 NutriMate. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>
