<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import {
  ChevronRight,
  CheckCircle2,
  Truck,
  CreditCard,
  QrCode,
  ShieldCheck,
  PhoneCall,
  Copy,
  Lock,
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const isAgreed = ref(true);
const shippingMethod = ref<'standard' | 'express_2h'>('standard');
const paymentMethod = ref<'vietqr' | 'cod' | 'momo' | 'card'>('vietqr');
const voucherCode = ref('NUTRIFREESHIP');
const isSubmitting = ref(false);

const customer = ref({
  name: authStore.currentUser?.name || 'Nguyễn Minh Anh',
  phone: authStore.currentUser?.phone || '0912 345 678',
  email: authStore.currentUser?.email || 'minhanh.fit@gmail.com',
  address: 'Số 45 Đường D2, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh',
  note: 'Giao giờ hành chính, gọi trước 15 phút giúp mình',
});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const subtotal = computed(() => (cartStore.totalAmount > 0 ? cartStore.totalAmount : 495000));
const shippingFee = computed(() => (shippingMethod.value === 'express_2h' ? 35000 : 0));
const voucherDiscount = computed(() => 25000);
const grandTotal = computed(() => Math.max(0, subtotal.value + shippingFee.value - (shippingMethod.value === 'standard' ? 0 : 0)));

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toastStore.show(`Đã sao chép ${label}`, 'success', text);
}

