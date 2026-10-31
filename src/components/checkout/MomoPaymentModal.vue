<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Order } from '../../types';
import { useToastStore } from '../../stores/toastStore';
import { patchOrderPaymentStatus } from '../../services/api';
import {
  X,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Sparkles,
  Building2,
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
const remainingSeconds = ref(15 * 60);
let timerInterval: ReturnType<typeof setInterval> | null = null;

// Tab chuyển đổi loại mã QR (Mặc định dùng MoMo P2P vào thẳng mục Ví điện tử)
const selectedQrMode = ref<'p2p_momo' | 'link_momo' | 'napas_momo'>('p2p_momo');

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const formattedCountdown = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const momoMerchant = {
  accountName: 'Trần Tường Vy',
  accountPhone: '0333 636 045',
  rawPhone: '0333636045',
  bankBin: '971025', // BIN Napas chính thức của Ví MoMo (CTCP Dịch Vụ Di Động Trực Tuyến)
  momoPageUrl: 'https://nhantien.momo.vn/0333636045',
};

// 1. Mã QR MoMo Nội Bộ (P2P vào thẳng mục Ví Điện Tử MoMo, tự động điền SĐT & Tiền 100%)
const momoP2pQrUrl = computed(() => {
  if (!props.order) return '';
  const amount = Math.round(props.order.totalAmount);
  const memo = props.order.orderCode;
  const data = `2|99|${momoMerchant.rawPhone}|${momoMerchant.accountName}||0|0|${amount}|${memo}|transfer_myqr`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(data)}`;
});

// 2. Mã QR Link nhận tiền MoMo chính thức (Quét bằng camera hoặc MoMo mở thẳng trang Ví của Trần Tường Vy)
const momoLinkQrUrl = computed(() => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(momoMerchant.momoPageUrl)}`;
});

// 3. Mã QR Napas MoMo (Mã liên thông VietQR - Dành cho khách dùng App Ngân Hàng để quét)
const momoNapasQrUrl = computed(() => {
  if (!props.order) return '';
  const amount = Math.round(props.order.totalAmount);
  const memo = encodeURIComponent(props.order.orderCode);
  const accName = encodeURIComponent(momoMerchant.accountName);
  return `https://img.vietqr.io/image/${momoMerchant.bankBin}-${momoMerchant.rawPhone}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${accName}`;
});

const currentQrUrl = computed(() => {
  if (selectedQrMode.value === 'p2p_momo') return momoP2pQrUrl.value;
  if (selectedQrMode.value === 'link_momo') return momoLinkQrUrl.value;
  return momoNapasQrUrl.value;
});

// Deeplink mở ứng dụng MoMo trực tiếp vào mục Ví Điện Tử P2P trên điện thoại
const momoDeeplink = computed(() => {
  if (!props.order) return '#';
  const amount = Math.round(props.order.totalAmount);
  const memo = props.order.orderCode;

  const dataExtract = JSON.stringify({
    userId: momoMerchant.rawPhone,
    name: momoMerchant.accountName,
    amount: amount,
    message: memo,
    receiverType: '1', // 1: Ví Điện Tử MoMo
    transferSource: 'link',
  });

  try {
    const b64 = btoa(unescape(encodeURIComponent(dataExtract)));
    return `momo://app?action=p2p&extra=${encodeURIComponent(JSON.stringify({ dataExtract: b64 }))}`;
  } catch {
    return `momo://?action=transfer&receiver=${momoMerchant.rawPhone}&amount=${amount}&comment=${encodeURIComponent(memo)}`;
  }
});

function copyText(text: string, label: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
  toastStore.show(`Đã sao chép ${label}`, 'success', text);
}

function openMomoApp() {
  if (props.order) {
    window.location.href = momoDeeplink.value;
    setTimeout(() => {
      window.open(momoMerchant.momoPageUrl, '_blank');
    }, 1200);
  }
}

