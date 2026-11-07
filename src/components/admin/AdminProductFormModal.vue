<script setup lang="ts">
import { ref, watch } from 'vue';
import { Package, X } from 'lucide-vue-next';
import type { AdminProductItem } from './AdminProductDetailModal.vue';

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  initialData?: AdminProductItem | null;
  categories: { id: string; name: string }[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: {
    sku: string;
    name: string;
    category: string;
    price: number;
    stock?: number;
    calo: number;
    protein: number;
    carbs?: number;
    fat?: number;
    sugar: number;
    status: 'Đang bán' | 'Tạm ngừng';
    image: string;
  }): void;
}>();

const form = ref({
  sku: '',
  name: '',
  category: '',
  price: 0,
  stock: 0,
  calo: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sugar: 0,
  status: 'Đang bán' as 'Đang bán' | 'Tạm ngừng',
  image: '',
});

const formErrors = ref({
  sku: '',
  name: '',
  price: '',
  stock: '',
  calo: '',
  protein: '',
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      formErrors.value = { sku: '', name: '', price: '', stock: '', calo: '', protein: '' };
      if (props.mode === 'edit' && props.initialData) {
        form.value = {
          sku: props.initialData.sku,
          name: props.initialData.name,
          category: props.initialData.categoryId || '',
          price: props.initialData.price,
          stock: props.initialData.stock ?? 0,
          calo: props.initialData.calo,
          protein: props.initialData.protein,
          carbs: props.initialData.carbs || 0,
          fat: props.initialData.fat || 0,
          sugar: props.initialData.sugar,
          status: props.initialData.status,
          image: props.initialData.image,
        };
      } else {
        form.value = {
          sku: `NM-PRD-${Math.floor(10 + Math.random() * 90)}`,
          name: '',
          category: props.categories[0]?.id || '',
          price: 0,
          stock: 0,
          calo: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          status: 'Đang bán',
          image: '',
        };
      }
    }
  },
  { immediate: true }
);

function validateProductForm(): boolean {
  let isValid = true;
  formErrors.value = { sku: '', name: '', price: '', stock: '', calo: '', protein: '' };

  if (props.mode === 'create' && (!Number.isInteger(form.value.stock) || form.value.stock < 0 || form.value.stock > 2147483647)) {
    formErrors.value.stock = 'Số lượng phải là số nguyên từ 0 đến 2.147.483.647.';
    isValid = false;
  }

  if (!form.value.sku.trim()) {
    formErrors.value.sku = 'Mã SKU không được để trống.';
    isValid = false;
  }

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Vui lòng nhập tên sản phẩm dinh dưỡng.';
    isValid = false;
  } else if (form.value.name.trim().length < 3) {
    formErrors.value.name = 'Tên sản phẩm phải có ít nhất 3 ký tự.';
    isValid = false;
  }

  if (form.value.price <= 0) {
    formErrors.value.price = 'Giá bán phải lớn hơn 0 VNĐ.';
    isValid = false;
  }

  if (form.value.calo < 0) {
    formErrors.value.calo = 'Năng lượng Calo không thể âm.';
    isValid = false;
  }

  if (form.value.protein < 0) {
    formErrors.value.protein = 'Hàm lượng Protein không thể âm.';
    isValid = false;
  }

  return isValid;
}

function handleSubmit() {
  if (props.saving || !validateProductForm()) {
    return;
  }

  emit('submit', {
    sku: form.value.sku.trim().toUpperCase(),
    name: form.value.name.trim(),
    category: form.value.category,
    price: form.value.price,
    ...(props.mode === 'create' ? { stock: form.value.stock } : {}),
    calo: form.value.calo,
    protein: form.value.protein,
    carbs: form.value.carbs,
    fat: form.value.fat,
    sugar: form.value.sugar,
    status: form.value.status,
    image: form.value.image,
  });
}

