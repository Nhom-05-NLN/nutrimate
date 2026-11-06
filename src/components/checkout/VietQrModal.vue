<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Order } from '../../types';
import { useToastStore } from '../../stores/toastStore';
import { patchOrderPaymentStatus } from '../../services/api';
import {
  X,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  order: Order | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'paymentSuccess', order: Order): void;
}>();

const router = useRouter();
const toastStore = useToastStore();

const QR_EXPIRE_SECONDS = 5 * 60; // 5 phút đếm ngược phiên QR
const isSimulating = ref(false);
const isPaidSuccess = ref(false);
const isExpired = ref(false);
const remainingSeconds = ref(QR_EXPIRE_SECONDS);
let timerInterval: ReturnType<typeof setInterval> | null = null;

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const formattedCountdown = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else {
      isExpired.value = true;
      if (timerInterval) clearInterval(timerInterval);
    }
  }, 1000);
}

function handleRefreshQr() {
  remainingSeconds.value = QR_EXPIRE_SECONDS;
  isExpired.value = false;
  startTimer();
  toastStore.show('Đã làm mới mã QR', 'info', 'Bộ đếm 5 phút đã được khởi động lại');
}

const bankInfo = {
  bankCode: 'TCB',
  bankName: 'Techcombank (Ngân hàng TMCP Kỹ Thương)',
  accountNo: '1403123456',
  accountName: 'NUTRIMATE STORE',
};

const vietQrImageUrl = computed(() => {
  if (!props.order) return '';
  const amount = Math.round(props.order.totalAmount);
  const memo = encodeURIComponent(props.order.orderCode);
  const accName = encodeURIComponent(bankInfo.accountName);
  return `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNo}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${accName}`;
});

function copyText(text: string, label: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
  toastStore.show(`Đã sao chép ${label}`, 'success', text);
}

