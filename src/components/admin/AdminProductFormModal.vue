<script setup lang="ts">
import { ref, watch } from 'vue';
import { Package, X, UploadCloud, Loader2, Trash2, CheckCircle2, AlertCircle } from 'lucide-vue-next';
import type { AdminProductItem } from './AdminProductDetailModal.vue';
import { uploadImageToCloudinary } from '@/services/cloudinary';

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

const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadError = ref('');
const isDragging = ref(false);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      uploadError.value = '';
      isUploading.value = false;
      isDragging.value = false;
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

function triggerFileInput() {
  if (isUploading.value || props.saving) return;
  fileInputRef.value?.click();
}

async function handleFileUpload(file: File) {
  uploadError.value = '';
  isUploading.value = true;
  try {
    const result = await uploadImageToCloudinary(file);
    form.value.image = result.secureUrl;
  } catch (err: unknown) {
    uploadError.value = err instanceof Error ? err.message : 'Tải ảnh lên thất bại.';
  } finally {
    isUploading.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    void handleFileUpload(file);
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (isUploading.value || props.saving) return;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    void handleFileUpload(file);
  }
}

function removeImage() {
  form.value.image = '';
  uploadError.value = '';
}

function handleSubmit() {
  if (props.saving || isUploading.value || !validateProductForm()) {
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

        <!-- Khối Hình ảnh sản phẩm (Cloudinary) -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <label class="block font-bold text-[#2D3B1E]">
              Hình ảnh sản phẩm
              <span class="text-xs font-normal text-[#7A866E] ml-1">(Lưu trữ Cloudinary)</span>
            </label>
            <span
              v-if="form.image && form.image.includes('cloudinary.com')"
              class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200"
            >
              <CheckCircle2 class="w-3.5 h-3.5" /> Cloudinary CDN
            </span>
          </div>

          <!-- Trạng thái Đang có ảnh (Preview) -->
          <div
            v-if="form.image"
            class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] flex items-center gap-4"
          >
            <div class="w-20 h-20 rounded-xl overflow-hidden bg-white border border-[#CCD7BC] shrink-0 relative shadow-2xs">
              <img
                :src="form.image"
                alt="Ảnh sản phẩm"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0 space-y-1.5">
              <p class="text-xs font-bold text-[#2D3B1E] truncate">
                {{ form.name || 'Ảnh sản phẩm' }}
              </p>
              <p class="text-[11px] text-[#7A866E] font-mono truncate" :title="form.image">
                {{ form.image }}
              </p>
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  @click="triggerFileInput"
                  :disabled="isUploading || saving"
                  class="px-3 py-1.5 rounded-xl bg-white border border-[#DEE5D4] text-xs font-bold text-[#536124] hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  Đổi ảnh khác
                </button>
                <button
                  type="button"
                  @click="removeImage"
                  :disabled="isUploading || saving"
                  class="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors inline-flex items-center gap-1"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  Xóa ảnh
                </button>
              </div>
            </div>
          </div>

          <!-- Vùng Kéo thả / Chọn file (Khi chưa có ảnh) -->
          <div
            v-else
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            class="relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200"
            :class="[
              isDragging
                ? 'border-[#536124] bg-[#EBF1E6]/40 scale-[1.01]'
                : 'border-[#DEE5D4] bg-[#FAF9F5] hover:border-[#536124] hover:bg-white',
              isUploading ? 'pointer-events-none opacity-80' : ''
            ]"
          >
            <div v-if="isUploading" class="flex flex-col items-center justify-center space-y-2 py-2">
              <Loader2 class="w-8 h-8 text-[#536124] animate-spin" />
              <p class="text-xs font-bold text-[#2D3B1E]">Đang tải ảnh lên Cloudinary...</p>
              <p class="text-[11px] text-[#7A866E]">Vui lòng đợi trong giây lát</p>
            </div>

            <div v-else class="flex flex-col items-center justify-center space-y-2">
              <div class="w-12 h-12 rounded-2xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
                <UploadCloud class="w-6 h-6" />
              </div>
              <div>
                <p class="text-xs font-bold text-[#2D3B1E]">
                  Nhấn để chọn ảnh từ máy tính hoặc kéo thả vào đây
                </p>
                <p class="text-[11px] text-[#7A866E] mt-0.5">
                  Hỗ trợ JPG, PNG, WebP (Tối đa 10MB) • Tự động đẩy lên Cloudinary
                </p>
              </div>
            </div>
          </div>

          <!-- Input file ẩn -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            class="hidden"
            @change="handleFileChange"
          />

          <!-- Báo lỗi upload nếu có -->
          <div
            v-if="uploadError"
            class="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ uploadError }}</span>
          </div>

          <!-- Nhập URL thủ công -->
          <details class="text-xs text-[#7A866E]">
            <summary class="cursor-pointer hover:text-[#536124] font-medium transition-colors select-none">
              Hoặc dán URL ảnh trực tiếp
            </summary>
            <div class="mt-2">
              <input
                type="text"
                v-model="form.image"
                placeholder="https://res.cloudinary.com/... hoặc https://images.unsplash.com/..."
                class="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124] text-xs font-mono"
              />
            </div>
          </details>
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
          :disabled="saving || isUploading"
          class="px-5 py-2.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <Loader2 v-if="saving || isUploading" class="w-3.5 h-3.5 animate-spin" />
          <span>
            {{ isUploading ? 'Đang tải ảnh...' : (mode === 'create' ? 'Lưu sản phẩm mới' : 'Lưu thay đổi') }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