async function handleConfirmPayment() {
  if (!props.order) return;

  isSimulating.value = true;

  try {
    const updated = await patchOrderPaymentStatus(props.order.id, 'paid', 'confirmed');
    isPaidSuccess.value = true;
    toastStore.show('Thanh toán qua Ví MoMo thành công!', 'success', `Mã đơn: ${updated.orderCode}`);
    emit('paymentSuccess', updated);

    setTimeout(() => {
      emit('close');
      router.push('/orders');
    }, 1800);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi xác thực thanh toán MoMo';
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
    aria-label="Cổng thanh toán Ví MoMo"
  >
    <div
      class="relative w-full max-w-xl bg-white rounded-4xl shadow-2xl border border-pink-100 overflow-hidden my-6 transition-all"
    >
      <!-- Close Button -->
      <button
        type="button"
        @click="emit('close')"
        class="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-700 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
        aria-label="Đóng cửa sổ thanh toán"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- SUCCESS STATE -->
      <div v-if="isPaidSuccess" class="p-8 sm:p-12 text-center space-y-6">
        <div class="w-20 h-20 rounded-full bg-pink-50 text-[#D82D8B] flex items-center justify-center mx-auto border-2 border-pink-200 animate-bounce">
          <CheckCircle2 class="w-12 h-12 stroke-[2.5]" />
        </div>

        <div class="space-y-2">
          <span class="px-3.5 py-1 rounded-full bg-pink-100 text-xs font-bold text-[#A50064] border border-pink-200">
            TRẠNG THÁI: ĐÃ THANH TOÁN QUA VÍ MOMO
          </span>
          <h3 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
            Giao Dịch Ví MoMo Thành Công!
          </h3>
          <p class="text-sm text-[#7A866E] max-w-sm mx-auto">
            NutriMate đã nhận thanh toán thành công cho đơn hàng <strong>#{{ order.orderCode }}</strong>. Đơn hàng đang được điều phối sang bộ phận chế biến.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-pink-50/60 border border-pink-100 max-w-xs mx-auto text-xs text-[#576449] space-y-1">
          <div class="flex justify-between">
            <span>Mã đơn hàng:</span>
            <strong class="text-[#242424]">#{{ order.orderCode }}</strong>
          </div>
          <div class="flex justify-between">
            <span>Số tiền thanh toán:</span>
            <strong class="text-[#D82D8B]">{{ formatVnd(order.totalAmount) }}</strong>
          </div>
          <div class="flex justify-between">
            <span>Cổng thanh toán:</span>
            <strong class="text-[#242424]">Ví Điện Tử MoMo E-Wallet</strong>
          </div>
        </div>

        <p class="text-xs text-[#7A866E] animate-pulse">
          Đang chuyển hướng sang trang quản lý đơn hàng...
        </p>
      </div>

      <!-- MAIN PAYMENT VIEW -->
      <div v-else class="p-6 sm:p-8 space-y-6">
        <!-- Header MoMo -->
        <div class="space-y-2 border-b border-pink-100 pb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="px-3 py-1 rounded-full bg-[#D82D8B] text-white text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                Ví MoMo Pay
              </span>
              <span class="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                Tự Động Điền Tiền
              </span>
            </div>

            <span class="text-xs font-bold text-[#7A866E] flex items-center gap-1">
              <Clock class="w-3.5 h-3.5 text-amber-500" /> Còn lại: <span class="font-mono text-[#D82D8B] font-bold">{{ formattedCountdown }}</span>
            </span>
          </div>

          <h3 class="font-heading text-xl sm:text-2xl font-black text-[#242424]">
            Chuyển Tiền Ví Điện Tử MoMo
          </h3>
          <p class="text-xs text-[#7A866E]">
            Mở App MoMo, bấm chọn <strong>"Quét Mã"</strong> để chuyển tiền trực tiếp trong mục <strong>Ví MoMo</strong> (Ví-đến-Ví). Hệ thống sẽ tự động điền sẵn SĐT và Số tiền cho bạn.
          </p>

          <!-- Toggle Chế Độ Quét QR -->
          <div class="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              @click="selectedQrMode = 'p2p_momo'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              :class="selectedQrMode === 'p2p_momo' ? 'bg-[#D82D8B] text-white shadow-2xs' : 'bg-pink-50 text-[#A50064] hover:bg-pink-100'"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>⚡ Ví MoMo P2P (Tự điền tiền)</span>
            </button>
            <button
              type="button"
              @click="selectedQrMode = 'link_momo'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              :class="selectedQrMode === 'link_momo' ? 'bg-[#D82D8B] text-white shadow-2xs' : 'bg-pink-50 text-[#A50064] hover:bg-pink-100'"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>🔗 Trang Nhận Tiền MoMo</span>
            </button>
            <button
              type="button"
              @click="selectedQrMode = 'napas_momo'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              :class="selectedQrMode === 'napas_momo' ? 'bg-[#D82D8B] text-white shadow-2xs' : 'bg-pink-50 text-[#A50064] hover:bg-pink-100'"
            >
              <Building2 class="w-3.5 h-3.5" />
              <span>🏦 Quét Bằng App Ngân Hàng</span>
            </button>
          </div>
        </div>

        <!-- 2 Cột: QR Code & Thông tin ví nhận -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <!-- Cột QR MoMo -->
          <div class="sm:col-span-5 flex flex-col items-center justify-center p-3.5 bg-linear-to-b from-pink-50/80 to-[#FAF9F5] rounded-3xl border border-pink-200 shadow-2xs">
            <div class="relative w-44 h-44 bg-white rounded-2xl border-2 border-[#D82D8B] p-2 shadow-xs overflow-hidden flex items-center justify-center">
              <img
                :src="currentQrUrl"
                :alt="`MoMo QR ${order.orderCode}`"
                class="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            <span class="text-[11px] font-bold text-[#A50064] mt-2 flex items-center gap-1 text-center">
              <ShieldCheck class="w-3.5 h-3.5 text-[#D82D8B] shrink-0" />
              <span v-if="selectedQrMode === 'p2p_momo'">Mã chuyển tiền Ví-đến-Ví (Vào thẳng mục Ví MoMo)</span>
              <span v-else-if="selectedQrMode === 'link_momo'">Link nhận tiền chính thức của Ví MoMo</span>
              <span v-else>Mã VietQR Napas (Dùng khi quét bằng App Ngân Hàng)</span>
            </span>
          </div>

          <!-- Cột Thông tin chi tiết thanh toán -->
          <div class="sm:col-span-7 space-y-2.5 text-xs sm:text-sm">
            <div class="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">
              <div class="text-[11px] text-[#7A866E]">Chủ ví MoMo nhận tiền:</div>
              <div class="font-bold text-[#242424] truncate mt-0.5 flex items-center justify-between">
                <span>{{ momoMerchant.accountName }}</span>
                <span class="text-[11px] font-semibold text-[#D82D8B] bg-pink-100/80 px-2 py-0.5 rounded-md">Đã xác thực MoMo</span>
              </div>
            </div>

            <!-- SĐT MoMo với nút Copy -->
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-pink-200">
              <div>
                <span class="text-[11px] text-[#7A866E] block">Số điện thoại MoMo:</span>
                <span class="font-mono text-sm sm:text-base font-black text-[#D82D8B]">{{ momoMerchant.accountPhone }}</span>
              </div>
              <button
                type="button"
                @click="copyText(momoMerchant.rawPhone, 'Số MoMo')"
                class="px-2.5 py-1.5 rounded-lg bg-pink-100 hover:bg-[#D82D8B] text-[#A50064] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép số MoMo"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép SĐT</span>
              </button>
            </div>

            <!-- Số tiền cần thanh toán -->
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-pink-200">
              <div>
                <span class="text-[11px] text-[#7A866E] block">Số tiền thanh toán:</span>
                <span class="font-heading text-base sm:text-lg font-black text-[#D82D8B]">
                  {{ formatVnd(order.totalAmount) }}
                </span>
              </div>
              <button
                type="button"
                @click="copyText(String(Math.round(order.totalAmount)), 'Số tiền')"
                class="px-2.5 py-1.5 rounded-lg bg-pink-100 hover:bg-[#D82D8B] text-[#A50064] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép số tiền"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép tiền</span>
              </button>
            </div>

            <!-- Nội dung lời nhắn chuyển MoMo (Bắt buộc) -->
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-pink-50 border border-pink-300">
              <div>
                <span class="text-[11px] text-[#A50064] font-bold block">Lời nhắn / Nội dung MoMo:</span>
                <span class="font-mono text-sm sm:text-base font-black text-[#242424]">{{ order.orderCode }}</span>
              </div>
              <button
                type="button"
                @click="copyText(order.orderCode, 'Nội dung MoMo')"
                class="px-3 py-1.5 rounded-lg bg-[#D82D8B] text-white hover:bg-[#A50064] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép mã đơn hàng"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép mã</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Hướng dẫn & Nút Deeplink mở App trên Mobile -->
        <div class="p-3 bg-[#FAF9F5] rounded-2xl border border-[#E8ECE2] text-xs text-[#576449] space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-bold text-[#242424] flex items-center gap-1.5 text-[11px]">
              <Smartphone class="w-3.5 h-3.5 text-[#D82D8B]" /> Đang dùng điện thoại?
            </span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="openMomoApp"
                class="px-3 py-1 rounded-xl bg-[#D82D8B] hover:bg-[#A50064] text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ExternalLink class="w-3 h-3" />
                <span>Mở App MoMo</span>
              </button>
              <a
                :href="momoMerchant.momoPageUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="px-2.5 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#A50064] font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <span>Trang MoMo</span>
              </a>
            </div>
          </div>
          <p class="text-[11px] text-[#7A866E] leading-relaxed">
            💡 Mở App MoMo hoặc bất kỳ ứng dụng Ngân hàng nào, quét mã QR để chuyển tiền. Hệ thống tự động nạp SĐT <strong>{{ momoMerchant.accountPhone }}</strong> ({{ momoMerchant.accountName }}) cùng số tiền <strong>{{ formatVnd(order.totalAmount) }}</strong>.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-2.5 pt-2">
          <!-- Nút Mô Phỏng Thanh Toán MoMo Thành Công -->
          <button
            type="button"
            @click="handleConfirmPayment"
            :disabled="isSimulating"
            class="w-full py-4 rounded-2xl bg-[#D82D8B] hover:bg-[#A50064] active:bg-[#80004D] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 class="w-5 h-5" />
            <span v-if="isSimulating">Đang đồng bộ giao dịch MoMo...</span>
            <span v-else>Xác nhận đã thanh toán qua MoMo (Mô phỏng)</span>
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