async function handleConfirmPayment() {
  if (!props.order) return;

  isSimulating.value = true;

  try {
    const updated = await patchOrderPaymentStatus(props.order.id, 'paid', 'confirmed');
    isPaidSuccess.value = true;
    toastStore.show('Thanh toán đơn hàng thành công!', 'success', `Mã đơn: ${updated.orderCode}`);
    emit('paymentSuccess', updated);

    // Chuyển sang trang theo dõi đơn sau 1.8s
    setTimeout(() => {
      emit('close');
      router.push('/orders');
    }, 1800);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi xác thực thanh toán';
    toastStore.show(msg, 'error');
  } finally {
    isSimulating.value = false;
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      remainingSeconds.value = QR_EXPIRE_SECONDS;
      isPaidSuccess.value = false;
      isExpired.value = false;
      startTimer();
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<template>
  <div
    v-if="open && order"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    aria-label="Cổng thanh toán VietQR"
  >
    <div class="min-h-full flex items-center justify-center py-4">
      <div
        class="relative w-full max-w-lg bg-white rounded-3xl sm:rounded-4xl shadow-2xl border border-[#E3E8DC] overflow-hidden transition-all"
      >
        <!-- Close Button -->
        <button
          type="button"
          @click="emit('close')"
          class="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#7A866E] hover:text-[#242424] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
          aria-label="Đóng cửa sổ thanh toán"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- SUCCESS STATE -->
        <div v-if="isPaidSuccess" class="p-6 sm:p-8 text-center space-y-5">
          <div class="w-16 h-16 rounded-full bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center mx-auto border-2 border-[#CCD7BC] animate-bounce">
            <CheckCircle2 class="w-10 h-10 stroke-[2.5]" />
          </div>

          <div class="space-y-1.5">
            <span class="px-3 py-0.5 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34] border border-[#CCD7BC]">
              TRẠNG THÁI: ĐÃ THANH TOÁN (PAID)
            </span>
            <h3 class="font-heading text-xl sm:text-2xl font-black text-[#242424]">
              Giao Dịch Thành Công!
            </h3>
            <p class="text-xs sm:text-sm text-[#7A866E] max-w-sm mx-auto">
              NutriMate đã ghi nhận thanh toán cho đơn hàng <strong>#{{ order.orderCode }}</strong>.
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E8ECE2] max-w-xs mx-auto text-xs text-[#576449] space-y-1">
            <div class="flex justify-between">
              <span>Mã đơn hàng:</span>
              <strong class="text-[#242424]">#{{ order.orderCode }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Số tiền thanh toán:</span>
              <strong class="text-[#4D6A34]">{{ formatVnd(order.totalAmount) }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Phương thức:</span>
              <strong class="text-[#242424]">VietQR Napas 24/7</strong>
            </div>
          </div>

          <p class="text-xs text-[#7A866E] animate-pulse">
            Đang chuyển hướng sang trang quản lý đơn hàng...
          </p>
        </div>

        <!-- EXPIRED STATE (Timeout 5 phút) -->
        <div v-else-if="isExpired" class="p-6 sm:p-8 text-center space-y-5">
          <div class="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200">
            <Clock class="w-8 h-8 stroke-[2]" />
          </div>

          <div class="space-y-1.5">
            <span class="px-3 py-0.5 rounded-full bg-amber-100 text-xs font-bold text-amber-800 border border-amber-300">
              HẾT HẠN PHIÊN QUÉT MÃ QR (5 PHÚT)
            </span>
            <h3 class="font-heading text-xl sm:text-2xl font-black text-[#242424]">
              Phiên Mã QR Đã Hết Hiệu Lực
            </h3>
            <p class="text-xs sm:text-sm text-[#7A866E] max-w-sm mx-auto">
              Đơn hàng <strong>#{{ order.orderCode }}</strong> vẫn được lưu giữ trong <strong>30 phút</strong> để bạn hoàn tất thanh toán.
            </p>
          </div>

          <div class="space-y-2.5 max-w-xs mx-auto pt-1">
            <button
              type="button"
              @click="handleRefreshQr"
              class="w-full py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              <RefreshCw class="w-4 h-4" />
              <span>Làm mới mã QR</span>
            </button>

            <button
              type="button"
              @click="emit('close'); router.push('/orders')"
              class="w-full py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#E8ECE2] border border-[#CCD7BC] text-xs font-bold text-[#576449] transition-colors cursor-pointer min-h-[38px]"
            >
              Thanh toán sau & Xem đơn hàng
            </button>
          </div>
        </div>

        <!-- MAIN PAYMENT VIEW -->
        <div v-else class="p-5 sm:p-6 space-y-4">
          <!-- Header -->
          <div class="space-y-1 border-b border-[#F0F3EC] pb-3 pr-12">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-[#4D6A34] text-white text-xs font-bold tracking-wide uppercase">
                VietQR Napas 24/7
              </span>
              <span class="text-xs font-semibold text-[#7A866E] flex items-center gap-1">
                <Clock class="w-3.5 h-3.5 text-amber-500" /> Hết hạn sau: <span class="font-mono text-[#242424] font-bold">{{ formattedCountdown }}</span>
              </span>
            </div>

            <h3 class="font-heading text-xl sm:text-2xl font-black text-[#242424]">
              Quét Mã VietQR Chuyển Khoản
            </h3>
          </div>

          <!-- QR Display & Bank details (2 Cột trên màn to) -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <!-- Cột QR Code -->
            <div class="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-[#FAF9F5] rounded-2xl border border-[#CCD7BC]">
              <div class="relative w-40 h-40 bg-white rounded-xl border-2 border-[#4D6A34] p-1.5 shadow-2xs overflow-hidden flex items-center justify-center">
                <img
                  :src="vietQrImageUrl"
                  :alt="`VietQR ${order.orderCode}`"
                  class="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <span class="text-[11px] font-bold text-[#4D6A34] mt-1.5">
                Chuẩn Napas 24/7
              </span>
            </div>

            <!-- Cột Thông tin chuyển khoản chi tiết -->
            <div class="sm:col-span-7 space-y-2.5 text-xs sm:text-sm">
              <!-- Người nhận & Tài khoản ngân hàng -->
              <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F6F8F3] border border-[#DEE5D4]">
                <div class="min-w-0 flex-1">
                  <span class="text-[11px] text-[#7A866E] block">Người nhận:</span>
                  <span class="font-bold text-xs sm:text-sm text-[#242424] block">
                    {{ bankInfo.accountName }}
                  </span>
                  <span class="text-[11px] text-[#576449] font-medium block">
                    {{ bankInfo.bankCode }}: <span class="font-mono font-bold text-[#242424]">{{ bankInfo.accountNo }}</span>
                  </span>
                </div>
                <button
                  type="button"
                  @click="copyText(bankInfo.accountNo, 'Số tài khoản')"
                  class="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#EBF7E5] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                  title="Sao chép STK"
                >
                  <Copy class="w-3.5 h-3.5" />
                  <span>Chép STK</span>
                </button>
              </div>

              <!-- Số tiền với nút Copy -->
              <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-[#CCD7BC]">
                <div class="min-w-0 flex-1">
                  <span class="text-[11px] text-[#7A866E] block">Số tiền:</span>
                  <span class="font-heading text-base sm:text-lg font-black text-[#4D6A34] block truncate">
                    {{ formatVnd(order.totalAmount) }}
                  </span>
                </div>
                <button
                  type="button"
                  @click="copyText(String(Math.round(order.totalAmount)), 'Số tiền')"
                  class="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#EBF7E5] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                  title="Sao chép số tiền"
                >
                  <Copy class="w-3.5 h-3.5" />
                  <span>Chép tiền</span>
                </button>
              </div>

              <!-- Nội dung CK với nút Copy (Bắt buộc) -->
              <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#EBF7E5] border border-[#CCD7BC]">
                <div class="min-w-0 flex-1">
                  <span class="text-[11px] text-[#4D6A34] font-bold block truncate">Nội dung chuyển khoản:</span>
                  <span class="font-mono text-sm sm:text-base font-black text-[#242424] block truncate">{{ order.orderCode }}</span>
                </div>
                <button
                  type="button"
                  @click="copyText(order.orderCode, 'Nội dung chuyển khoản')"
                  class="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#4D6A34] text-white hover:bg-[#3B4E24] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                  title="Sao chép nội dung chuyển khoản"
                >
                  <Copy class="w-3.5 h-3.5" />
                  <span>Chép mã</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2 pt-1">
            <button
              type="button"
              @click="handleConfirmPayment"
              :disabled="isSimulating"
              class="w-full py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[46px] cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 class="w-5 h-5" />
              <span v-if="isSimulating">Đang đồng bộ giao dịch Napas...</span>
              <span v-else>Xác nhận đã chuyển khoản (Mô phỏng)</span>
            </button>

            <button
              type="button"
              @click="emit('close'); router.push('/orders')"
              class="w-full py-1.5 text-center text-xs font-semibold text-[#7A866E] hover:text-[#242424] transition-colors cursor-pointer"
            >
              Thanh toán sau & Xem đơn hàng của tôi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
