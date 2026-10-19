<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Order } from '../../types';
import { useToastStore } from '../../stores/toastStore';
import { patchOrderPaymentStatus } from '../../services/api';
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  UserCheck,
  CreditCard,
  ExternalLink,
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

const isSimulating = ref(false);
const isPaidSuccess = ref(false);
const remainingSeconds = ref(15 * 60); // 15 phút đếm ngược
let timerInterval: ReturnType<typeof setInterval> | null = null;

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const formattedCountdown = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const bankInfo = {
  bankCode: 'TCB',
  bankName: 'Techcombank (Ngân hàng TMCP Kỹ Thương)',
  accountNo: '19038899762018',
  accountName: 'CONG TY NUTRIMATE VN',
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
      remainingSeconds.value = 15 * 60;
      isPaidSuccess.value = false;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (remainingSeconds.value > 0) {
          remainingSeconds.value--;
        } else if (timerInterval) {
          clearInterval(timerInterval);
        }
      }, 1000);
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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    aria-label="Cổng thanh toán VietQR"
  >
    <div
      class="relative w-full max-w-xl bg-white rounded-4xl shadow-2xl border border-[#E3E8DC] overflow-hidden my-6 transition-all"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click="emit('close')"
        class="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#7A866E] hover:text-[#242424] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
        aria-label="Đóng cửa sổ thanh toán"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- SUCCESS STATE -->
      <div v-if="isPaidSuccess" class="p-8 sm:p-12 text-center space-y-6">
        <div class="w-20 h-20 rounded-full bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center mx-auto border-2 border-[#CCD7BC] animate-bounce">
          <CheckCircle2 class="w-12 h-12 stroke-[2.5]" />
        </div>

        <div class="space-y-2">
          <span class="px-3.5 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34] border border-[#CCD7BC]">
            TRẠNG THÁI: ĐÃ THANH TOÁN (PAID)
          </span>
          <h3 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
            Giao Dịch Thành Công!
          </h3>
          <p class="text-sm text-[#7A866E] max-w-sm mx-auto">
            NutriMate đã ghi nhận thanh toán cho đơn hàng <strong>#{{ order.orderCode }}</strong>. Đơn hàng đang được chuyển sang bộ phận bếp đóng gói.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8ECE2] max-w-xs mx-auto text-xs text-[#576449] space-y-1">
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

      <!-- MAIN PAYMENT VIEW -->
      <div v-else class="p-6 sm:p-8 space-y-6">
        <!-- Header -->
        <div class="space-y-1.5 border-b border-[#F0F3EC] pb-4">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-[#4D6A34] text-white text-xs font-black tracking-wide uppercase">
              VietQR Napas 24/7
            </span>
            <span class="text-xs font-bold text-[#7A866E] flex items-center gap-1">
              <Clock class="w-3.5 h-3.5 text-amber-500" /> Hết hạn sau: <span class="font-mono text-[#242424] font-bold">{{ formattedCountdown }}</span>
            </span>
          </div>

          <h3 class="font-heading text-xl sm:text-2xl font-black text-[#242424]">
            Quét Mã QR Chuyển Khoản Tức Thì
          </h3>
          <p class="text-xs text-[#7A866E]">
            Mở app ngân hàng bất kỳ (Vietcombank, MB, Techcombank, VPBank,...) hoặc Ví MoMo để quét mã.
          </p>
        </div>

        <!-- QR Display & Bank details (2 Cột trên màn to) -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <!-- Cột QR Code -->
          <div class="sm:col-span-5 flex flex-col items-center justify-center p-3.5 bg-[#FAF9F5] rounded-3xl border border-[#CCD7BC] shadow-2xs">
            <div class="relative w-44 h-44 bg-white rounded-2xl border-2 border-[#4D6A34] p-1.5 shadow-xs overflow-hidden flex items-center justify-center">
              <img
                :src="vietQrImageUrl"
                :alt="`VietQR ${order.orderCode}`"
                class="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            <span class="text-[11px] font-bold text-[#4D6A34] mt-2 flex items-center gap-1">
              <ShieldCheck class="w-3.5 h-3.5" /> Chuẩn Napas 24/7 tự động
            </span>
          </div>

          <!-- Cột Thông tin chuyển khoản chi tiết -->
          <div class="sm:col-span-7 space-y-3 text-xs sm:text-sm">
            <div class="p-2.5 rounded-xl bg-[#F6F8F3] border border-[#DEE5D4]">
              <div class="text-[11px] text-[#7A866E]">Ngân hàng nhận:</div>
              <div class="font-bold text-[#242424] flex items-center gap-1.5 mt-0.5">
                <Building2 class="w-4 h-4 text-[#4D6A34] shrink-0" />
                <span>{{ bankInfo.bankName }}</span>
              </div>
            </div>

            <div class="p-2.5 rounded-xl bg-[#F6F8F3] border border-[#DEE5D4]">
              <div class="text-[11px] text-[#7A866E]">Chủ tài khoản:</div>
              <div class="font-bold text-[#242424] flex items-center gap-1.5 mt-0.5">
                <UserCheck class="w-4 h-4 text-[#4D6A34] shrink-0" />
                <span>{{ bankInfo.accountName }}</span>
              </div>
            </div>

            <!-- STK với nút Copy -->
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#CCD7BC]">
              <div>
                <span class="text-[11px] text-[#7A866E] block">Số tài khoản:</span>
                <span class="font-mono text-sm sm:text-base font-black text-[#242424]">1903 8899 7620 18</span>
              </div>
              <button
                type="button"
                @click="copyText(bankInfo.accountNo, 'Số tài khoản')"
                class="px-2.5 py-1.5 rounded-lg bg-[#EBF7E5] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép STK"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép STK</span>
              </button>
            </div>

            <!-- Số tiền với nút Copy -->
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#CCD7BC]">
              <div>
                <span class="text-[11px] text-[#7A866E] block">Số tiền chính xác:</span>
                <span class="font-heading text-base sm:text-lg font-black text-[#4D6A34]">
                  {{ formatVnd(order.totalAmount) }}
                </span>
              </div>
              <button
                type="button"
                @click="copyText(String(Math.round(order.totalAmount)), 'Số tiền')"
                class="px-2.5 py-1.5 rounded-lg bg-[#EBF7E5] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép số tiền"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép tiền</span>
              </button>
            </div>

            <!-- Nội dung CK với nút Copy (Bắt buộc) -->
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#EBF7E5] border border-[#CCD7BC]">
              <div>
                <span class="text-[11px] text-[#4D6A34] font-bold block">Nội dung chuyển khoản (bắt buộc):</span>
                <span class="font-mono text-sm sm:text-base font-black text-[#242424]">{{ order.orderCode }}</span>
              </div>
              <button
                type="button"
                @click="copyText(order.orderCode, 'Nội dung chuyển khoản')"
                class="px-3 py-1.5 rounded-lg bg-[#4D6A34] text-white hover:bg-[#3B4E24] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép nội dung chuyển khoản"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép mã</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Warning Callout -->
        <p class="text-[11px] text-[#7A866E] text-center leading-relaxed bg-[#FAF9F5] p-3 rounded-2xl border border-[#E8ECE2]">
          💡 <em>Vui lòng giữ nguyên nội dung chuyển khoản <strong>{{ order.orderCode }}</strong> để hệ thống tự động xác nhận đơn trong 30 giây.</em>
        </p>

        <!-- Action Buttons -->
        <div class="space-y-2.5 pt-2">
          <!-- Nút Mô Phỏng Thanh Toán Chuyển Trạng Thái Paid (CN_21) -->
          <button
            type="button"
            @click="handleConfirmPayment"
            :disabled="isSimulating"
            class="w-full py-4 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 class="w-5 h-5" />
            <span v-if="isSimulating">Đang đồng bộ giao dịch Napas...</span>
            <span v-else>Xác nhận đã chuyển khoản thành công (Mô phỏng)</span>
          </button>

          <button
            type="button"
            @click="emit('close'); router.push('/orders')"
            class="w-full py-2.5 text-center text-xs font-semibold text-[#7A866E] hover:text-[#242424] transition-colors cursor-pointer"
          >
            Thanh toán sau & Xem đơn hàng của tôi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
