<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';
import type { AdminProductItem } from './AdminProductDetailModal.vue';

const props = defineProps<{
  modelValue: boolean;
  saving?: boolean;
  product: AdminProductItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', product: AdminProductItem): void;
}>();

function handleClose() {
  if (props.saving) return;
  emit('update:modelValue', false);
}

function handleConfirm(product: AdminProductItem) {
  if (props.saving) return;
  emit('confirm', product);
  emit('update:modelValue', false);
}
</script>

<template>
  <div v-if="modelValue && product" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl max-w-md w-full p-4 space-y-5 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center gap-3 text-rose-600">
        <div class="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
          <AlertCircle class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-heading text-base font-black text-[#2D3B1E]">Xác nhận xóa sản phẩm</h3>
          <span class="text-xs text-[#7A866E]">Hành động này không thể hoàn tác</span>
        </div>
      </div>

      <p class="text-[13px] text-[#576449] leading-relaxed">
        Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống không?
      </p>

      <div class="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          @click="handleClose"
          class="px-4 py-2.5 rounded-2xl border border-[#DEE5D4] text-xs font-bold text-[#576449] hover:bg-stone-50 cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          @click="handleConfirm(product)"
          :disabled="saving"
          class="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          Xác nhận xóa
        </button>
      </div>
    </div>
  </div>
</template>

