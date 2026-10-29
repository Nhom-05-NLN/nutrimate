<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
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
  Gift,
  Bot,
  Scan,
  RefreshCw,
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
const isAgreed = ref(true);

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
    }, registeredUser.accessToken);

    toastStore.show('Đăng ký tài khoản thành công!', 'success', 'Bạn nhận được 50 NutriPoints & Voucher 15%');
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
  <div class="min-h-screen w-full flex flex-col lg:flex-row bg-white">
    <!-- CỘT TRÁI: ĐẶC QUYỀN THÀNH VIÊN MỚI (NỀN KEM #F7F3E8 - FIGMA 16) -->
    <div class="w-full lg:w-[480px] xl:w-[540px] bg-[#F7F3E8] p-8 sm:p-12 lg:p-14 flex flex-col justify-between shrink-0 space-y-8 border-r border-[#E8ECE2]">
      <div class="space-y-6">
        <!-- Logo NutriMate -->
        <RouterLink to="/" class="flex items-center gap-3.5 group">
          <div class="w-11 h-11 rounded-2xl bg-[#6B7A3A] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
            <Leaf class="w-6 h-6 text-[#EBF7E5]" />
          </div>
          <span class="font-heading text-2xl font-black tracking-tight text-[#242424]">NutriMate</span>
        </RouterLink>

        <div class="space-y-2.5">
          <span class="inline-block px-3 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#536124] border border-[#CCD7BC]">
            ★ Đặc quyền thành viên mới
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl font-black text-[#242424] leading-snug">
            Bắt đầu hành trình sống khỏe cùng NutriMate
          </h2>
          <p class="text-xs sm:text-sm text-[#576449] leading-relaxed">
            Hệ thống dinh dưỡng cá nhân hóa tiên phong tại Việt Nam, kết nối bữa ăn lành mạnh và trí tuệ nhân tạo.
          </p>
        </div>

        <!-- Thẻ ảnh món ăn & Calo mục tiêu hôm nay (Figma 16) -->
        <div class="rounded-3xl overflow-hidden border border-[#CCD7BC] bg-white shadow-xs">
          <div class="relative">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80"
              alt="Healthy Meal NutriMate"
              class="w-full h-52 object-cover"
            />
            <!-- Box nổi Calo mục tiêu bên dưới ảnh -->
            <div class="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#CCD7BC] shadow-xs flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-[#EBF7E5] text-[#536124] flex items-center justify-center shrink-0">
                  <RefreshCw class="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <span class="text-[10px] text-[#7A866E] uppercase font-bold block leading-none">Calo mục tiêu hôm nay</span>
                  <span class="font-heading text-sm font-black text-[#242424] block mt-0.5">1,650 kcal <span class="text-[10px] font-normal text-[#7A866E]">/ ngày</span></span>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#EBF7E5] text-[10px] font-bold text-[#536124]">
                ● Chuẩn BMI 21.4
              </span>
            </div>
          </div>
        </div>

        <!-- 3 Thẻ quyền lợi thành viên (Figma 16) -->
        <div class="space-y-3 pt-1">
          <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] flex items-start gap-3.5 shadow-2xs">
            <div class="w-9 h-9 rounded-xl bg-[#EBF7E5] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
              <Gift class="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 class="font-bold text-xs sm:text-sm text-[#242424]">Tặng ngay 50 NutriPoints & Voucher 15%</h4>
              <p class="text-xs text-[#7A866E] mt-0.5 leading-relaxed">
                Áp dụng trực tiếp cho đơn hàng thực phẩm sạch, nông sản canh tác chuẩn hữu cơ đầu tiên.
              </p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] flex items-start gap-3.5 shadow-2xs">
            <div class="w-9 h-9 rounded-xl bg-[#EBF7E5] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
              <Bot class="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 class="font-bold text-xs sm:text-sm text-[#242424]">NutriBot AI xây dựng thực đơn cá nhân</h4>
              <p class="text-xs text-[#7A866E] mt-0.5 leading-relaxed">
                Đồng bộ tỷ lệ macro (Đạm, Carb, Chất béo) dựa theo cân nặng, chiều cao và lối sống vận động.
              </p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] flex items-start gap-3.5 shadow-2xs">
            <div class="w-9 h-9 rounded-xl bg-[#EBF7E5] text-[#536124] flex items-center justify-center shrink-0 mt-0.5">
              <Scan class="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 class="font-bold text-xs sm:text-sm text-[#242424]">Nhật ký Calo & Quét nhãn Nutrition miễn phí</h4>
              <p class="text-xs text-[#7A866E] mt-0.5 leading-relaxed">
                Quét mã vạch kiểm tra thành phần thực phẩm và phụ gia có hại trọn đời không giới hạn.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Avatar Stacks chân cột trái (Figma 16) -->
      <div class="flex items-center gap-3 pt-5 border-t border-[#DEE5D4]">
        <div class="flex -space-x-2">
          <div class="w-8 h-8 rounded-full bg-[#CCD7BC] text-[#242424] font-bold text-[10px] flex items-center justify-center border-2 border-white">
            MA
          </div>
          <div class="w-8 h-8 rounded-full bg-[#EBF7E5] text-[#536124] font-bold text-[10px] flex items-center justify-center border-2 border-white">
            TN
          </div>
          <div class="w-8 h-8 rounded-full bg-[#A3B88C] text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">
            QD
          </div>
        </div>
        <p class="text-xs text-[#576449]">
          Hơn <strong class="text-[#242424]">15.000+</strong> người Việt đã tối ưu hóa bữa ăn mỗi ngày.
        </p>
      </div>
    </div>

    <!-- CỘT PHẢI: FORM ĐĂNG KÝ (NỀN TRẮNG TINH KHIẾT - FIGMA 16) -->
    <div class="flex-1 bg-white p-8 sm:p-14 lg:p-20 flex flex-col justify-between min-h-screen">
      <!-- Canh giữa form -->
      <div class="max-w-[480px] w-full mx-auto my-auto space-y-6">
        <div class="space-y-2">
          <h2 class="font-heading text-3xl sm:text-4xl font-black text-[#242424]">
            Đăng ký tài khoản NutriMate 🌱
          </h2>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4.5">
          <!-- Họ và tên * -->
          <div class="space-y-1.5">
            <label class="text-xs sm:text-sm font-bold text-[#242424] block">Họ và tên *</label>
            <div class="flex items-center px-4 py-3.5 rounded-2xl border border-[#CCD7BC] bg-white focus-within:border-[#536124] focus-within:ring-2 focus-within:ring-[#536124]/20 transition-all shadow-2xs">
              <User class="w-4.5 h-4.5 text-[#7A866E] mr-3 shrink-0" />
              <input
                type="text"
                v-model="fullName"
                required
                placeholder="Ví dụ: Nguyễn Minh Anh"
                class="w-full bg-transparent text-sm text-[#242424] placeholder-[#8C9882] outline-none"
              />
            </div>
          </div>

          <!-- 2 Cột: Email & SĐT (Cùng dòng Figma 16) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="space-y-1.5">
              <label class="text-xs sm:text-sm font-bold text-[#242424] block">Email *</label>
              <div class="flex items-center px-4 py-3.5 rounded-2xl border border-[#CCD7BC] bg-white focus-within:border-[#536124] focus-within:ring-2 focus-within:ring-[#536124]/20 transition-all shadow-2xs">
                <Mail class="w-4.5 h-4.5 text-[#7A866E] mr-2.5 shrink-0" />
                <input
                  type="email"
                  v-model="email"
                  required
                  placeholder="minhanh.fit@gmail.com"
                  class="w-full bg-transparent text-sm text-[#242424] placeholder-[#8C9882] outline-none"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs sm:text-sm font-bold text-[#242424] block">Số điện thoại *</label>
              <div class="flex items-center px-4 py-3.5 rounded-2xl border border-[#CCD7BC] bg-white focus-within:border-[#536124] focus-within:ring-2 focus-within:ring-[#536124]/20 transition-all shadow-2xs">
                <Phone class="w-4.5 h-4.5 text-[#7A866E] mr-2.5 shrink-0" />
                <input
                  type="tel"
                  v-model="phone"
                  required
                  placeholder="0912 345 678 (Giao 2H)"
                  class="w-full bg-transparent text-sm text-[#242424] placeholder-[#8C9882] outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Mật khẩu * -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <label class="font-bold text-[#242424]">Mật khẩu *</label>
              <span class="text-[#7A866E] font-medium">Tối thiểu 8 ký tự</span>
            </div>
            <div class="flex items-center px-4 py-3.5 rounded-2xl border border-[#CCD7BC] bg-white focus-within:border-[#536124] focus-within:ring-2 focus-within:ring-[#536124]/20 transition-all shadow-2xs">
              <Lock class="w-4.5 h-4.5 text-[#7A866E] mr-3 shrink-0" />
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                required
                minlength="8"
                placeholder="Nhập ít nhất 8 ký tự & số"
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

          <!-- Xác nhận mật khẩu * -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <label class="font-bold text-[#242424]">Xác nhận mật khẩu *</label>
              <span class="text-[#7A866E] font-medium">Tối thiểu 8 ký tự</span>
            </div>
            <div class="flex items-center px-4 py-3.5 rounded-2xl border border-[#CCD7BC] bg-white focus-within:border-[#536124] focus-within:ring-2 focus-within:ring-[#536124]/20 transition-all shadow-2xs">
              <Lock class="w-4.5 h-4.5 text-[#7A866E] mr-3 shrink-0" />
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="confirmPassword"
                required
                placeholder="Nhập ít nhất 8 ký tự & số"
                class="w-full bg-transparent text-sm text-[#242424] placeholder-[#8C9882] outline-none"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="text-[#7A866E] hover:text-[#242424] ml-2 cursor-pointer"
              >
                <EyeOff v-if="showConfirmPassword" class="w-4.5 h-4.5" />
                <Eye v-else class="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <!-- Checkbox Điều Khoản -->
          <label class="flex items-start gap-3 pt-1 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" v-model="isAgreed" class="accent-[#536124] w-4.5 h-4.5 rounded mt-0.5" />
            <span>Tôi đồng ý với <a href="#" class="underline font-bold text-[#242424]">Điều khoản dịch vụ</a> và <a href="#" class="underline font-bold text-[#242424]">Chính sách bảo vệ dữ liệu sức khỏe</a> của NutriMate.</span>
          </label>

          <!-- Nút Submit (Xanh rêu đậm Figma 16) -->
          <button
            type="submit"
            class="w-full py-4 rounded-2xl bg-[#6B7A3A] hover:bg-[#536124] active:bg-[#434F1D] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer"
          >
            <span>Đăng Ký Tài Khoản Ngay</span>
            <ArrowRight class="w-4.5 h-4.5" />
          </button>
        </form>

        <!-- Chuyển sang Đăng nhập -->
        <div class="text-center text-sm text-[#576449]">
          Bạn đã có tài khoản NutriMate?
          <RouterLink to="/login" class="font-bold text-[#242424] hover:underline ml-1">
            Đăng nhập tại đây
          </RouterLink>
        </div>
      </div>

      <!-- Footer chân trang cột phải (Figma 16) -->
      <div class="w-full max-w-[480px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A866E] pt-8 border-t border-[#F0F3EC]">
        <span>© 2026 NutriMate Vietnam. Nền tảng thực phẩm sạch và dinh dưỡng AI.</span>
        <div class="flex items-center gap-4 font-semibold text-[#242424]">
          <a href="#" class="hover:underline">Trợ giúp</a>
          <a href="#" class="hover:underline">Chính sách bảo mật</a>
        </div>
      </div>
    </div>
  </div>
</template>
