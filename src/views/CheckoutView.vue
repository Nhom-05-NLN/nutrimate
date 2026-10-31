<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore, getCartItemKey } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useVoucherStore } from '../stores/voucherStore';
import { postOrder } from '../services/api';
import { CustomerInfo, Order, PaymentMethod, CreateOrderPayload, Voucher } from '../types';
import ShippingAddressForm from '../components/checkout/ShippingAddressForm.vue';
import VietQrModal from '../components/checkout/VietQrModal.vue';
import {
  ChevronRight,
  Truck,
  CreditCard,
  QrCode,
  ShieldCheck,
  PhoneCall,
  Lock,
  Flame,
  Dumbbell,
  AlertCircle,
  Tag,
  ShoppingBag,
  Ticket,
  Check,
  X,
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const toastStore = useToastStore();
const voucherStore = useVoucherStore();

const isAgreed = ref(true);
const shippingMethod = ref<'standard' | 'express_2h'>('standard');
const paymentMethod = ref<PaymentMethod>('vietqr');
const voucherInput = ref('');
const appliedVoucher = ref<Voucher | null>(null);
const isSubmitting = ref(false);
const showVietQrModal = ref(false);
const createdOrder = ref<Order | null>(null);

onMounted(() => {
  voucherStore.loadVouchers();
});

const customer = ref<CustomerInfo>({
  name: authStore.currentUser?.name || 'Nguyễn Minh Anh',
  phone: authStore.currentUser?.phone || '0912 345 678',
  email: authStore.currentUser?.email || 'minhanh.fit@gmail.com',
  address: 'Số 45 Đường D2, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh',
  note: 'Giao giờ hành chính, gọi trước 15 phút giúp mình',
});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Lấy danh sách sản phẩm checkout: ưu tiên các món được tick chọn
const checkoutItems = computed(() => {
  if (cartStore.selectedItems.length > 0) {
    return cartStore.selectedItems;
  }
  return cartStore.items;
});

const subtotal = computed(() => {
  return checkoutItems.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
});

const totalKcal = computed(() => {
  return Math.round(checkoutItems.value.reduce((sum, item) => sum + item.product.nutrition.calories * item.quantity, 0));
});

const totalProtein = computed(() => {
  return Math.round(checkoutItems.value.reduce((sum, item) => sum + item.product.nutrition.protein * item.quantity, 0) * 10) / 10;
});

const isFreeShipping = computed(() => {
  return subtotal.value >= 300000 || (appliedVoucher.value?.code?.toUpperCase().includes('FREESHIP') ?? false);
});

const baseShippingFee = computed(() => {
  if (shippingMethod.value === 'express_2h') return 35000;
  return isFreeShipping.value ? 0 : 25000;
});

const voucherDiscount = computed(() => {
  if (!appliedVoucher.value) return 0;
  const v = appliedVoucher.value;
  if (subtotal.value < v.minOrderAmount) return 0;

  if (v.discountType === 'fixed') {
    return Math.min(v.discountValue, subtotal.value);
  }
  let discount = Math.round(subtotal.value * (v.discountValue / 100));
  if (v.maxDiscountAmount && v.maxDiscountAmount > 0) {
    discount = Math.min(discount, v.maxDiscountAmount);
  }
  return discount;
});

const shippingFee = computed(() => {
  return baseShippingFee.value;
});

const grandTotal = computed(() => {
  return Math.max(0, subtotal.value + shippingFee.value - voucherDiscount.value);
});

function selectVoucher(v: Voucher) {
  if (subtotal.value < v.minOrderAmount) {
    const diff = v.minOrderAmount - subtotal.value;
    toastStore.show(
      `Mã ${v.code} áp dụng cho đơn từ ${formatVnd(v.minOrderAmount)} (còn thiếu ${formatVnd(diff)})`,
      'warning'
    );
    return;
  }

  appliedVoucher.value = v;
  voucherInput.value = v.code;
  toastStore.show(`Đã áp dụng mã ${v.code}`, 'success');
}

function removeVoucher() {
  appliedVoucher.value = null;
  voucherInput.value = '';
  toastStore.show('Đã gỡ bỏ mã giảm giá', 'info');
}

function applyVoucherInput() {
  const code = voucherInput.value.trim().toUpperCase();
  if (!code) {
    removeVoucher();
    return;
  }
  const found = voucherStore.getVoucherByCode(code);
  if (found) {
    selectVoucher(found);
  } else {
    toastStore.show('Mã voucher không hợp lệ hoặc đã hết hạn', 'warning');
  }
}

async function handleFinishOrder() {
  if (checkoutItems.value.length === 0) {
    toastStore.show('Giỏ hàng trống! Vui lòng chọn món trước khi đặt hàng', 'warning');
    router.push('/catalog');
    return;
  }

  if (!customer.value.name.trim() || !customer.value.phone.trim() || !customer.value.address.trim()) {
    toastStore.show('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng', 'error');
    return;
  }

  if (!isAgreed.value) {
    toastStore.show('Vui lòng đồng ý với Điều khoản dịch vụ để tiếp tục', 'error');
    return;
  }

  isSubmitting.value = true;

  try {
    const payload: CreateOrderPayload = {
      customer: customer.value,
      items: checkoutItems.value.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        productImage: i.product.image,
        price: i.product.price,
        quantity: i.quantity,
        calories: i.product.nutrition.calories,
        protein: i.product.nutrition.protein,
        portion: i.selectedPortion,
      })),
      shippingMethod: shippingMethod.value,
      paymentMethod: paymentMethod.value,
      voucherCode: appliedVoucher.value ? appliedVoucher.value.code : undefined,
      notes: customer.value.note,
    };

    const newOrder = await postOrder(payload);
    createdOrder.value = newOrder;

    // Dọn giỏ hàng sau khi tạo đơn thành công
    cartStore.clearCart();

    if (paymentMethod.value === 'vietqr') {
      // Mở modal VietQR để quét mã và mô phỏng thanh toán
      showVietQrModal.value = true;
    } else {
      toastStore.show('Đặt hàng thành công!', 'success', `Mã đơn hàng: #${newOrder.orderCode}`, 'Theo dõi đơn', '/orders');
      router.push('/orders');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi tạo đơn hàng';
    toastStore.show(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm font-medium text-[#7E8B73]" aria-label="Breadcrumb">
      <RouterLink to="/" class="hover:text-[#242424]">Trang chủ</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <RouterLink to="/cart" class="hover:text-[#242424]">Giỏ hàng</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <span class="text-[#242424] font-bold">Thanh toán & Đặt hàng</span>
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
            <span class="text-sm font-bold text-[#242424]">Giỏ hàng & Dinh dưỡng</span>
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
            <span class="text-sm font-bold text-[#242424]">Địa chỉ & Vận chuyển</span>
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
            <span class="text-sm font-bold text-[#6B7562]">Thanh toán & Hoàn tất</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State nếu không có món nào -->
    <div v-if="checkoutItems.length === 0" class="p-16 text-center bg-white rounded-3xl border border-[#E3E8DC] space-y-4 shadow-2xs">
      <div class="w-20 h-20 rounded-full bg-[#FAF9F5] text-[#7A866E] flex items-center justify-center mx-auto border border-[#E8ECE2]">
        <ShoppingBag class="w-10 h-10 stroke-[1.5]" />
      </div>
      <h3 class="font-heading text-xl font-bold text-[#242424]">Không có sản phẩm nào để thanh toán</h3>
      <p class="text-sm text-[#7A866E] max-w-md mx-auto">
        Vui lòng quay lại giỏ hàng và chọn các sản phẩm bạn muốn đặt nhé.
      </p>
      <RouterLink
        to="/cart"
        class="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#4D6A34] text-white text-sm font-bold shadow-md hover:bg-[#3B4E24] transition-all"
      >
        <span>Quay lại Giỏ hàng</span>
      </RouterLink>
    </div>

    <!-- 2 Columns Grid: Form Checkout + Summary -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <!-- Cột Trái: Form 3 phần (Thông tin nhận hàng, Vận chuyển, Thanh toán) -->
      <div class="lg:col-span-7 space-y-7">
        <!-- 1. Thông tin người nhận & Địa chỉ (dùng ShippingAddressForm component - CN_19) -->
        <ShippingAddressForm v-model="customer" />

        <!-- 2. Phương thức vận chuyển thực phẩm sạch (CN_19) -->
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
          <div class="flex items-center gap-2.5 font-heading text-base font-bold text-[#242424] border-b border-[#F0F3EC] pb-4">
            <span class="w-7 h-7 rounded-full bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center text-xs font-black">2</span>
            <span>Phương thức vận chuyển thực phẩm sạch</span>
          </div>

          <!-- Radio 1: Giao tiêu chuẩn -->
          <label
            class="flex items-start justify-between p-5 rounded-2xl border cursor-pointer transition-all"
            :class="shippingMethod === 'standard' ? 'border-2 border-[#4D6A34] bg-[#F6F8F3]' : 'border border-[#E3E8DC] bg-white hover:border-[#CCD7BC]'"
          >
            <div class="flex items-start gap-3.5">
              <input type="radio" value="standard" v-model="shippingMethod" class="accent-[#4D6A34] w-4.5 h-4.5 mt-1 cursor-pointer" />
              <div>
                <div class="flex items-center gap-2.5">
                  <span class="text-sm font-bold text-[#242424]">Giao tiêu chuẩn (2-3 ngày)</span>
                  <span v-if="isFreeShipping" class="px-2.5 py-0.5 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34]">FREESHIP</span>
                </div>
                <p class="text-xs text-[#7A866E] mt-1 leading-relaxed">
                  Đóng thùng cách nhiệt sinh thái, bảo toàn trọn vẹn độ giòn của hạt và thanh dinh dưỡng.
                </p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span v-if="isFreeShipping" class="text-sm font-bold text-[#4D6A34] block">Miễn phí</span>
              <span v-else class="text-sm font-bold text-[#242424] block">25.000đ</span>
              <span v-if="isFreeShipping" class="text-xs text-[#8C9484] line-through">25.000đ</span>
            </div>
          </label>

          <!-- Radio 2: Giao siêu tốc 2H (giữ lạnh) -->
          <label
            class="flex items-start justify-between p-5 rounded-2xl border cursor-pointer transition-all"
            :class="shippingMethod === 'express_2h' ? 'border-2 border-[#4D6A34] bg-[#F6F8F3]' : 'border border-[#E3E8DC] bg-white hover:border-[#CCD7BC]'"
          >
            <div class="flex items-start gap-3.5">
              <input type="radio" value="express_2h" v-model="shippingMethod" class="accent-[#4D6A34] w-4.5 h-4.5 mt-1 cursor-pointer" />
              <div>
                <div class="flex items-center gap-2.5">
                  <span class="text-sm font-bold text-[#242424]">Giao siêu tốc 2H (Giữ lạnh chuyên dụng 4°C)</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">Tươi sống</span>
                </div>
                <p class="text-xs text-[#7A866E] mt-1 leading-relaxed">
                  Được vận chuyển trong thùng giữ nhiệt 4°C, bảo vệ độ tươi ngon của bơ hạt và ức gà tươi sấy.
                </p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-sm font-bold text-[#242424] block">35.000đ</span>
            </div>
          </label>
        </div>

        <!-- 3. Phương thức thanh toán (CN_21) -->
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
          <div class="flex items-center gap-2.5 font-heading text-base font-bold text-[#242424] border-b border-[#F0F3EC] pb-4">
            <span class="w-7 h-7 rounded-full bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center text-xs font-black">3</span>
            <span>Phương thức thanh toán</span>
          </div>

          <!-- VietQR Option (Mô phỏng Napas) -->
          <div
            class="p-5 rounded-2xl border cursor-pointer transition-all"
            :class="paymentMethod === 'vietqr' ? 'border-2 border-[#4D6A34] bg-[#F6F8F3]' : 'border border-[#E3E8DC] bg-white'"
            @click="paymentMethod = 'vietqr'"
          >
            <label class="flex items-center justify-between cursor-pointer">
              <div class="flex items-center gap-3">
                <input type="radio" value="vietqr" v-model="paymentMethod" class="accent-[#4D6A34] w-4.5 h-4.5" />
                <span class="text-sm font-bold text-[#242424]">Chuyển khoản VietQR Napas 24/7 (Quét mã tự động)</span>
                <span class="px-2.5 py-0.5 rounded-full bg-[#4D6A34] text-white text-[11px] font-bold">Khuyên dùng</span>
              </div>
              <QrCode class="w-5 h-5 text-[#4D6A34]" />
            </label>
            <p class="text-xs text-[#4D6A34] font-medium pl-7 mt-2 leading-relaxed">
              Mã QR động sẽ được tạo ngay khi bạn xác nhận đặt hàng, chuyển khoản tức thì qua hơn 40 app ngân hàng & ví số.
            </p>
          </div>

          <!-- COD Option -->
          <label
            class="flex items-center justify-between p-4.5 rounded-2xl border cursor-pointer transition-all"
            :class="paymentMethod === 'cod' ? 'border-2 border-[#4D6A34] bg-[#F6F8F3]' : 'border border-[#E3E8DC] bg-white hover:border-[#CCD7BC]'"
          >
            <div class="flex items-center gap-3">
              <input type="radio" value="cod" v-model="paymentMethod" class="accent-[#4D6A34] w-4.5 h-4.5" />
              <div>
                <span class="text-sm font-bold text-[#242424] block">Thanh toán tiền mặt khi nhận hàng (COD)</span>
                <span class="text-xs text-[#7A866E]">Kiểm tra tem bảo hành và đóng gói dinh dưỡng trước khi thanh toán.</span>
              </div>
            </div>
            <Truck class="w-5 h-5 text-[#7A866E]" />
          </label>

          <!-- MoMo Option -->
          <label
            class="flex items-center justify-between p-4.5 rounded-2xl border cursor-pointer transition-all"
            :class="paymentMethod === 'momo' ? 'border-2 border-[#4D6A34] bg-[#F6F8F3]' : 'border border-[#E3E8DC] bg-white hover:border-[#CCD7BC]'"
          >
            <div class="flex items-center gap-3">
              <input type="radio" value="momo" v-model="paymentMethod" class="accent-[#4D6A34] w-4.5 h-4.5" />
              <div>
                <span class="text-sm font-bold text-[#242424] block">Ví điện tử MoMo / ZaloPay</span>
                <span class="text-xs text-[#7A866E]">Thanh toán nhanh một chạm an toàn qua ví điện tử.</span>
              </div>
            </div>
            <span class="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg">MOMO</span>
          </label>

          <!-- Checkbox Điều Khoản -->
          <label class="flex items-start gap-3 pt-2 text-xs sm:text-sm text-[#576449] cursor-pointer">
            <input type="checkbox" v-model="isAgreed" class="accent-[#4D6A34] w-4.5 h-4.5 rounded mt-0.5 cursor-pointer" />
            <span>Tôi đồng ý với Điều khoản dịch vụ và Quy định bảo quản thực phẩm ăn kiêng của NutriMate.</span>
          </label>

          <!-- Submit Button (CN_20) -->
          <button
            type="button"
            @click="handleFinishOrder"
            :disabled="isSubmitting"
            class="w-full py-4.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base shadow-md flex items-center justify-center gap-2.5 transition-all min-h-[48px] cursor-pointer"
          >
            <Lock class="w-5 h-5" />
            <span v-if="isSubmitting">Đang khởi tạo đơn hàng...</span>
            <span v-else>Xác nhận & Hoàn tất đặt hàng ({{ formatVnd(grandTotal) }})</span>
          </button>
        </div>
      </div>

      <!-- Cột Phải: Order Summary, Nutrition Card & Voucher (CN_20) -->
      <aside class="lg:col-span-5 space-y-6">
        <div class="bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
            <h2 class="font-heading text-base font-bold text-[#242424]">
              Đơn hàng của bạn ({{ checkoutItems.length }} món)
            </h2>
            <span class="px-3 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34] border border-[#CCD7BC]">
              Dinh dưỡng sạch
            </span>
          </div>

          <!-- Total Nutrition Bar (CN_20) -->
          <div class="p-3.5 rounded-2xl bg-[#232722] text-white flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <Flame class="w-4 h-4 text-amber-300" />
              <span>Năng lượng: <strong class="text-white">{{ totalKcal }} kcal</strong></span>
            </div>
            <div class="h-4 w-px bg-slate-700"></div>
            <div class="flex items-center gap-2">
              <Dumbbell class="w-4 h-4 text-emerald-400" />
              <span>Đạm: <strong class="text-white">{{ totalProtein }}g</strong></span>
            </div>
          </div>

          <!-- Render động danh sách sản phẩm thực tế từ cartStore -->
          <div class="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="item in checkoutItems"
              :key="getCartItemKey(item.product.id, item.selectedPortion)"
              class="flex items-center justify-between gap-3 text-xs sm:text-sm p-2 rounded-xl hover:bg-[#FAF9F5] transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <img
                  :src="item.product.image"
                  :alt="item.product.name"
                  class="w-13 h-13 rounded-xl object-cover border border-[#E8ECE2] shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <h4 class="font-bold text-[#242424] truncate">{{ item.product.name }}</h4>
                  <div class="text-xs text-[#7A866E]">
                    {{ item.selectedPortion || 'Mặc định' }} • SL: <span class="font-bold text-[#242424]">{{ item.quantity }}</span>
                  </div>
                </div>
              </div>
              <span class="font-heading font-black text-[#242424] shrink-0">
                {{ formatVnd(item.product.price * item.quantity) }}
              </span>
            </div>
          </div>

          <!-- Voucher Apply Form (CN_20) -->
          <div class="pt-4 border-t border-[#F0F3EC] space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-[#576449] flex items-center gap-1.5">
                <Ticket class="w-3.5 h-3.5 text-[#4D6A34]" />
                <span>Mã giảm giá NutriMate</span>
              </label>
              <span v-if="appliedVoucher" class="text-xs font-bold text-[#4D6A34]">
                -{{ formatVnd(voucherDiscount) }}
              </span>
            </div>

            <!-- Input áp mã thủ công -->
            <div class="flex items-center gap-2 p-1.5 bg-[#FAF9F5] border border-[#CCD7BC] rounded-2xl">
              <input
                type="text"
                v-model="voucherInput"
                placeholder="Nhập mã (VD: HELLO_NUTRI, HEALTHY20...)"
                class="flex-1 bg-transparent px-3 text-xs sm:text-sm font-bold text-[#242424] uppercase outline-none"
                @keyup.enter="applyVoucherInput"
              />
              <button
                v-if="appliedVoucher && appliedVoucher.code === voucherInput.trim().toUpperCase()"
                type="button"
                @click="removeVoucher"
                class="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-[#576449] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Gỡ bỏ
              </button>
              <button
                v-else
                type="button"
                @click="applyVoucherInput"
                class="px-4 py-2 rounded-xl bg-[#4D6A34] text-white hover:bg-[#3B4E24] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Áp dụng
              </button>
            </div>

            <!-- Box thông báo khi đã áp dụng thành công -->
            <div
              v-if="appliedVoucher"
              class="p-2.5 rounded-2xl bg-[#EBF7E5] border border-[#CCD7BC] text-xs flex items-center justify-between text-[#4D6A34]"
            >
              <div class="flex items-center gap-2">
                <Check class="w-4 h-4 shrink-0" />
                <div>
                  <span class="font-bold">Đã áp dụng: {{ appliedVoucher.code }}</span>
                  <span class="text-[11px] text-[#576449] block sm:inline sm:ml-1">({{ appliedVoucher.title }})</span>
                </div>
              </div>
              <button
                type="button"
                @click="removeVoucher"
                class="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors ml-2 cursor-pointer shrink-0"
              >
                Gỡ mã
              </button>
            </div>

            <!-- Danh sách Voucher gợi ý (Chọn nhanh 1-click) -->
            <div class="space-y-2 pt-1">
              <span class="text-[11px] font-bold text-[#7A866E] block">
                Gợi ý voucher hôm nay (Bấm chọn nhanh):
              </span>

              <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div
                  v-for="v in voucherStore.activeVouchers"
                  :key="v.id"
                  class="p-2.5 rounded-2xl border transition-all text-xs flex items-center justify-between gap-2"
                  :class="[
                    appliedVoucher?.code === v.code
                      ? 'bg-[#EBF7E5] border-[#4D6A34] ring-1 ring-[#4D6A34]'
                      : subtotal >= v.minOrderAmount
                        ? 'bg-white border-[#E3E8DC] hover:border-[#CCD7BC]'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                  ]"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-black text-[#242424] uppercase tracking-wide">{{ v.code }}</span>
                      <span
                        v-if="v.targetType === 'first_order'"
                        class="px-2 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]"
                      >
                        Khách mới
                      </span>
                      <span
                        v-else-if="v.discountType === 'percent'"
                        class="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]"
                      >
                        -{{ v.discountValue }}%
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]"
                      >
                        -{{ v.discountValue / 1000 }}k
                      </span>
                    </div>

                    <div class="text-[11px] text-[#7A866E] truncate mt-0.5">
                      Đơn từ {{ formatVnd(v.minOrderAmount) }}
                      <span v-if="v.maxDiscountAmount" class="text-[10px]"> (Tối đa {{ formatVnd(v.maxDiscountAmount) }})</span>
                    </div>
                  </div>

                  <button
                    v-if="appliedVoucher?.code === v.code"
                    type="button"
                    @click="removeVoucher"
                    class="px-3 py-1.5 rounded-xl bg-[#4D6A34] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Check class="w-3.5 h-3.5" />
                    <span>Đang dùng</span>
                  </button>

                  <button
                    v-else-if="subtotal >= v.minOrderAmount"
                    type="button"
                    @click="selectVoucher(v)"
                    class="px-3 py-1.5 rounded-xl bg-[#F0F4E8] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Dùng mã
                  </button>

                  <span
                    v-else
                    class="text-[10px] text-amber-700 font-semibold text-right shrink-0"
                  >
                    Thiếu {{ formatVnd(v.minOrderAmount - subtotal) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bảng tính tiền chi tiết -->
          <div class="space-y-2.5 text-sm text-[#576449] pt-2 border-t border-[#F0F3EC]">
            <div class="flex justify-between">
              <span>Tạm tính ({{ checkoutItems.length }} món):</span>
              <span class="font-bold text-[#242424]">{{ formatVnd(subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Phí vận chuyển:</span>
              <div class="text-right">
                <span v-if="shippingFee === 0" class="font-bold text-[#4D6A34]">
                  MIỄN PHÍ {{ subtotal >= 300000 ? '(Đơn ≥ 300k)' : '(Freeship)' }}
                </span>
                <span v-else class="font-bold text-[#242424]">{{ formatVnd(shippingFee) }}</span>
              </div>
            </div>
            <div v-if="appliedVoucher && voucherDiscount > 0" class="flex justify-between text-[#4D6A34] font-semibold">
              <span>Giảm giá voucher ({{ appliedVoucher.code }}):</span>
              <span>-{{ formatVnd(voucherDiscount) }}</span>
            </div>
          </div>

          <!-- Tổng cộng thanh toán -->
          <div class="pt-5 border-t border-[#E3E8DC] flex items-baseline justify-between">
            <div>
              <span class="font-heading text-lg font-bold text-[#242424] block">Tổng thanh toán:</span>
              <span class="text-xs text-[#7A866E]">Đã bao gồm VAT & cam kết tươi ngon</span>
            </div>
            <div class="text-right">
              <span class="font-heading text-2xl sm:text-3xl font-black text-[#242424] block">
                {{ formatVnd(grandTotal) }}
              </span>
              <span v-if="voucherDiscount > 0" class="text-xs text-[#4D6A34] font-bold">
                Tiết kiệm {{ formatVnd(voucherDiscount) }}
              </span>
            </div>
          </div>

          <!-- Hỗ trợ đơn hàng -->
          <div class="p-4 rounded-2xl bg-[#F6F8F3] border border-[#E3E8DC] flex items-center justify-between text-xs sm:text-sm">
            <div class="flex items-center gap-3 text-[#4D6A34]">
              <PhoneCall class="w-5 h-5 shrink-0" />
              <div>
                <span class="font-bold text-[#242424] block text-xs">Hỗ trợ đặt hàng 24/7</span>
                <span class="text-[11px] text-[#7A866E]">Chuyên viên dinh dưỡng NutriMate</span>
              </div>
            </div>
            <a href="tel:19008899" class="font-heading font-black text-[#4D6A34] text-base hover:underline">
              1900 8899
            </a>
          </div>
        </div>
      </aside>
    </div>

    <!-- VietQR Payment Modal Component (CN_21) -->
    <VietQrModal
      :open="showVietQrModal"
      :order="createdOrder"
      @close="showVietQrModal = false"
      @payment-success="showVietQrModal = false"
    />
  </div>
</template>
