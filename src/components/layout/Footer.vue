<script setup lang="ts">
import { ref } from 'vue';
import { useToastStore } from '../../stores/toastStore';
import { Leaf, PhoneCall, ShieldCheck, Mail, ArrowRight } from 'lucide-vue-next';

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
  <footer class="bg-[#D3DCBE] text-[#2D3B1E] pt-14 pb-8 border-t border-[#C0CBAB] transition-colors mt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#BFCAA9]">
        <!-- Cột 1: Thương hiệu & Giới thiệu -->
        <div class="space-y-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#4D6A34] text-white flex items-center justify-center">
              <Leaf class="w-4 h-4 text-[#EBF1E6]" />
            </div>
            <span class="font-heading text-xl font-black tracking-tight text-[#2D3B1E]">
              NutriMate
            </span>
          </div>
          <p class="text-xs text-[#4E5C3E] leading-relaxed">
            Nền tảng dinh dưỡng thông minh và thực phẩm sạch hàng đầu Việt Nam. Tối ưu năng lượng, bảo vệ sức khỏe gia đình bằng giải pháp khoa học và công nghệ AI.
          </p>
          <div class="pt-2">
            <span class="text-[11px] font-bold text-[#647453] uppercase tracking-wider block">Hotline chăm sóc dinh dưỡng:</span>
            <a href="tel:19008899" class="font-heading text-lg font-extrabold text-[#2D3B1E] hover:text-[#4D6A34] flex items-center gap-2 mt-0.5">
              <PhoneCall class="w-4 h-4 text-[#4D6A34]" />
              1900 8899
            </a>
          </div>
        </div>

        <!-- Cột 2: Về NutriMate -->
        <div class="space-y-3">
          <h4 class="font-heading text-sm font-bold text-[#2D3B1E] uppercase tracking-wider">
            Về NutriMate
          </h4>
          <ul class="space-y-2 text-xs text-[#4E5C3E]">
            <li><RouterLink to="/" class="hover:text-[#2D3B1E] transition-colors">Về NutriMate</RouterLink></li>
            <li><RouterLink to="/catalog" class="hover:text-[#2D3B1E] transition-colors">Tiêu chuẩn kiểm định</RouterLink></li>
            <li><RouterLink to="/blogs" class="hover:text-[#2D3B1E] transition-colors">Kiến thức dinh dưỡng</RouterLink></li>
            <li><RouterLink to="/profile" class="hover:text-[#2D3B1E] transition-colors">Hệ thống đối tác</RouterLink></li>
            <li><a href="#" class="hover:text-[#2D3B1E] transition-colors">Tuyển dụng</a></li>
          </ul>
        </div>

        <!-- Cột 3: Chính sách & Hỗ trợ -->
        <div class="space-y-3">
          <h4 class="font-heading text-sm font-bold text-[#2D3B1E] uppercase tracking-wider">
            Chính sách & Hỗ trợ
          </h4>
          <ul class="space-y-2 text-xs text-[#4E5C3E]">
            <li><a href="#" class="hover:text-[#2D3B1E] transition-colors">Chính sách đổi trả & bảo hành</a></li>
            <li><a href="#" class="hover:text-[#2D3B1E] transition-colors">Chính sách bảo mật</a></li>
            <li><RouterLink to="/nutrition" class="hover:text-[#2D3B1E] transition-colors">Hướng dẫn tư vấn NutriBot</RouterLink></li>
            <li><RouterLink to="/orders" class="hover:text-[#2D3B1E] transition-colors">Tra cứu đơn hàng</RouterLink></li>
            <li><a href="#" class="hover:text-[#2D3B1E] transition-colors">Trung tâm trợ giúp</a></li>
          </ul>
        </div>

        <!-- Cột 4: Bản tin Dinh Dưỡng -->
        <div class="space-y-3">
          <h4 class="font-heading text-sm font-bold text-[#2D3B1E] uppercase tracking-wider">
            Bản tin Dinh Dưỡng
          </h4>
          <p class="text-xs text-[#4E5C3E]">
            Nhận thực đơn mẫu và mã ưu đãi 10% cho đơn hàng đầu tiên.
          </p>
          <form @submit.prevent="handleSubscribe" class="space-y-2">
            <div class="relative">
              <input
                type="email"
                v-model="email"
                placeholder="Email của bạn..."
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#B9C6A1] text-xs text-[#2D3B1E] placeholder-[#809071] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
              />
            </div>
            <button
              type="submit"
              class="w-full py-2.5 px-4 rounded-xl bg-[#4D6A34] hover:bg-[#3D5528] active:bg-[#324720] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <span>Đăng ký ngay</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#556645]">
        <p>© 2024 NutriMate - Nền tảng dinh dưỡng thông minh và thực phẩm sạch hàng đầu Việt Nam. Mọi quyền được bảo lưu.</p>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1">
            <ShieldCheck class="w-3.5 h-3.5 text-[#4D6A34]" />
            Tiêu chuẩn GMP • HACCP • ISO 22000
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>