function handleClose() {
  if (props.saving) return;
  emit('update:modelValue', false);
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
  >
    <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-[#E3E8DC] my-8 animate-in fade-in zoom-in-95 duration-150">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-[#ECEFE7] pb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
            <Package class="w-4 h-4" />
          </div>
          <h3 class="font-heading text-lg font-black text-[#2D3B1E]">
            {{ mode === 'create' ? 'Thêm Sản Phẩm Mới' : 'Chỉnh Sửa Thông Tin Sản Phẩm' }}
          </h3>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="p-1 rounded-lg text-[#7A866E] hover:bg-stone-100 cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Fields -->
      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block font-bold text-[#2D3B1E] mb-1.5">
              Mã SKU <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              v-model="form.sku"
              placeholder="NM-GRN-01"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border font-mono text-[#2D3B1E] focus:outline-[#536124]"
              :class="formErrors.sku ? 'border-rose-400 bg-rose-50/20' : 'border-[#DEE5D4]'"
            />
            <span v-if="formErrors.sku" class="text-[11px] text-rose-500 font-medium mt-1 block">
              {{ formErrors.sku }}
            </span>
          </div>

          <div class="sm:col-span-2">
            <label class="block font-bold text-[#2D3B1E] mb-1.5">
              Tên sản phẩm <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              v-model="form.name"
              placeholder="Granola Yến Mạch Siêu Hạt..."
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border text-[#2D3B1E] focus:outline-[#536124]"
              :class="formErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-[#DEE5D4]'"
            />
            <span v-if="formErrors.name" class="text-[11px] text-rose-500 font-medium mt-1 block">
              {{ formErrors.name }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-[#2D3B1E] mb-1.5">Danh mục dinh dưỡng</label>
            <select
              v-model="form.category"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124]"
            >
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-[#2D3B1E] mb-1.5">Trạng thái bán</label>
            <select
              v-model="form.status"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124]"
            >
              <option value="Đang bán">Đang bán</option>
              <option value="Tạm ngừng">Tạm ngừng</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-[#2D3B1E] mb-1.5">
              Giá bán niêm yết (VNĐ) <span class="text-rose-500">*</span>
            </label>
            <input
              type="number"
              v-model.number="form.price"
              min="0"
              step="1000"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border text-[#2D3B1E] focus:outline-[#536124]"
              :class="formErrors.price ? 'border-rose-400 bg-rose-50/20' : 'border-[#DEE5D4]'"
            />
            <span v-if="formErrors.price" class="text-[11px] text-rose-500 font-medium mt-1 block">
              {{ formErrors.price }}
            </span>
          </div>

          <div v-if="mode === 'create'">
            <label for="product-initial-stock" class="block font-bold text-[#2D3B1E] mb-1.5">
              Số lượng <span class="text-rose-500">*</span>
            </label>
            <input
              id="product-initial-stock"
              v-model.number="form.stock"
              type="number"
              min="0"
              max="2147483647"
              step="1"
              :disabled="saving"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border text-[#2D3B1E] focus:outline-[#536124]"
              :class="formErrors.stock ? 'border-rose-400 bg-rose-50/20' : 'border-[#DEE5D4]'"
            />
            <span v-if="formErrors.stock" class="text-[11px] text-rose-500 font-medium mt-1 block">
              {{ formErrors.stock }}
            </span>
          </div>
        </div>



        <!-- Thông số Macro -->
        <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] space-y-3">
          <span class="font-bold text-[#2D3B1E] block">Chỉ số Dinh dưỡng Macro (100g)</span>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Calo (kcal)</label>
              <input
                type="number"
                v-model.number="form.calo"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Đạm (Protein g)</label>
              <input
                type="number"
                v-model.number="form.protein"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Tinh bột (Carbs g)</label>
              <input
                type="number"
                v-model.number="form.carbs"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Chất béo (Fat g)</label>
              <input
                type="number"
                v-model.number="form.fat"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Đường (Sugar g)</label>
              <input
                type="number"
                v-model.number="form.sugar"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block font-bold text-[#2D3B1E] mb-1.5">Đường dẫn hình ảnh (URL)</label>
          <input
            type="text"
            v-model="form.image"
            placeholder="https://images.unsplash.com/..."
            class="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124]"
          />
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEFE7]">
        <button
          type="button"
          @click="handleClose"
          class="px-4 py-2.5 rounded-2xl border border-[#DEE5D4] text-xs font-bold text-[#576449] hover:bg-stone-50 cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="saving"
          class="px-5 py-2.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          {{ mode === 'create' ? 'Lưu sản phẩm mới' : 'Lưu thay đổi' }}
        </button>
      </div>
    </div>
  </div>
</template>

