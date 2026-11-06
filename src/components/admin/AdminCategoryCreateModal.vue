<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { X, FolderPlus, AlertCircle } from 'lucide-vue-next';
import type { AdminCategoryItem } from '../../stores/adminStore';

const props = defineProps<{
  modelValue: boolean;
  existingCategories?: AdminCategoryItem[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: Omit<AdminCategoryItem, 'id'>): void;
}>();

const form = ref({
  code: '',
  name: '',
  description: '',
  status: 'Hoạt động' as 'Hoạt động' | 'Tạm ẩn',
  iconName: 'Flame',
});

const errors = ref({
  code: '',
  name: '',
  description: '',
});

const nextCategoryCode = computed(() => {
  const maxNumber = (props.existingCategories ?? []).reduce((max, category) => {
    const match = /^CAT-(\d+)$/i.exec(category.code);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `CAT-${String(maxNumber + 1).padStart(2, '0')}`;
});

watch(nextCategoryCode, (code) => {
  if (props.modelValue) form.value.code = code;
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      errors.value = { code: '', name: '', description: '' };
      form.value = {
        code: nextCategoryCode.value,
        name: '',
        description: '',
        status: 'Hoạt động',
        iconName: 'Flame',
      };
    }
  },
  { immediate: true }
);

function validate(): boolean {
  let isValid = true;
  errors.value = { code: '', name: '', description: '' };

  if (!form.value.code.trim()) {
    errors.value.code = 'Vui lòng nhập mã danh mục';
    isValid = false;
  } else {
    const duplicate = props.existingCategories?.find(
      (c) => c.code?.toLowerCase() === form.value.code.toLowerCase().trim()
    );
    if (duplicate) {
      errors.value.code = `Mã danh mục "${form.value.code}" đã tồn tại trên danh mục "${duplicate.name}"`;
      isValid = false;
    }
  }

  if (!form.value.name.trim()) {
    errors.value.name = 'Vui lòng nhập tên danh mục';
    isValid = false;
  } else if (form.value.name.trim().length < 2) {
    errors.value.name = 'Tên danh mục tối thiểu 2 ký tự';
    isValid = false;
  }

  if (!form.value.description.trim()) {
    errors.value.description = 'Vui lòng nhập mô tả danh mục';
    isValid = false;
  }

  return isValid;
}

function handleSubmit() {
  if (!validate()) return;

  emit('submit', {
    code: form.value.code.trim().toUpperCase(),
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    status: form.value.status,
    iconName: form.value.iconName,
  });

  emit('update:modelValue', false);
}

function handleClose() {
  emit('update:modelValue', false);
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 overflow-y-auto"
  >
    <div
      class="bg-white rounded-3xl max-w-lg w-full my-8 overflow-hidden shadow-2xl border border-[#E3E8DC] animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-[#FAF9F5] border-b border-[#ECEFE7] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
            <FolderPlus class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-heading text-lg font-black text-[#2D3B1E]">
              Thêm Danh Mục Mới
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
              <span class="text-rose-500">*</span>
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
            <span class="text-rose-500">*</span>
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

        <!-- Trạng thái hoạt động -->
        <div class="space-y-1.5">
          <label class="block font-bold text-[#2D3B1E]">Trạng thái hiển thị</label>
          <div class="grid grid-cols-2 gap-3">
            <label
              class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all"
              :class="form.status === 'Hoạt động' ? 'border-[#536124] bg-[#FAF9F5] text-[#536124] font-bold' : 'border-[#E3E8DC] text-[#7A866E]'"
            >
              <input type="radio" value="Hoạt động" v-model="form.status" class="accent-[#536124]" />
              <span>Hoạt động</span>
            </label>
            <label
              class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all"
              :class="form.status === 'Tạm ẩn' ? 'border-[#536124] bg-[#FAF9F5] text-[#536124] font-bold' : 'border-[#E3E8DC] text-[#7A866E]'"
            >
              <input type="radio" value="Tạm ẩn" v-model="form.status" class="accent-[#536124]" />
              <span>Tạm ẩn</span>
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
            class="px-5 py-2.5 rounded-xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Tạo danh mục
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
