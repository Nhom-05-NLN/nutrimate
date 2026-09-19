<script setup lang="ts">
import { ref } from 'vue';
import { useCartStore } from '../../stores/cartStore';
import { useToastStore } from '../../stores/toastStore';
import { postOrder } from '../../services/api';
import { PaymentMethod, Order } from '../../types';
import {
  X,
  CheckCircle2,
  QrCode,
  Truck,
  CreditCard,
  Flame,
  Dumbbell,
  AlertCircle,
} from 'lucide-vue-next';

const cartStore = useCartStore();
const toastStore = useToastStore();

const customerName = ref('');
const customerPhone = ref('');
const customerEmail = ref('');
const customerAddress = ref('');
const notes = ref('');
const paymentMethod = ref<PaymentMethod>('vietqr');

const isSubmitting = ref(false);
const completedOrder = ref<Order | null>(null);
const errorMessage = ref<string | null>(null);

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

async function handlePlaceOrder() {
  if (!customerName.value.trim() || !customerPhone.value.trim() || !customerAddress.value.trim()) {
    errorMessage.value = 'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const payload = {
      customer: {
        name: customerName.value.trim(),
        phone: customerPhone.value.trim(),
        email: customerEmail.value.trim() || 'khachhang@nutrimate.vn',
        address: customerAddress.value.trim(),
      },
      items: cartStore.items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        productImage: i.product.image,
        price: i.product.price,
        quantity: i.quantity,
        calories: i.product.nutrition.calories,
        protein: i.product.nutrition.protein,
      })),
      paymentMethod: paymentMethod.value,
      notes: notes.value.trim(),
    };

    const newOrder = await postOrder(payload);
    completedOrder.value = newOrder;
    cartStore.clearCart();
    toastStore.show(`Đặt hàng thành công! Mã đơn: ${newOrder.orderCode}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Không thể hoàn tất đặt hàng';
    errorMessage.value = msg;
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  completedOrder.value = null;
  errorMessage.value = null;
  cartStore.closeCheckout();
}
</script>

<template>
  <div
    v-if="cartStore.isCheckoutOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
    @click.self="handleClose"
  >
    <div
      class="relative w-full max-w-2xl bg-white rounded-4xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      role="dialog"
      aria-modal="true"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click="handleClose"
        class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
        aria-label="Đóng cửa sổ"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- SUCCESS VIEW -->
      <div v-if="completedOrder" class="p-8 sm:p-10 text-center space-y-6">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-9 h-9" />
        </div>

        <div class="space-y-2">
          <h3 class="font-heading text-2xl font-bold text-slate-900">Đặt Hàng Thành Công!</h3>
          <p class="text-sm text-slate-600">
            Cảm ơn bạn đã lựa chọn thực phẩm ăn kiêng lành mạnh tại NutriMate.
          </p>
          <div class="inline-block px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-sm font-bold border border-emerald-200">
            Mã đơn hàng: {{ completedOrder.orderCode }}
          </div>
        </div>

        <!-- VietQR Simulation if VietQR selected -->
        <div v-if="completedOrder.paymentMethod === 'vietqr'" class="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
            <QrCode class="w-4 h-4 text-emerald-600" />
            <span>Mô Phỏng Quét Mã VietQR</span>
          </div>
          <div class="aspect-square w-48 mx-auto bg-white rounded-xl border border-slate-200 p-3 flex flex-col items-center justify-center text-center">
            <div class="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center font-mono text-xs text-slate-400 p-2">
              [VIETQR MOCK]<br />STK: 0123456789<br />MBBANK<br />Số tiền: {{ formatVnd(completedOrder.totalAmount) }}
            </div>
          </div>
          <p class="text-[11px] text-slate-500 text-center">
            Hệ thống tự động kích hoạt trạng thái "Đã thanh toán" cho đơn hàng mô phỏng.
          </p>
        </div>

        <!-- Order summary pills -->
        <div class="flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
          <span>Tổng tiền: <strong>{{ formatVnd(completedOrder.totalAmount) }}</strong></span>
          <span>•</span>
          <span>Năng lượng: <strong>{{ completedOrder.totalCalories }} kcal</strong></span>
        </div>

        <button
          type="button"
          @click="handleClose"
          class="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
        >
          Hoàn Tất & Tiếp Tục Mua Sắm
        </button>
      </div>

      <!-- FORM VIEW -->
      <div v-else class="p-6 sm:p-8 space-y-6">
        <div>
          <h2 class="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Thông Tin Giao Hàng & Thanh Toán
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            Vui lòng điền thông tin để NutriMate chuẩn bị thực phẩm sạch giao tới bạn.
          </p>
        </div>

        <!-- Error Banner -->
        <div v-if="errorMessage" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handlePlaceOrder" class="space-y-4">
          <!-- Customer Info Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên người nhận <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                v-model="customerName"
                placeholder="VD: Nguyễn Văn A"
                required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại liên hệ <span class="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                v-model="customerPhone"
                placeholder="VD: 0912345678"
                required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Email nhận thông báo (tùy chọn)
            </label>
            <input
              type="email"
              v-model="customerEmail"
              placeholder="VD: email@example.com"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ nhận hàng chi tiết <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="customerAddress"
              rows="2"
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
            ></textarea>
          </div>

          <!-- Payment Method Options -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-2">
              Phương thức thanh toán
            </label>
            <div class="grid grid-cols-3 gap-3">
              <!-- VietQR -->
              <label
                class="flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all text-center"
                :class="paymentMethod === 'vietqr' ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              >
                <input type="radio" v-model="paymentMethod" value="vietqr" class="sr-only" />
                <QrCode class="w-5 h-5 mb-1 text-emerald-600" />
                <span class="text-xs">VietQR</span>
              </label>

              <!-- COD -->
              <label
                class="flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all text-center"
                :class="paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              >
                <input type="radio" v-model="paymentMethod" value="cod" class="sr-only" />
                <Truck class="w-5 h-5 mb-1 text-emerald-600" />
                <span class="text-xs">COD (Tiền mặt)</span>
              </label>

              <!-- MoMo -->
              <label
                class="flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all text-center"
                :class="paymentMethod === 'momo' ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              >
                <input type="radio" v-model="paymentMethod" value="momo" class="sr-only" />
                <CreditCard class="w-5 h-5 mb-1 text-rose-500" />
                <span class="text-xs">Ví MoMo</span>
              </label>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú cho bếp / Shipper (nếu có)
            </label>
            <input
              type="text"
              v-model="notes"
              placeholder="VD: Giao giờ hành chính, gọi trước khi đến..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-hidden"
            />
          </div>

          <!-- Nutrition & Price Totals -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div class="flex justify-between text-slate-600">
              <span>Năng lượng nạp vào:</span>
              <span class="font-bold text-slate-900 flex items-center gap-1">
                <Flame class="w-3.5 h-3.5 text-amber-500" /> {{ cartStore.totalCalories }} kcal
              </span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Hàm lượng Protein:</span>
              <span class="font-bold text-emerald-800 flex items-center gap-1">
                <Dumbbell class="w-3.5 h-3.5 text-emerald-600" /> {{ cartStore.totalProtein }}g
              </span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span class="font-semibold text-slate-900">{{ formatVnd(25000) }}</span>
            </div>
            <div class="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Tổng thanh toán:</span>
              <span class="text-emerald-700 text-base font-extrabold">
                {{ formatVnd(cartStore.totalAmount + 25000) }}
              </span>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            <span v-if="isSubmitting">Đang xử lý đơn hàng...</span>
            <span v-else>Xác Nhận Đặt Hàng</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
