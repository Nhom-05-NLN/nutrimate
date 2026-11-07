<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next';
import type { AdminCategoryItemWithCount } from './AdminCategoryDetailModal.vue';

const props = defineProps<{
  modelValue: boolean;
  saving?: boolean;
  category: AdminCategoryItemWithCount | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

function handleClose() {
  if (props.saving) return;
  emit('update:modelValue', false);
}

function handleConfirm() {
  emit('confirm');
  emit('update:modelValue', false);
}
</script>

<template>
  <div
    v-if="modelValue && category"
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 overflow-y-auto"
  >
    <div
      class="bg-white rounded-3xl max-w-md w-full my-8 overflow-hidden shadow-2xl border border-[#E3E8DC] animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="p-6 space-y-4">
        <!-- Icon & Header -->
        <div class="flex items-start justify-between">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle class="w-6 h-6 stroke-[2]" />
          </div>
          <button
            type="button"
            @click="handleClose"
            class="p-2 rounded-xl text-[#7A866E] hover:text-[#2D3B1E] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 class="font-heading text-lg font-black text-[#2D3B1E]">
            Xác nhận xóa danh mục?
          </h3>
          <p class="text-xs text-[#7A866E] mt-1.5 leading-relaxed">
            Hành động này sẽ xóa danh mục khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục không?
          </p>
        </div>

        <!-- Category Card Summary -->
        <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC] space-y-2 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-[#7A866E]">Mã danh mục:</span>
            <span class="font-mono font-bold text-[#536124]">{{ category.code || category.id }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#7A866E]">Tên danh mục:</span>
            <span class="font-bold text-[#2D3B1E]">{{ category.name }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#7A866E]">Sản phẩm liên kết:</span>
            <span class="font-bold text-rose-600">{{ category.productCount || 0 }} sản phẩm</span>
          </div>
        </div>

        <p v-if="category.productCount && category.productCount > 0" class="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          ⚠️ <strong>Lưu ý:</strong> Đang có <strong>{{ category.productCount }} sản phẩm</strong> thuộc danh mục này. Hãy kiểm tra hoặc phân loại lại sản phẩm trước khi xóa.
        </p>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2.5 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] hover:bg-white text-xs font-bold text-[#2D3B1E] transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="saving || (category.productCount ?? 0) > 0"
            class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

