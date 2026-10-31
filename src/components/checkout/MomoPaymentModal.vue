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

const QR_EXPIRE_SECONDS = 5 * 60; // 5 phút đếm ngược
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
  toastStore.show('Đã làm mới mã QR MoMo', 'info', 'Bộ đếm 5 phút đã được khởi động lại');
}

// Thông tin tài khoản MoMo chính thức từ mã QR của TRAN TUONG VY
const momoMerchant = {
  accountName: 'TRAN TUONG VY', // Token định danh tài khoản MoMo trong payload QR
  displayName: 'CONG TY NUTRIMATE VN', // Tên hiển thị thương hiệu trên giao diện NutriMate
  accountNo: 'PSP2630419900000115',
  maskedAccountNo: '*******115',
  accountPhone: '0333 636 045',
  rawPhone: '0333636045',
  bankBin: '971025', // BIN Napas chính thức của Ví MoMo (CTCP Dịch Vụ Di Động Trực Tuyến)
  bankName: 'Ví MoMo (CTCP Dịch Vụ Di Động Trực Tuyến)',
};

/**
 * Thuật toán tính CRC16-CCITT theo chuẩn EMVCo QR Code
 */
function crc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    crc = ((crc >> 8) | ((crc & 0xff) << 8)) & 0xffff;
    crc ^= c;
    crc ^= (crc & 0xff) >> 4;
    crc = (crc ^ ((crc << 12) & 0xffff)) & 0xffff;
    crc = (crc ^ (((crc & 0xff) << 5) & 0xffff)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Xây dựng chuỗi QR MoMo Napas Đa Năng chuẩn EMVCo
 * Kế thừa 100% token định danh MoMo từ mã QR gốc của TRAN TUONG VY (PSP2630419900000115)
 * Tự động nạp số tiền đơn hàng (Field 54) và nội dung chuyển khoản (Field 62.08)
 */
function buildMomoDynamicPayload(amount: number, memo: string): string {
  const amountStr = Math.round(amount).toString();
  const f54 = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;

  const cleanMemo = memo.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20);
  const sub08 = cleanMemo ? `08${cleanMemo.length.toString().padStart(2, '0')}${cleanMemo}` : '';

  // 05: Reference MOMOW2W93359780, 06: Customer ID ZumMw5Gi3-K9he4Tgtr9YA từ mã MoMo chính chủ
  const f62Content = `0515MOMOW2W933597800622ZumMw5Gi3-K9he4Tgtr9YA${sub08}`;
  const f62 = `62${f62Content.length.toString().padStart(2, '0')}${f62Content}`;

  // Header EMVCo (BIN 971025, Số tài khoản PSP2630419900000115)
  const header = '00020101021238630010A000000727013300069710250119PSP26304199000001150208QRIBFTTA5303704';
  const payloadWithoutCrc = `${header}${f54}5802VN${f62}6304`;
  const checksum = crc16Ccitt(payloadWithoutCrc);
  return `${payloadWithoutCrc}${checksum}`;
}

