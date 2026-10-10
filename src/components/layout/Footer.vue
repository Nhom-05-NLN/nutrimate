<script setup lang="ts">
import { ref } from 'vue';
import { useToastStore } from '../../stores/toastStore';
import { Leaf, PhoneCall, ShieldCheck, ArrowRight } from 'lucide-vue-next';

const toastStore = useToastStore();
const email = ref('');

function handleSubscribe() {
  if (email.value.trim()) {
    toastStore.show('Đăng ký bản tin thành công!', 'success', 'Mã giảm giá 10% đã gửi vào email của bạn.');
    email.value = '';
  }
}
</script>

<template>
  <footer class="bg-[#C0C59F] text-[#242424] pt-14 pb-8 border-t border-[#B0B68E] transition-colors">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#AFB58C]">
        <!-- Cột 1: Thương hiệu & Giới thiệu -->
        <div class="space-y-4">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-[#4D6A34] text-white flex items-center justify-center">
              <Leaf class="w-5 h-5 text-[#EBF7E5]" />
            </div>
            <span class="font-heading text-2xl font-black tracking-tight text-[#242424]">
              NutriMate
            </span>
          </div>
          <p class="text-xs text-[#3E4A2E] leading-relaxed">
            Nền tảng dinh dưỡng thông minh và thực phẩm sạch hàng đầu Việt Nam. Tối ưu năng lượng, bảo vệ sức khỏe gia đình bằng giải pháp khoa học và công nghệ AI.
          </p>
          <div class="pt-2">
            <span class="text-[11px] font-bold text-[#556345] uppercase tracking-wider block">Hotline chăm sóc dinh dưỡng:</span>
            <a href="tel:19008899" class="font-heading text-xl font-black text-[#242424] hover:text-[#4D6A34] flex items-center gap-2 mt-0.5">
              <PhoneCall class="w-4 h-4 text-[#4D6A34]" />
              1900 8899
            </a>
          </div>
        </div>

        <!-- Cột 2: Về NutriMate -->
        <div class="space-y-3">
          <h4 class="font-heading text-sm font-bold text-[#242424] uppercase tracking-wider">
            Về NutriMate
          </h4>
          <ul class="space-y-2 text-xs text-[#3E4A2E] font-medium">
            <li><RouterLink to="/" class="hover:text-black transition-colors">Về NutriMate</RouterLink></li>
            <li><RouterLink to="/catalog" class="hover:text-black transition-colors">Tiêu chuẩn kiểm định</RouterLink></li>
            <li><RouterLink to="/blogs" class="hover:text-black transition-colors">Kiến thức dinh dưỡng</RouterLink></li>
            <li><RouterLink to="/profile" class="hover:text-black transition-colors">Hệ thống đối tác</RouterLink></li>
            <li><a href="#" class="hover:text-black transition-colors">Tuyển dụng</a></li>
          </ul>
        </div>

        <!-- Cột 3: Chính sách & Hỗ trợ -->
        <div class="space-y-3">
          <h4 class="font-heading text-sm font-bold text-[#242424] uppercase tracking-wider">
            Chính sách & Hỗ trợ
          </h4>
          <ul class="space-y-2 text-xs text-[#3E4A2E] font-medium">
            <li><a href="#" class="hover:text-black transition-colors">Chính sách đổi trả & bảo hành</a></li>
            <li><a href="#" class="hover:text-black transition-colors">Chính sách bảo mật</a></li>
            <li><RouterLink to="/nutrition" class="hover:text-black transition-colors">Hướng dẫn tư vấn NutriBot</RouterLink></li>
            <li><RouterLink to="/orders" class="hover:text-black transition-colors">Trung tâm trợ giúp</RouterLink></li>
          </ul>
        </div>

        <!-- Cột 4: Bản tin Dinh Dưỡng -->
        <div class="space-y-3">
          <h4 class="font-heading text-sm font-bold text-[#242424] uppercase tracking-wider">
            Bản tin Dinh Dưỡng
          </h4>
          <p class="text-xs text-[#3E4A2E]">
            Nhận thực đơn mẫu và mã ưu đãi 10% cho đơn hàng đầu tiên.
          </p>
          <form @submit.prevent="handleSubscribe" class="space-y-2.5">
            <div class="relative">
              <input
                type="email"
                v-model="email"
                placeholder="Email của bạn..."
                required
                class="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#A6AC82] text-xs text-[#242424] placeholder-[#7A866E] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
              />
            </div>
            <button
              type="submit"
              class="w-full py-2.5 px-4 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <span>Đăng ký ngay</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#3E4A2E]">
        <p>© 2024 NutriMate - Nền tảng dinh dưỡng thông minh và thực phẩm sạch hàng đầu Việt Nam. Mọi quyền được bảo lưu.</p>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1 font-medium">
            <ShieldCheck class="w-4 h-4 text-[#4D6A34]" />
            Tiêu chuẩn GMP • HACCP • ISO 22000
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>
