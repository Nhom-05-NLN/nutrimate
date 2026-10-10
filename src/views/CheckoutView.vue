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
  <div class="py-6 space-y-8 max-w-7xl mx-auto">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#2D3B1E]">Trang chủ</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <RouterLink to="/cart" class="hover:text-[#2D3B1E]">Giỏ hàng</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="text-[#2D3B1E] font-bold">Thanh toán</span>
    </nav>

    <!-- 3-Step Stepper Header (Figma 05) -->
    <div class="bg-white p-4 sm:p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs">
      <div class="flex items-center justify-between max-w-3xl mx-auto">
        <!-- Bước 1 -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-[#4D6A34] text-white flex items-center justify-center font-bold text-xs">
            ✓
          </div>
          <div class="hidden sm:block text-left">
            <span class="text-[10px] text-[#7A866E] uppercase font-bold block">Bước 1</span>
            <span class="text-xs font-bold text-[#2D3B1E]">Thông tin giao hàng</span>
          </div>
        </div>

        <div class="flex-1 h-0.5 bg-[#4D6A34] mx-4"></div>

        <!-- Bước 2 (Hiện tại) -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-[#4D6A34] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            2
          </div>
          <div class="hidden sm:block text-left">
            <span class="text-[10px] text-[#4D6A34] uppercase font-bold block">Bước 2 (Hiện tại)</span>
            <span class="text-xs font-bold text-[#2D3B1E]">Vận chuyển & Dinh dưỡng</span>
          </div>
        </div>

        <div class="flex-1 h-0.5 bg-[#DCE4D2] mx-4"></div>

        <!-- Bước 3 -->
        <div class="flex items-center gap-2.5 opacity-60">
          <div class="w-8 h-8 rounded-full bg-[#EBF1E6] text-[#6B7562] flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div class="hidden sm:block text-left">
            <span class="text-[10px] text-[#7A866E] uppercase font-bold block">Bước 3</span>
            <span class="text-xs font-bold text-[#6B7562]">Thanh toán & Xác nhận</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2 Columns Grid: Form Checkout + Summary -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Cột Trái: Form 3 phần (Thông tin, Vận chuyển, Thanh toán) -->
      <div class="lg:col-span-7 space-y-6">
        <!-- 1. Thông tin người nhận & Địa chỉ -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
            <div class="flex items-center gap-2 font-heading text-sm font-bold text-[#2D3B1E]">
              <span class="w-6 h-6 rounded-full bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center text-xs">1</span>
              <span>Thông tin người nhận & Địa chỉ</span>
            </div>
            <button type="button" class="text-xs font-bold text-[#4D6A34] hover:underline">
              ✎ Thay đổi
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Họ và tên</label>
              <input
                type="text"
                v-model="customer.name"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Số điện thoại</label>
              <input
                type="text"
                v-model="customer.phone"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
              />
            </div>
          </div>

          <div>
            <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Email nhận báo cáo dinh dưỡng & Hóa đơn</label>
            <input
              type="email"
              v-model="customer.email"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
            />
          </div>

          <div>
            <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Địa chỉ giao hàng thực tế</label>
            <input
              type="text"
              v-model="customer.address"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs font-semibold text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
            />
          </div>

          <div>
            <label class="text-[11px] font-bold text-[#7A866E] block mb-1">Ghi chú giao hàng</label>
            <input
              type="text"
              v-model="customer.note"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs text-[#2D3B1E] focus:bg-white focus:border-[#4D6A34] outline-none"
            />
          </div>
        </div>

        <!-- 2. Phương thức vận chuyển thực phẩm sạch -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
          <div class="flex items-center gap-2 font-heading text-sm font-bold text-[#2D3B1E] border-b border-[#F0F3EC] pb-3">
            <span class="w-6 h-6 rounded-full bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center text-xs">2</span>
            <span>Phương thức vận chuyển thực phẩm sạch</span>
          </div>

          <!-- Radio 1: Giao tiêu chuẩn -->
          <label
            class="flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all"
            :class="shippingMethod === 'standard' ? 'border-[#4D6A34] bg-[#F6F8F3]' : 'border-[#E3E8DC] bg-white'"
          >
            <div class="flex items-start gap-3">
              <input type="radio" value="standard" v-model="shippingMethod" class="accent-[#4D6A34] mt-1" />
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-[#2D3B1E]">Giao tiêu chuẩn (2-3 ngày)</span>
                  <span class="px-2 py-0.5 rounded-full bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">FREESHIP</span>
                </div>
                <p class="text-xs text-[#7A866E] mt-1">Đóng thùng cách nhiệt sinh thái, bảo toàn trọn vẹn chất lượng hạt và thanh dinh dưỡng.</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-[#4D6A34] block">Miễn phí</span>
              <span class="text-[10px] text-[#8C9484] line-through">25.000đ</span>
            </div>
          </label>

          <!-- Radio 2: Giao siêu tốc 2H -->
          <label
            class="flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all"
            :class="shippingMethod === 'express_2h' ? 'border-[#4D6A34] bg-[#F6F8F3]' : 'border-[#E3E8DC] bg-white'"
          >
            <div class="flex items-start gap-3">
              <input type="radio" value="express_2h" v-model="shippingMethod" class="accent-[#4D6A34] mt-1" />
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-[#2D3B1E]">Giao siêu tốc 2H (Nội thành TP.HCM & Hà Nội)</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">Giữ mát tươi sống</span>
                </div>
                <p class="text-xs text-[#7A866E] mt-1">Được vận chuyển bằng túi giữ lạnh chuyên dụng, thích hợp cho bơ hạt và snack tươi.</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-[#2D3B1E] block">35.000đ</span>
            </div>
          </label>
        </div>

        <!-- 3. Phương thức thanh toán (VietQR với QR Code động) -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
          <div class="flex items-center gap-2 font-heading text-sm font-bold text-[#2D3B1E] border-b border-[#F0F3EC] pb-3">
            <span class="w-6 h-6 rounded-full bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center text-xs">3</span>
            <span>Phương thức thanh toán</span>
          </div>

          <!-- VietQR Option (Active & Expanded by default) -->
          <div class="p-4 rounded-2xl border border-[#4D6A34] bg-[#F6F8F3] space-y-4">
            <label class="flex items-center justify-between cursor-pointer">
              <div class="flex items-center gap-2.5">
                <input type="radio" value="vietqr" v-model="paymentMethod" class="accent-[#4D6A34]" />
                <span class="text-xs font-bold text-[#2D3B1E]">Chuyển khoản QR Napas / VietQR</span>
                <span class="px-2 py-0.5 rounded-full bg-[#4D6A34] text-white text-[10px] font-bold">Khuyên dùng</span>
              </div>
            </label>

            <!-- Tặng yến mạch note -->
            <p class="text-[11px] text-[#4D6A34] font-medium pl-6">
              🎁 Tặng 500g yến mạch cho đơn đầu. Quét tức thì qua hơn 40 ứng dụng ngân hàng và ví số. Kích hoạt đơn lập tức.
            </p>

            <!-- VietQR Box Details -->
            <div class="p-4 rounded-2xl bg-white border border-[#DEE5D4] grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <!-- Mockup QR Image -->
              <div class="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-[#FAF9F5] rounded-xl border border-[#CCD7BC]">
                <div class="w-28 h-28 bg-white border-2 border-[#4D6A34] rounded-xl flex items-center justify-center p-1">
                  <div class="w-full h-full bg-[#EBF1E6] rounded flex flex-col items-center justify-center text-[#4D6A34]">
                    <QrCode class="w-16 h-16" />
                    <span class="text-[9px] font-extrabold uppercase mt-1">VietQR</span>
                  </div>
                </div>
                <span class="text-[10px] text-[#7A866E] font-medium mt-1 flex items-center gap-1">
                  ⚡ Quét tự động
                </span>
              </div>

              <!-- Banking Info Rows -->
              <div class="sm:col-span-7 space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-[#7A866E]">Ngân hàng:</span>
                  <span class="font-bold text-[#2D3B1E]">Techcombank (TCB)</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[#7A866E]">Chủ tài khoản:</span>
                  <span class="font-bold text-[#2D3B1E]">CONG TY NUTRIMATE VN</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[#7A866E]">Số tài khoản:</span>
                  <div class="flex items-center gap-1.5 font-bold text-[#2D3B1E]">
                    <span>1903 8899 7620 18</span>
                    <button
                      type="button"
                      @click="copyToClipboard('19038899762018', 'Số tài khoản')"
                      class="p-1 hover:text-[#4D6A34]"
                    >
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[#7A866E]">Nội dung chuyển:</span>
                  <div class="flex items-center gap-1.5 font-bold text-[#4D6A34] bg-[#EBF1E6] px-2 py-0.5 rounded-md">
                    <span>NUTRI98234</span>
                    <button
                      type="button"
                      @click="copyToClipboard('NUTRI98234', 'Nội dung chuyển khoản')"
                      class="p-1"
                    >
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div class="flex justify-between pt-1 border-t border-[#F0F3EC]">
                  <span class="text-[#7A866E]">Số tiền cần thanh toán:</span>
                  <span class="font-heading text-sm font-extrabold text-[#2D3B1E]">
                    {{ formatVnd(grandTotal) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Other Payment Options -->
          <label class="flex items-center justify-between p-4 rounded-2xl border border-[#E3E8DC] cursor-pointer hover:bg-[#FAF9F5]">
            <div class="flex items-center gap-2.5">
              <input type="radio" value="cod" v-model="paymentMethod" class="accent-[#4D6A34]" />
              <div>
                <span class="text-xs font-bold text-[#2D3B1E] block">Thanh toán khi nhận hàng (COD)</span>
                <span class="text-[11px] text-[#7A866E]">Kiểm tra tem niêm phong và đóng gói dinh dưỡng trước khi gửi tiền mặt.</span>
              </div>
            </div>
            <Truck class="w-4 h-4 text-[#7A866E]" />
          </label>

          <label class="flex items-center justify-between p-4 rounded-2xl border border-[#E3E8DC] cursor-pointer hover:bg-[#FAF9F5]">
            <div class="flex items-center gap-2.5">
              <input type="radio" value="momo" v-model="paymentMethod" class="accent-[#4D6A34]" />
              <div>
                <span class="text-xs font-bold text-[#2D3B1E] block">Ví điện tử MoMo / ZaloPay</span>
                <span class="text-[11px] text-[#7A866E]">Liên kết một chạm nhanh chóng và tiện lợi.</span>
              </div>
            </div>
            <span class="text-[10px] font-bold text-[#7A866E]">MOMO • ZALOPAY</span>
          </label>

          <label class="flex items-center justify-between p-4 rounded-2xl border border-[#E3E8DC] cursor-pointer hover:bg-[#FAF9F5]">
            <div class="flex items-center gap-2.5">
              <input type="radio" value="card" v-model="paymentMethod" class="accent-[#4D6A34]" />
              <div>
                <span class="text-xs font-bold text-[#2D3B1E] block">Thẻ ATM nội địa / Visa / Mastercard</span>
                <span class="text-[11px] text-[#7A866E]">Cổng thanh toán bảo mật 3D-Secure tiêu chuẩn quốc tế.</span>
              </div>
            </div>
            <CreditCard class="w-4 h-4 text-[#7A866E]" />
          </label>

          <!-- Checkbox Điều Khoản -->
          <label class="flex items-start gap-2.5 pt-2 text-xs text-[#576449] cursor-pointer">
            <input type="checkbox" v-model="isAgreed" class="accent-[#4D6A34] w-4 h-4 rounded mt-0.5" />
            <span>Tôi đồng ý với Điều khoản dịch vụ và Chính sách giao hàng bảo quản dinh dưỡng của NutriMate.</span>
          </label>

          <!-- Submit Button -->
          <button
            type="button"
            @click="handleFinishOrder"
            :disabled="isSubmitting"
            class="w-full py-4 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <Lock class="w-4 h-4" />
            <span>Xác nhận & Hoàn tất đặt hàng ({{ formatVnd(grandTotal) }})</span>
          </button>

          <p class="text-[11px] text-center text-[#7A866E]">
            🛡️ NutriMate cam kết bồi hoàn 100% nếu hạt bị ẩm hoặc mất độ giòn tươi.
          </p>
        </div>
      </div>

      <!-- Cột Phải: Order Summary & Voucher -->
      <aside class="lg:col-span-5 space-y-6">
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-sm space-y-5">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
            <h2 class="font-heading text-sm font-bold text-[#2D3B1E]">
              Đơn hàng của bạn (3 sản phẩm)
            </h2>
            <span class="px-2 py-0.5 rounded-full bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">
              3 món sạch
            </span>
          </div>

          <!-- 3 Sản phẩm xem trước -->
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Granola Yến Mạch Hạt Siêu Hạt</h4>
                  <span class="text-[11px] text-[#7A866E]">Túi 500g • Số lượng: 1</span>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">185.000đ</span>
            </div>

            <div class="flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Ức Gà Sấy Giòn Vị Thảo Mộc</h4>
                  <span class="text-[11px] text-[#7A866E]">Hộp 150g • Số lượng: 2</span>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">220.000đ</span>
            </div>

            <div class="flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Bơ Đậu Phộng Mịn Thuần Chay</h4>
                  <span class="text-[11px] text-[#7A866E]">Hũ 350g • Số lượng: 1</span>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">90.000đ</span>
            </div>
          </div>

          <!-- Voucher Apply -->
          <div class="pt-3 border-t border-[#F0F3EC]">
            <div class="flex items-center gap-2 p-1.5 bg-[#FAF9F5] border border-[#CCD7BC] rounded-2xl">
              <input
                type="text"
                v-model="voucherCode"
                class="flex-1 bg-transparent px-3 text-xs font-bold text-[#2D3B1E] uppercase outline-none"
              />
              <span class="px-3 py-1.5 rounded-xl bg-[#EBF1E6] text-[11px] font-bold text-[#4D6A34] shrink-0">
                ✓ Đã áp dụng
              </span>
            </div>
          </div>

          <!-- Bảng tính tiền -->
          <div class="space-y-2 text-xs text-[#576449] pt-2 border-t border-[#F0F3EC]">
            <div class="flex justify-between">
              <span>Tạm tính (3 món):</span>
              <span class="font-bold text-[#2D3B1E]">{{ formatVnd(subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Phí vận chuyển dự kiến:</span>
              <span class="font-bold text-[#2D3B1E]">{{ formatVnd(shippingFee) }}</span>
            </div>
            <div class="flex justify-between text-[#4D6A34] font-semibold">
              <span>Voucher NUTRIFREESHIP:</span>
              <span>-{{ formatVnd(voucherDiscount) }}</span>
            </div>
          </div>

          <div class="pt-4 border-t border-[#E3E8DC] flex items-baseline justify-between">
            <div>
              <span class="font-heading text-base font-bold text-[#2D3B1E] block">Tổng thanh toán:</span>
              <span class="text-[10px] text-[#7A866E]">Đã bao gồm VAT & bảo hiểm hàng tươi</span>
            </div>
            <div class="text-right">
              <span class="font-heading text-2xl font-black text-[#2D3B1E] block">
                {{ formatVnd(grandTotal) }}
              </span>
              <span class="text-[10px] text-[#4D6A34] font-bold">Tiết kiệm: 25.000đ</span>
            </div>
          </div>

          <!-- Hộp Hỗ Trợ Đơn Hàng 24/7 -->
          <div class="p-3.5 rounded-2xl bg-[#F6F8F3] border border-[#E3E8DC] flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-[#4D6A34]">
              <PhoneCall class="w-4 h-4" />
              <div>
                <span class="font-bold text-[#2D3B1E] block text-[11px]">Hỗ trợ đơn hàng 24/7</span>
                <span class="text-[10px] text-[#7A866E]">Đội ngũ chuyên viên dinh dưỡng NutriMate</span>
              </div>
            </div>
            <a href="tel:19008899" class="font-heading font-extrabold text-[#4D6A34] hover:underline">
              1900 8899
            </a>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