// Mã QR MoMo Đa Năng tự động điền tiền và lời nhắn chính xác 100%
const momoDynamicQrUrl = computed(() => {
  if (!props.order) return '';
  const payload = buildMomoDynamicPayload(props.order.totalAmount, props.order.orderCode);
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(payload)}`;
});

// Deeplink mở ứng dụng MoMo trực tiếp trên điện thoại
const momoDeeplink = computed(() => {
  if (!props.order) return '#';
  const amount = Math.round(props.order.totalAmount);
  const memo = props.order.orderCode;

  const dataExtract = JSON.stringify({
    userId: momoMerchant.rawPhone,
    name: momoMerchant.accountName,
    amount: amount,
    message: memo,
    receiverType: '1',
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
            <strong class="text-[#242424]">Ví MoMo ({{ momoMerchant.displayName }})</strong>
          </div>
        </div>

        <p class="text-xs text-[#7A866E] animate-pulse">
          Đang chuyển hướng sang trang quản lý đơn hàng...
        </p>
      </div>

      <!-- EXPIRED STATE (Timeout 5 phút) -->
      <div v-else-if="isExpired" class="p-8 sm:p-12 text-center space-y-6">
        <div class="w-20 h-20 rounded-full bg-pink-50 text-[#D82D8B] flex items-center justify-center mx-auto border-2 border-pink-200">
          <Clock class="w-10 h-10 stroke-[2]" />
        </div>

        <div class="space-y-2">
          <span class="px-3.5 py-1 rounded-full bg-pink-100 text-xs font-bold text-[#A50064] border border-pink-200">
            HẾT HẠN PHIÊN QUÉT MÃ MOMO (5 PHÚT)
          </span>
          <h3 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
            Phiên Mã MoMo Đã Hết Hiệu Lực
          </h3>
          <p class="text-sm text-[#7A866E] max-w-sm mx-auto">
            Mã QR MoMo đã hết hạn phiên này để bảo mật giao dịch. Đơn hàng <strong>#{{ order.orderCode }}</strong> vẫn được lưu giữ trong <strong>30 phút</strong> để bạn thanh toán.
          </p>
        </div>

        <div class="space-y-3 max-w-xs mx-auto pt-2">
          <button
            type="button"
            @click="handleRefreshQr"
            class="w-full py-3.5 rounded-2xl bg-[#D82D8B] hover:bg-[#A50064] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <RefreshCw class="w-4 h-4" />
            <span>Làm mới mã MoMo (Thanh toán tiếp)</span>
          </button>

          <button
            type="button"
            @click="emit('close'); router.push('/orders')"
            class="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-xs font-bold text-pink-700 transition-colors cursor-pointer min-h-[40px]"
          >
            Thanh toán sau & Xem đơn hàng
          </button>
        </div>
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
              <span class="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 flex items-center gap-1">
                <Sparkles class="w-3.5 h-3.5 text-[#D82D8B]" />
                Đã Tự Điền Tiền
              </span>
            </div>

            <span class="text-xs font-bold text-[#7A866E] flex items-center gap-1">
              <Clock class="w-3.5 h-3.5 text-amber-500" /> Còn lại: <span class="font-mono text-[#D82D8B] font-bold">{{ formattedCountdown }}</span>
            </span>
          </div>

          <h3 class="font-heading text-xl sm:text-2xl font-black text-[#242424]">
            Quét Mã QR Chuyển Tiền MoMo
          </h3>
          <p class="text-xs text-[#7A866E]">
            Mở App <strong>MoMo</strong> (hoặc bất kỳ App Ngân Hàng nào), chọn <strong>"Quét Mã"</strong> vào hình bên dưới. Hệ thống sẽ <strong>tự động điền đúng số tiền và nội dung đơn hàng</strong>.
          </p>
        </div>

        <!-- 2 Cột: QR Code & Thông tin ví nhận -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <!-- Cột QR MoMo chính thức -->
          <div class="sm:col-span-5 flex flex-col items-center justify-center p-3.5 bg-linear-to-b from-pink-50/90 to-[#FAF9F5] rounded-3xl border border-pink-200 shadow-2xs">
            <div class="relative w-48 h-48 bg-white rounded-2xl border-2 border-[#D82D8B] p-2 shadow-xs overflow-hidden flex items-center justify-center">
              <img
                :src="momoDynamicQrUrl"
                :alt="`MoMo QR ${order.orderCode}`"
                class="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            <div class="mt-2 text-center space-y-0.5">
              <span class="text-xs font-black text-[#242424] block">
                {{ momoMerchant.displayName }}
              </span>
              <span class="text-[11px] font-bold text-[#A50064] flex items-center justify-center gap-1">
                <ShieldCheck class="w-3.5 h-3.5 text-[#D82D8B] shrink-0" />
                <span>Mã QR MoMo Napas 247</span>
              </span>
            </div>
          </div>

          <!-- Cột Thông tin chi tiết thanh toán -->
          <div class="sm:col-span-7 space-y-2.5 text-xs sm:text-sm">
            <!-- Đơn vị thụ hưởng -->
            <div class="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">
              <div class="text-[11px] text-[#7A866E]">Chủ ví MoMo nhận tiền:</div>
              <div class="font-bold text-[#242424] truncate mt-0.5 flex items-center justify-between gap-2">
                <span class="font-black text-[#242424] truncate">{{ momoMerchant.displayName }}</span>
                <span class="shrink-0 text-[11px] font-semibold text-[#D82D8B] bg-pink-100/80 px-2 py-0.5 rounded-md">Ví Chính Chủ</span>
              </div>
            </div>

            <!-- Số tài khoản MoMo (PSP... / đuôi 115) -->
            <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-pink-200">
              <div class="min-w-0 flex-1">
                <span class="text-[11px] text-[#7A866E] block truncate">Mã TK Ví MoMo (Napas 247):</span>
                <span class="font-mono text-xs sm:text-sm font-black text-[#242424] block truncate" :title="momoMerchant.accountNo">
                  {{ momoMerchant.accountNo }}
                </span>
              </div>
              <button
                type="button"
                @click="copyText(momoMerchant.accountNo, 'Mã tài khoản MoMo')"
                class="shrink-0 px-2.5 py-1.5 rounded-lg bg-pink-100 hover:bg-[#D82D8B] text-[#A50064] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép mã tài khoản MoMo"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép STK</span>
              </button>
            </div>

            <!-- SĐT MoMo với nút Copy -->
            <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-pink-200">
              <div class="min-w-0 flex-1">
                <span class="text-[11px] text-[#7A866E] block">Số điện thoại MoMo:</span>
                <span class="font-mono text-sm sm:text-base font-black text-[#D82D8B] block truncate">{{ momoMerchant.accountPhone }}</span>
              </div>
              <button
                type="button"
                @click="copyText(momoMerchant.rawPhone, 'Số điện thoại MoMo')"
                class="shrink-0 px-2.5 py-1.5 rounded-lg bg-pink-100 hover:bg-[#D82D8B] text-[#A50064] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép số MoMo"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép SĐT</span>
              </button>
            </div>

            <!-- Số tiền cần thanh toán -->
            <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-pink-200">
              <div class="min-w-0 flex-1">
                <span class="text-[11px] text-[#7A866E] block">Số tiền thanh toán:</span>
                <span class="font-heading text-base sm:text-lg font-black text-[#D82D8B] block truncate">
                  {{ formatVnd(order.totalAmount) }}
                </span>
              </div>
              <button
                type="button"
                @click="copyText(String(Math.round(order.totalAmount)), 'Số tiền')"
                class="shrink-0 px-2.5 py-1.5 rounded-lg bg-pink-100 hover:bg-[#D82D8B] text-[#A50064] hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
                title="Sao chép số tiền"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Chép tiền</span>
              </button>
            </div>

            <!-- Nội dung lời nhắn chuyển MoMo (Bắt buộc) -->
            <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-pink-50 border border-pink-300">
              <div class="min-w-0 flex-1">
                <span class="text-[11px] text-[#A50064] font-bold block truncate">Lời nhắn / Nội dung MoMo:</span>
                <span class="font-mono text-sm sm:text-base font-black text-[#242424] block truncate">{{ order.orderCode }}</span>
              </div>
              <button
                type="button"
                @click="copyText(order.orderCode, 'Nội dung MoMo')"
                class="shrink-0 px-3 py-1.5 rounded-lg bg-[#D82D8B] text-white hover:bg-[#A50064] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
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
            <button
              type="button"
              @click="openMomoApp"
              class="px-3.5 py-1.5 rounded-xl bg-[#D82D8B] hover:bg-[#A50064] text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>Mở App MoMo thanh toán</span>
            </button>
          </div>
          <p class="text-[11px] text-[#7A866E] leading-relaxed">
            💡 Quét mã QR bằng ứng dụng <strong>MoMo</strong> hoặc bất kỳ App Ngân Hàng nào. Mã đã được nhúng sẵn số tiền <strong>{{ formatVnd(order.totalAmount) }}</strong> và nội dung <strong>{{ order.orderCode }}</strong> gửi tới <strong>{{ momoMerchant.displayName }}</strong>.
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