function handleFinishOrder() {
  if (!isAgreed.value) {
    toastStore.show('Vui lòng đồng ý điều khoản dịch vụ để tiếp tục', 'error');
    return;
  }

  isSubmitting.value = true;
  setTimeout(() => {
    isSubmitting.value = false;
    cartStore.clearCart();
    toastStore.show('Đặt hàng thành công!', 'success', 'Mã đơn hàng: #NM-98234', 'Theo dõi đơn', '/orders');
    router.push('/orders');
  }, 1000);
}
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#242424]">Trang chủ</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <RouterLink to="/cart" class="hover:text-[#242424]">Giỏ hàng</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <span class="text-[#242424] font-bold">Thanh toán</span>
    </nav>

    <!-- 3-Step Stepper Header (Figma 05) -->
    <div class="bg-white p-5 sm:p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs">
      <div class="flex items-center justify-between max-w-3xl mx-auto">
        <!-- Bước 1 -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-[#4D6A34] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            ✓
          </div>
          <div class="hidden sm:block text-left">
            <span class="text-xs text-[#7A866E] uppercase font-bold block">Bước 1</span>
            <span class="text-sm font-bold text-[#242424]">Thông tin giao hàng</span>
          </div>
        </div>

        <div class="flex-1 h-0.5 bg-[#4D6A34] mx-4 sm:mx-6"></div>

        <!-- Bước 2 (Hiện tại) -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-[#4D6A34] text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#EBF7E5]">
            2
          </div>
          <div class="hidden sm:block text-left">
            <span class="text-xs text-[#4D6A34] uppercase font-bold block">Bước 2 (Hiện tại)</span>
            <span class="text-sm font-bold text-[#242424]">Vận chuyển & Dinh dưỡng</span>
          </div>
        </div>

        <div class="flex-1 h-0.5 bg-[#DCE4D2] mx-4 sm:mx-6"></div>

        <!-- Bước 3 -->
        <div class="flex items-center gap-3 opacity-60">
          <div class="w-9 h-9 rounded-full bg-[#EBF1E6] text-[#6B7562] flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div class="hidden sm:block text-left">
            <span class="text-xs text-[#7A866E] uppercase font-bold block">Bước 3</span>
            <span class="text-sm font-bold text-[#6B7562]">Thanh toán & Xác nhận</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2 Columns Grid: Form Checkout + Summary -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <!-- Cột Trái: Form 3 phần (Thông tin, Vận chuyển, Thanh toán) -->
      <div class="lg:col-span-7 space-y-7">
        <!-- 1. Thông tin người nhận & Địa chỉ -->
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
            <div class="flex items-center gap-2.5 font-heading text-base font-bold text-[#242424]">
              <span class="w-7 h-7 rounded-full bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center text-xs font-black">1</span>
              <span>Thông tin người nhận & Địa chỉ</span>
            </div>
            <button type="button" class="text-xs font-bold text-[#4D6A34] hover:underline cursor-pointer">
              ✎ Thay đổi
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-[#576449] block mb-1.5">Họ và tên</label>
              <input
                type="text"
                v-model="customer.name"
                class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-[#576449] block mb-1.5">Số điện thoại</label>
              <input
                type="text"
                v-model="customer.phone"
                class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-[#576449] block mb-1.5">Email nhận báo cáo dinh dưỡng & Hóa đơn</label>
            <input
              type="email"
              v-model="customer.email"
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-[#576449] block mb-1.5">Địa chỉ giao hàng thực tế</label>
            <input
              type="text"
              v-model="customer.address"
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-[#576449] block mb-1.5">Ghi chú giao hàng</label>
            <input
              type="text"
              v-model="customer.note"
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm text-[#242424] focus:bg-white focus:border-[#4D6A34] outline-none transition-colors"
            />
          </div>
        </div>

        <!-- 2. Phương thức vận chuyển thực phẩm sạch -->
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
          <div class="flex items-center gap-2.5 font-heading text-base font-bold text-[#242424] border-b border-[#F0F3EC] pb-4">
            <span class="w-7 h-7 rounded-full bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center text-xs font-black">2</span>
            <span>Phương thức vận chuyển thực phẩm sạch</span>
          </div>

          <!-- Radio 1: Giao tiêu chuẩn -->
          <label
            class="flex items-start justify-between p-5 rounded-2xl border cursor-pointer transition-all"
            :class="shippingMethod === 'standard' ? 'border-2 border-[#4D6A34] bg-[#F6F8F3]' : 'border border-[#E3E8DC] bg-white'"
          >
            <div class="flex items-start gap-3.5">
              <input type="radio" value="standard" v-model="shippingMethod" class="accent-[#4D6A34] w-4.5 h-4.5 mt-1" />
              <div>
                <div class="flex items-center gap-2.5">
                  <span class="text-sm font-bold text-[#242424]">Giao tiêu chuẩn (2-3 ngày)</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34]">FREESHIP</span>
                </div>
                <p class="text-xs text-[#7A866E] mt-1 leading-relaxed">
                  Đóng thùng cách nhiệt sinh thái, bảo toàn trọn vẹn chất lượng hạt và thanh dinh dưỡng.
                </p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold text-[#4D6A34] block">Miễn phí</span>
              <span class="text-xs text-[#8C9484] line-through">25.000đ</span>
            </div>
          </label>

          <!-- Radio 2: Giao siêu tốc 2H -->
          <label
            class="flex items-start justify-between p-5 rounded-2xl border cursor-pointer transition-all"
            :class="shippingMethod === 'express_2h' ? 'border-2 border-[#4D6A34] bg-[#F6F8F3]' : 'border border-[#E3E8DC] bg-white'"
          >
            <div class="flex items-start gap-3.5">
              <input type="radio" value="express_2h" v-model="shippingMethod" class="accent-[#4D6A34] w-4.5 h-4.5 mt-1" />
              <div>
                <div class="flex items-center gap-2.5">
                  <span class="text-sm font-bold text-[#242424]">Giao siêu tốc 2H (Nội thành TP.HCM & Hà Nội)</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">Giữ mát tươi sống</span>
                </div>
                <p class="text-xs text-[#7A866E] mt-1 leading-relaxed">
                  Được vận chuyển bằng túi giữ lạnh chuyên dụng, thích hợp cho bơ hạt và snack tươi.
                </p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold text-[#242424] block">35.000đ</span>
            </div>
          </label>
        </div>

        <!-- 3. Phương thức thanh toán (VietQR với QR Code động) -->
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
          <div class="flex items-center gap-2.5 font-heading text-base font-bold text-[#242424] border-b border-[#F0F3EC] pb-4">
            <span class="w-7 h-7 rounded-full bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center text-xs font-black">3</span>
            <span>Phương thức thanh toán</span>
          </div>

          <!-- VietQR Option (Expanded) -->
          <div class="p-5 rounded-2xl border-2 border-[#4D6A34] bg-[#F6F8F3] space-y-4">
            <label class="flex items-center justify-between cursor-pointer">
              <div class="flex items-center gap-3">
                <input type="radio" value="vietqr" v-model="paymentMethod" class="accent-[#4D6A34] w-4.5 h-4.5" />
                <span class="text-sm font-bold text-[#242424]">Chuyển khoản QR Napas / VietQR</span>
                <span class="px-2.5 py-0.5 rounded-full bg-[#4D6A34] text-white text-[11px] font-bold">Khuyên dùng</span>
              </div>
            </label>

            <!-- Note -->
            <p class="text-xs text-[#4D6A34] font-medium pl-7">
              🎁 Tặng 500g yến mạch cho đơn đầu. Quét tức thì qua hơn 40 ứng dụng ngân hàng và ví số. Kích hoạt đơn lập tức.
            </p>

            <!-- VietQR Box Details (Figma 05) -->
            <div class="p-5 rounded-2xl bg-white border border-[#DEE5D4] grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <!-- Mockup QR Image -->
              <div class="sm:col-span-5 flex flex-col items-center justify-center p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#CCD7BC]">
                <div class="w-32 h-32 bg-white border-2 border-[#4D6A34] rounded-2xl flex items-center justify-center p-1.5 shadow-2xs">
                  <div class="w-full h-full bg-[#EBF7E5] rounded-xl flex flex-col items-center justify-center text-[#4D6A34]">
                    <QrCode class="w-20 h-20" />
                    <span class="text-[10px] font-black uppercase mt-1">VietQR</span>
                  </div>
                </div>
                <span class="text-xs text-[#7A866E] font-bold mt-1.5 flex items-center gap-1">
                  ⚡ Quét tự động
                </span>
              </div>

              <!-- Banking Info Rows -->
              <div class="sm:col-span-7 space-y-2.5 text-xs sm:text-sm">
                <div class="flex justify-between">
                  <span class="text-[#7A866E]">Ngân hàng:</span>
                  <span class="font-bold text-[#242424]">Techcombank (TCB)</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[#7A866E]">Chủ tài khoản:</span>
                  <span class="font-bold text-[#242424]">CONG TY NUTRIMATE VN</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[#7A866E]">Số tài khoản:</span>
                  <div class="flex items-center gap-2 font-bold text-[#242424]">
                    <span class="font-mono text-sm">1903 8899 7620 18</span>
                    <button
                      type="button"
                      @click="copyToClipboard('19038899762018', 'Số tài khoản')"
                      class="p-1 hover:text-[#4D6A34] cursor-pointer"
                    >
                      <Copy class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[#7A866E]">Nội dung chuyển:</span>
                  <div class="flex items-center gap-2 font-bold text-[#4D6A34] bg-[#EBF7E5] px-2.5 py-1 rounded-lg">
                    <span class="font-mono text-sm">NUTRI98234</span>
                    <button
                      type="button"
                      @click="copyToClipboard('NUTRI98234', 'Nội dung chuyển khoản')"
                      class="p-1 cursor-pointer"
                    >
                      <Copy class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div class="flex justify-between pt-2 border-t border-[#F0F3EC]">
                  <span class="text-[#7A866E]">Số tiền cần chuyển:</span>
                  <span class="font-heading text-base font-black text-[#242424]">
                    {{ formatVnd(grandTotal) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Other Payment Options -->
          <label class="flex items-center justify-between p-4.5 rounded-2xl border border-[#E3E8DC] cursor-pointer hover:bg-[#FAF9F5] transition-colors">
            <div class="flex items-center gap-3">
              <input type="radio" value="cod" v-model="paymentMethod" class="accent-[#4D6A34] w-4.5 h-4.5" />
              <div>
                <span class="text-sm font-bold text-[#242424] block">Thanh toán khi nhận hàng (COD)</span>
                <span class="text-xs text-[#7A866E]">Kiểm tra tem niêm phong và đóng gói dinh dưỡng trước khi gửi tiền mặt.</span>
              </div>
            </div>
            <Truck class="w-5 h-5 text-[#7A866E]" />
          </label>

          <label class="flex items-center justify-between p-4.5 rounded-2xl border border-[#E3E8DC] cursor-pointer hover:bg-[#FAF9F5] transition-colors">
            <div class="flex items-center gap-3">
              <input type="radio" value="momo" v-model="paymentMethod" class="accent-[#4D6A34] w-4.5 h-4.5" />
              <div>
                <span class="text-sm font-bold text-[#242424] block">Ví điện tử MoMo / ZaloPay</span>
                <span class="text-xs text-[#7A866E]">Liên kết một chạm nhanh chóng và tiện lợi.</span>
              </div>
            </div>
            <span class="text-xs font-bold text-[#7A866E]">MOMO • ZALOPAY</span>
          </label>

          <label class="flex items-center justify-between p-4.5 rounded-2xl border border-[#E3E8DC] cursor-pointer hover:bg-[#FAF9F5] transition-colors">
            <div class="flex items-center gap-3">
              <input type="radio" value="card" v-model="paymentMethod" class="accent-[#4D6A34] w-4.5 h-4.5" />
              <div>
                <span class="text-sm font-bold text-[#242424] block">Thẻ ATM nội địa / Visa / Mastercard</span>
                <span class="text-xs text-[#7A866E]">Cổng thanh toán bảo mật 3D-Secure tiêu chuẩn quốc tế.</span>
              </div>
            </div>
            <CreditCard class="w-5 h-5 text-[#7A866E]" />
          </label>

          <!-- Checkbox Điều Khoản -->
          <label class="flex items-start gap-3 pt-2 text-xs sm:text-sm text-[#576449] cursor-pointer">
            <input type="checkbox" v-model="isAgreed" class="accent-[#4D6A34] w-4.5 h-4.5 rounded mt-0.5" />
            <span>Tôi đồng ý với Điều khoản dịch vụ và Chính sách giao hàng bảo quản dinh dưỡng của NutriMate.</span>
          </label>

          <!-- Submit Button -->
          <button
            type="button"
            @click="handleFinishOrder"
            :disabled="isSubmitting"
            class="w-full py-4.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-base shadow-md flex items-center justify-center gap-2.5 transition-all min-h-[48px] cursor-pointer"
          >
            <Lock class="w-5 h-5" />
            <span>Xác nhận & Hoàn tất đặt hàng ({{ formatVnd(grandTotal) }})</span>
          </button>

          <p class="text-xs text-center text-[#7A866E]">
            🛡️ NutriMate cam kết bồi hoàn 100% nếu hạt bị ẩm hoặc mất độ giòn tươi.
          </p>
        </div>
      </div>

      <!-- Cột Phải: Order Summary & Voucher -->
      <aside class="lg:col-span-5 space-y-6">
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
            <h2 class="font-heading text-base font-bold text-[#242424]">
              Đơn hàng của bạn (3 sản phẩm)
            </h2>
            <span class="px-3 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34]">
              3 món sạch
            </span>
          </div>

          <!-- 3 Sản phẩm xem trước -->
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-4 text-xs sm:text-sm">
              <div class="flex items-center gap-3.5">
                <img
                  src="https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=120&q=80"
                  alt="item"
                  class="w-14 h-14 rounded-2xl object-cover border border-[#E8ECE2]"
                />
                <div>
                  <h4 class="font-bold text-[#242424]">Granola Yến Mạch Hạt Siêu Hạt</h4>
                  <span class="text-xs text-[#7A866E]">Túi 500g • Số lượng: 1</span>
                </div>
              </div>
              <span class="font-bold text-[#242424]">185.000đ</span>
            </div>

            <div class="flex items-center justify-between gap-4 text-xs sm:text-sm">
              <div class="flex items-center gap-3.5">
                <img
                  src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=120&q=80"
                  alt="item"
                  class="w-14 h-14 rounded-2xl object-cover border border-[#E8ECE2]"
                />
                <div>
                  <h4 class="font-bold text-[#242424]">Ức Gà Sấy Giòn Vị Thảo Mộc</h4>
                  <span class="text-xs text-[#7A866E]">Hộp 150g • Số lượng: 2</span>
                </div>
              </div>
              <span class="font-bold text-[#242424]">220.000đ</span>
            </div>

            <div class="flex items-center justify-between gap-4 text-xs sm:text-sm">
              <div class="flex items-center gap-3.5">
                <img
                  src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=120&q=80"
                  alt="item"
                  class="w-14 h-14 rounded-2xl object-cover border border-[#E8ECE2]"
                />
                <div>
                  <h4 class="font-bold text-[#242424]">Bơ Đậu Phộng Mịn Thuần Chay</h4>
                  <span class="text-xs text-[#7A866E]">Hũ 350g • Số lượng: 1</span>
                </div>
              </div>
              <span class="font-bold text-[#242424]">90.000đ</span>
            </div>
          </div>

          <!-- Voucher Apply -->
          <div class="pt-4 border-t border-[#F0F3EC]">
            <div class="flex items-center gap-2 p-2 bg-[#FAF9F5] border border-[#CCD7BC] rounded-2xl">
              <input
                type="text"
                v-model="voucherCode"
                class="flex-1 bg-transparent px-3 text-xs sm:text-sm font-bold text-[#242424] uppercase outline-none"
              />
              <span class="px-3 py-1.5 rounded-xl bg-[#EBF7E5] text-xs font-bold text-[#4D6A34] shrink-0">
                ✓ Đã áp dụng
              </span>
            </div>
          </div>

          <!-- Bảng tính tiền -->
          <div class="space-y-2.5 text-sm text-[#576449] pt-2 border-t border-[#F0F3EC]">
            <div class="flex justify-between">
              <span>Tạm tính (3 món):</span>
              <span class="font-bold text-[#242424]">{{ formatVnd(subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Phí vận chuyển dự kiến:</span>
              <span class="font-bold text-[#242424]">{{ formatVnd(shippingFee) }}</span>
            </div>
            <div class="flex justify-between text-[#4D6A34] font-semibold">
              <span>Voucher NUTRIFREESHIP:</span>
              <span>-{{ formatVnd(voucherDiscount) }}</span>
            </div>
          </div>

          <div class="pt-5 border-t border-[#E3E8DC] flex items-baseline justify-between">
            <div>
              <span class="font-heading text-lg font-bold text-[#242424] block">Tổng thanh toán:</span>
              <span class="text-xs text-[#7A866E]">Đã bao gồm VAT & bảo hiểm hàng tươi</span>
            </div>
            <div class="text-right">
              <span class="font-heading text-2xl sm:text-3xl font-black text-[#242424] block">
                {{ formatVnd(grandTotal) }}
              </span>
              <span class="text-xs text-[#4D6A34] font-bold">Tiết kiệm: 25.000đ</span>
            </div>
          </div>

          <!-- Hộp Hỗ Trợ Đơn Hàng 24/7 -->
          <div class="p-4 rounded-2xl bg-[#F6F8F3] border border-[#E3E8DC] flex items-center justify-between text-xs sm:text-sm">
            <div class="flex items-center gap-3 text-[#4D6A34]">
              <PhoneCall class="w-5 h-5 shrink-0" />
              <div>
                <span class="font-bold text-[#242424] block text-xs">Hỗ trợ đơn hàng 24/7</span>
                <span class="text-[11px] text-[#7A866E]">Đội ngũ chuyên viên dinh dưỡng NutriMate</span>
              </div>
            </div>
            <a href="tel:19008899" class="font-heading font-black text-[#4D6A34] text-base hover:underline">
              1900 8899
            </a>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
