<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, Edit2, AlertCircle } from 'lucide-vue-next';
import type { AdminCategoryRecord as AdminCategoryItem } from '../../types';

const props = defineProps<{
  modelValue: boolean;
  saving?: boolean;
  existingCategories?: AdminCategoryItem[];
  category?: AdminCategoryItem | null;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: { name: string; description: string; status: boolean }): void;
}>();
const form = ref({ code: '', name: '', description: '', status: true });
const errors = ref({ code: '', name: '', description: '' });
watch(() => props.modelValue, (open) => {
  if (!open) return;
  errors.value = { code: '', name: '', description: '' };
  form.value = {
    status: props.category?.status ?? true,
    code: props.category?.code ?? '',
    name: props.category?.name ?? '',
    description: props.category?.description ?? '',
  };
}, { immediate: true });

function handleSubmit() {
  if (props.saving) return;
  errors.value = { code: '', name: '', description: '' };
  const name = form.value.name.trim();
  const description = form.value.description.trim();
  if (name.length < 2 || name.length > 100) errors.value.name = 'Tên danh mục phải từ 2–100 ký tự.';
  if (description.length > 5000) errors.value.description = 'Mô tả tối đa 5000 ký tự.';
  if (errors.value.name || errors.value.description) return;
  emit('submit', { name, description, status: form.value.status });
}
function handleClose() {
  if (!props.saving) emit('update:modelValue', false);
}
</script>

<template>
  <div
    v-if="modelValue && category"
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
  >
    <div
      class="bg-white rounded-3xl max-w-lg w-full my-8 overflow-hidden shadow-2xl border border-[#E3E8DC] animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-[#FAF9F5] border-b border-[#ECEFE7] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
            <Edit2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-heading text-lg font-black text-[#2D3B1E]">
              Chỉnh Sửa Danh Mục
            </h3>
          </div>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="p-2 rounded-xl text-[#7A866E] hover:text-[#2D3B1E] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body / Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-xs">
        <!-- Mã danh mục & Tên danh mục -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Mã danh mục -->
          <div class="sm:col-span-1 space-y-1.5">
            <label class="font-bold text-[#2D3B1E] flex items-center gap-1">
              <span>Mã danh mục</span>
            </label>
            <input
              v-model="form.code"
              type="text"
              placeholder="CAT-01"
              readonly
              class="w-full px-3.5 py-2.5 rounded-xl border bg-white font-mono uppercase font-semibold focus:outline-hidden transition-colors"
              :class="errors.code ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500' : 'border-[#CCD7BC] focus:border-[#536124]'"
            />
            <p v-if="errors.code" class="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" />
              <span>{{ errors.code }}</span>
            </p>
          </div>

          <!-- Tên danh mục -->
          <div class="sm:col-span-2 space-y-1.5">
            <label class="font-bold text-[#2D3B1E] flex items-center gap-1">
              <span>Tên danh mục</span>
              <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Nhập tên danh mục..."
              class="w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-hidden transition-colors"
              :class="errors.name ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500' : 'border-[#CCD7BC] focus:border-[#536124]'"
            />
            <p v-if="errors.name" class="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" />
              <span>{{ errors.name }}</span>
            </p>
          </div>
        </div>

        <!-- Mô tả danh mục -->
        <div class="space-y-1.5">
          <label class="font-bold text-[#2D3B1E] flex items-center gap-1">
            <span>Mô tả danh mục</span>
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Mô tả tóm tắt lợi ích hoặc nhóm sản phẩm của danh mục..."
            class="w-full px-3.5 py-2 rounded-xl border bg-white focus:outline-hidden transition-colors"
            :class="errors.description ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500' : 'border-[#CCD7BC] focus:border-[#536124]'"
          ></textarea>
          <p v-if="errors.description" class="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5 shrink-0" />
            <span>{{ errors.description }}</span>
          </p>
        </div>

        <div class="space-y-2">
          <span class="block font-bold text-[#2D3B1E]">Trạng thái hiển thị</span>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer" :class="form.status ? 'border-[#536124] bg-[#FAF9F5] text-[#536124]' : 'border-[#E3E8DC] text-[#7A866E]'">
              <input v-model="form.status" type="radio" :value="true" :disabled="saving" class="accent-[#536124]" />
              Đang hiển thị
            </label>
            <label class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer" :class="!form.status ? 'border-[#536124] bg-[#FAF9F5] text-[#536124]' : 'border-[#E3E8DC] text-[#7A866E]'">
              <input v-model="form.status" type="radio" :value="false" :disabled="saving" class="accent-[#536124]" />
              Đang ẩn
            </label>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="pt-4 border-t border-[#ECEFE7] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2.5 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] hover:bg-white text-xs font-bold text-[#2D3B1E] transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="px-5 py-2.5 rounded-xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
