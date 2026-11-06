<script setup lang="ts">
import { computed } from 'vue';
import { CustomerInfo } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { User, Phone, Mail, MapPin, FileText, Sparkles } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: CustomerInfo;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: CustomerInfo): void;
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();

function updateField<K extends keyof CustomerInfo>(field: K, val: CustomerInfo[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: val,
  });
}

const hasLoggedInUser = computed(() => !!authStore.currentUser);

function autofillFromAccount() {
  if (authStore.currentUser) {
    emit('update:modelValue', {
      name: authStore.currentUser.name || props.modelValue.name,
      phone: authStore.currentUser.phone || props.modelValue.phone,
      email: authStore.currentUser.email || props.modelValue.email,
      address: authStore.currentUser.city
        ? `Số 123 Đường Nguyễn Huệ, Quận 1, ${authStore.currentUser.city}`
        : props.modelValue.address,
      note: props.modelValue.note || 'Giao giờ hành chính giúp mình',
    });
    toastStore.show('Đã nạp thông tin từ tài khoản cá nhân', 'success');
  }
}
</script>

<template>
  <div class="bg-white p-6 sm:p-7 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
    <!-- Header Section -->
    <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-4">
      <div class="flex items-center gap-2.5 font-heading text-base font-bold text-[#242424]">
        <span class="w-7 h-7 rounded-full bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center text-xs font-black">1</span>
        <span>Thông tin người nhận & Địa chỉ giao hàng</span>
      </div>

      <button
        v-if="hasLoggedInUser"
        type="button"
        @click="autofillFromAccount"
        class="text-xs font-bold text-[#4D6A34] hover:text-[#3B4E24] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
      >
        <Sparkles class="w-3.5 h-3.5" />
        <span>Dùng thông tin tài khoản</span>
      </button>
    </div>

    <!-- Inputs Form -->
    <div class="space-y-4">
      <!-- 2 Cột: Tên & SĐT -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-bold text-[#576449] flex items-center gap-1.5 mb-1.5">
            <User class="w-3.5 h-3.5 text-[#4D6A34]" />
            <span>Họ và tên người nhận <span class="text-rose-500">*</span></span>
          </label>
          <input
            type="text"
            :value="modelValue.name"
            @input="updateField('name', ($event.target as HTMLInputElement).value)"
            placeholder="VD: Nguyễn Minh Anh"
            required
            class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] placeholder-[#8C9484] focus:bg-white focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none transition-all"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-[#576449] flex items-center gap-1.5 mb-1.5">
            <Phone class="w-3.5 h-3.5 text-[#4D6A34]" />
            <span>Số điện thoại liên hệ <span class="text-rose-500">*</span></span>
          </label>
          <input
            type="tel"
            :value="modelValue.phone"
            @input="updateField('phone', ($event.target as HTMLInputElement).value)"
            placeholder="VD: 0912 345 678"
            required
            class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] placeholder-[#8C9484] focus:bg-white focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none transition-all"
          />
        </div>
      </div>

      <!-- Email -->
      <div>
        <label class="text-xs font-bold text-[#576449] flex items-center gap-1.5 mb-1.5">
          <Mail class="w-3.5 h-3.5 text-[#4D6A34]" />
          <span>Email nhận báo cáo dinh dưỡng & Hóa đơn điện tử</span>
        </label>
        <input
          type="email"
          :value="modelValue.email"
          @input="updateField('email', ($event.target as HTMLInputElement).value)"
          placeholder="VD: minhanh.fit@gmail.com"
          class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-medium text-[#242424] placeholder-[#8C9484] focus:bg-white focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none transition-all"
        />
      </div>

      <!-- Địa chỉ chi tiết -->
      <div>
        <label class="text-xs font-bold text-[#576449] flex items-center gap-1.5 mb-1.5">
          <MapPin class="w-3.5 h-3.5 text-[#4D6A34]" />
          <span>Địa chỉ giao hàng thực tế <span class="text-rose-500">*</span></span>
        </label>
        <input
          type="text"
          :value="modelValue.address"
          @input="updateField('address', ($event.target as HTMLInputElement).value)"
          placeholder="Số nhà, tên tòa nhà/đường, phường/xã, quận/huyện, TP..."
          required
          class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm font-bold text-[#242424] placeholder-[#8C9484] focus:bg-white focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none transition-all"
        />
      </div>

      <!-- Ghi chú cho tài xế -->
      <div>
        <label class="text-xs font-bold text-[#576449] flex items-center gap-1.5 mb-1.5">
          <FileText class="w-3.5 h-3.5 text-[#4D6A34]" />
          <span>Ghi chú cho bếp & tài xế giao hàng</span>
        </label>
        <input
          type="text"
          :value="modelValue.note || ''"
          @input="updateField('note', ($event.target as HTMLInputElement).value)"
          placeholder="VD: Giao giờ hành chính, gọi trước 15 phút, để tại lễ tân..."
          class="w-full px-4 py-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-sm text-[#242424] placeholder-[#8C9484] focus:bg-white focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/20 outline-none transition-all"
        />
      </div>
    </div>
  </div>
</template>
