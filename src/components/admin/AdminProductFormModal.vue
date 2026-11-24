<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { Package, X, Loader2, ChevronDown } from 'lucide-vue-next';
import type { AdminProductItem } from './AdminProductDetailModal.vue';
import ProductImagesEditor from './ProductImagesEditor.vue';
import { fetchNextAdminProductSku } from '../../services/api';

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
    unit: string;
    package_size: string;
    stock?: number;
    calo: number;
    protein: number;
    carbs?: number;
    fat?: number;
    sugar: number;
    fiber: number;
    sodium: number;
    status: 'Đang bán' | 'Tạm ngừng';
    image: string;
    galleryImages: string[];
    description: string;
    ingredients: string[];
    usageInstruction: string;
  }): void;
}>();

const form = ref({
  unit: '',
  package_size: '',
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
  fiber: 0,
  sodium: 0,
  status: 'Đang bán' as 'Đang bán' | 'Tạm ngừng',
  image: '',
  galleryImages: [] as string[],
  description: '',
  ingredientsText: '',
  usageInstruction: '',
});

const nutritionScope = computed(() => {
  const unit = form.value.unit.trim();
  const packageSize = form.value.package_size.trim();
  if (!unit) return '1 đơn vị sản phẩm';
  return ['1', unit, packageSize].filter(Boolean).join(' ');
});

const formErrors = ref({
  sku: '',
  name: '',
  price: '',
  stock: '',
  calo: '',
  protein: '',
});

const isUploading = ref(false);
const nutritionError = ref('');
const skuLoading = ref(false);
let skuRequest = 0;

async function loadSku() {
  const request = ++skuRequest;
  skuLoading.value = true;
  formErrors.value.sku = '';
  try {
    const result = await fetchNextAdminProductSku();
    if (request !== skuRequest || !props.modelValue || props.mode !== 'create') {
      return;
    }
    form.value.sku = result;
  } catch (error) {
    if (request === skuRequest) formErrors.value.sku = error instanceof Error ? error.message : 'Không thể cấp mã SKU.';
  } finally { if (request === skuRequest) skuLoading.value = false; }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    skuRequest++;
    skuLoading.value = false;
    if (isOpen) {
      nutritionError.value = '';
      isUploading.value = false;
      formErrors.value = { sku: '', name: '', price: '', stock: '', calo: '', protein: '' };
      if (props.mode === 'edit' && props.initialData) {
        form.value = {
          unit: props.initialData.unit || '',
          package_size: props.initialData.package_size || '',
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
          fiber: props.initialData.fiber ?? 0,
          sodium: props.initialData.sodium ?? 0,
          status: props.initialData.status,
          description: props.initialData.description ?? '',
          ingredientsText: (props.initialData.ingredients ?? []).join('\n'),
          usageInstruction: props.initialData.usageInstruction ?? '',
          image: props.initialData.image,
          galleryImages: [...(props.initialData.galleryImages ?? (props.initialData.image ? [props.initialData.image] : []))],
        };
      } else {
        form.value = {
          unit: '',
          package_size: '',
          sku: '',
          name: '',
          category: props.categories[0]?.id || '',
          price: 0,
          stock: 0,
          calo: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          fiber: 0,
          sodium: 0,
          status: 'Đang bán',
          image: '',
          galleryImages: [],
          description: '',
          ingredientsText: '',
          usageInstruction: '',
        };
        void loadSku();
      }
    }
  },
  { immediate: true }
);

function validateProductForm(): boolean {
  nutritionError.value = '';
  if (['calo', 'protein', 'carbs', 'fat', 'sugar', 'fiber', 'sodium'].some(field => {
    const value = form.value[field as 'calo' | 'protein' | 'carbs' | 'fat' | 'sugar' | 'fiber' | 'sodium'];
    return typeof value !== 'number' || !Number.isFinite(value) || value < 0;
  })) {
    nutritionError.value = 'Các chỉ số dinh dưỡng phải là số không âm hợp lệ.';
    return false;
  }
  let isValid = true;
  formErrors.value = { sku: '', name: '', price: '', stock: '', calo: '', protein: '' };

  if (props.mode === 'create' && (!Number.isInteger(form.value.stock) || form.value.stock < 0 || form.value.stock > 2147483647)) {
    formErrors.value.stock = 'Số lượng phải là số nguyên từ 0 đến 2.147.483.647.';
    isValid = false;
  }

  if (props.mode === 'edit' && !form.value.sku.trim()) {
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
  if (props.mode === 'create' && (skuLoading.value || !form.value.sku)) return;
  if (props.saving || isUploading.value || !validateProductForm()) {
    return;
  }

  emit('submit', {
    sku: form.value.sku.trim().toUpperCase(),
    name: form.value.name.trim(),
    category: form.value.category,
    price: form.value.price,
    unit: form.value.unit.trim(),
    package_size: form.value.package_size.trim(),
    ...(props.mode === 'create' ? { stock: form.value.stock } : {}),
    calo: form.value.calo,
    protein: form.value.protein,
    carbs: form.value.carbs,
    fat: form.value.fat,
    sugar: form.value.sugar,
    fiber: form.value.fiber,
    sodium: form.value.sodium,
    status: form.value.status,
    image: form.value.galleryImages[0] ?? '',
    galleryImages: [...form.value.galleryImages],
    description: form.value.description.trim(),
    ingredients: form.value.ingredientsText.split(/\r?\n/).map(value => value.trim()).filter(Boolean),
    usageInstruction: form.value.usageInstruction.trim(),
  });
}

function handleClose() {
  if (props.saving || isUploading.value) return;
  emit('update:modelValue', false);
}

onBeforeUnmount(() => {
  skuRequest++;
});
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-5"
  >
    <div class="bg-white rounded-xl max-w-6xl w-full max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden shadow-2xl border border-[#E3E8DC] animate-in fade-in zoom-in-95 duration-150">
      <!-- Modal Header -->
      <div class="shrink-0 flex items-center justify-between gap-3 border-b border-[#ECEFE7] px-5 py-4 sm:px-6">
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
      <div class="min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] overflow-y-auto lg:overflow-hidden text-xs">
        <div class="min-w-0 space-y-4 p-5 sm:p-6 lg:overflow-y-auto overscroll-contain">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-[#2D3B1E] mb-1.5">
              Mã SKU <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              v-model="form.sku"
              readonly
              :placeholder="skuLoading ? 'Đang cấp mã SKU...' : 'Mã SKU'"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border font-mono text-[#2D3B1E] focus:outline-[#536124]"
              :class="formErrors.sku ? 'border-rose-400 bg-rose-50/20' : 'border-[#DEE5D4]'"
            />
            <span v-if="formErrors.sku" class="text-[11px] text-rose-500 font-medium mt-1 block">
              {{ formErrors.sku }}
            </span>
            <button v-if="mode === 'create' && formErrors.sku" type="button" @click="loadSku" :disabled="skuLoading" class="text-xs text-[#536124] underline mt-1">Thử lại</button>
            <p v-if="mode === 'create'" class="mt-1 text-xs text-[#7A866E]">
              Mã dự kiến; mã chính thức được cấp khi lưu và có thể thay đổi nếu thêm đồng thời.
            </p>
          </div>

          <div>
            <label class="block font-bold text-[#2D3B1E] mb-1.5">
              Tên sản phẩm <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              v-model="form.name"
              placeholder="Granola Yến Mạch Siêu Hạt..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border text-[#2D3B1E] focus:outline-[#536124]"
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
            <div class="relative">
            <select
              v-model="form.category"
              class="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124]"
            >
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <ChevronDown aria-hidden="true" class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-[#2D3B1E] mb-1.5">Trạng thái</label>
            <div class="relative">
            <select
              v-model="form.status"
              class="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124]"
            >
              <option value="Đang bán">Đang bán</option>
              <option value="Tạm ngừng">Tạm ngừng</option>
            </select>
            <ChevronDown aria-hidden="true" class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
            </div>
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
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border text-[#2D3B1E] focus:outline-[#536124]"
              :class="formErrors.price ? 'border-rose-400 bg-rose-50/20' : 'border-[#DEE5D4]'"
            />
            <span v-if="formErrors.price" class="text-[11px] text-rose-500 font-medium mt-1 block">
              {{ formErrors.price }}
            </span>
          </div>

          <div>
            <label for="product-initial-stock" class="block font-bold text-[#2D3B1E] mb-1.5">
              {{ mode === 'edit' ? 'Tồn kho hiện tại' : 'Số lượng' }} <span v-if="mode === 'create'" class="text-rose-500">*</span>
            </label>
            <input
              v-if="mode === 'create'"
              id="product-initial-stock"
              v-model.number="form.stock"
              type="number"
              min="0"
              max="2147483647"
              step="1"
              :disabled="saving"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border text-[#2D3B1E] focus:outline-[#536124]"
              :class="formErrors.stock ? 'border-rose-400 bg-rose-50/20' : 'border-[#DEE5D4]'"
            />
            <output v-else id="product-initial-stock" class="block w-full px-3.5 py-2.5 rounded-xl bg-stone-100 border border-[#DEE5D4] text-[#576449] cursor-default">
              {{ form.stock }}
            </output>
            <span v-if="formErrors.stock" class="text-[11px] text-rose-500 font-medium mt-1 block">
              {{ formErrors.stock }}
            </span>
          </div>
        </div>



        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="product-unit" class="block font-bold text-[#2D3B1E] mb-1.5">Đơn vị bán</label>
            <input id="product-unit" v-model="form.unit" type="text" maxlength="50" placeholder="Ví dụ: hũ, túi, chai, ổ"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124]" />
          </div>
          <div>
            <label for="product-package-size" class="block font-bold text-[#2D3B1E] mb-1.5">Quy cách đóng gói</label>
            <input id="product-package-size" v-model="form.package_size" type="text" maxlength="100" placeholder="Ví dụ: 250 g, 330 ml, 6 thanh"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124]" />
          </div>
        </div>

        <!-- Giá trị dinh dưỡng trên 1 đơn vị sản phẩm -->
        <div class="p-4 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] space-y-3">
          <div class="space-y-1">
            <span class="font-bold text-[#2D3B1E] block">Giá trị dinh dưỡng 
              <span class="text-[#7A866E] font-normal text-[11px]">({{ nutritionScope }})</span>
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Năng lượng / Calo (kcal)</label>
              <input
                type="number"
                v-model.number="form.calo"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Chất đạm (g)</label>
              <input
                type="number"
                v-model.number="form.protein"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Tinh bột / Carbs (g)</label>
              <input
                type="number"
                v-model.number="form.carbs"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Chất béo (g)</label>
              <input
                type="number"
                v-model.number="form.fat"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label class="text-[11px] text-[#7A866E] block mb-1">Đường (g)</label>
              <input
                type="number"
                v-model.number="form.sugar"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold"
              />
            </div>
            <div>
              <label for="product-fiber" class="text-[11px] text-[#7A866E] block mb-1">Chất xơ (g)</label>
              <input id="product-fiber" v-model.number="form.fiber" type="number" min="0" step="any"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold" />
            </div>
            <div>
              <label for="product-sodium" class="text-[11px] text-[#7A866E] block mb-1">Natri (mg)</label>
              <input id="product-sodium" v-model.number="form.sodium" type="number" min="0" step="any"
                class="w-full px-3 py-2 rounded-xl bg-white border border-[#DEE5D4] text-center font-bold" />
            </div>
          </div>
          <p v-if="nutritionError" role="alert" class="text-[11px] text-rose-500">{{ nutritionError }}</p>
        </div>

          <section class="space-y-3 border-t border-[#ECEFE7] pt-4">
            <div>
              <label for="product-description" class="block font-bold text-[#2D3B1E] mb-1.5">Mô tả sản phẩm</label>
              <textarea id="product-description" v-model="form.description" rows="3" maxlength="10000" :disabled="saving"
                placeholder="Giới thiệu đặc điểm và thông tin sản phẩm..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124] resize-y" />
            </div>
            <div>
              <label for="product-ingredients" class="block font-bold text-[#2D3B1E] mb-1.5">Thành phần nguyên liệu</label>
              <textarea id="product-ingredients" v-model="form.ingredientsText" rows="3" maxlength="10000" :disabled="saving"
                placeholder="Nhập mỗi thành phần trên một dòng"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124] resize-y" />
              <p class="text-[11px] text-[#7A866E] mt-1">Mỗi thành phần một dòng, tối đa 200 thành phần.</p>
            </div>
            <div>
              <label for="product-usage" class="block font-bold text-[#2D3B1E] mb-1.5">Hướng dẫn sử dụng</label>
              <textarea id="product-usage" v-model="form.usageInstruction" rows="3" maxlength="10000" :disabled="saving"
                placeholder="Cách dùng, cách bảo quản và lưu ý..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-[#2D3B1E] focus:outline-[#536124] resize-y" />
            </div>
          </section>
        </div>
        <div class="min-w-0 p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-[#ECEFE7] bg-[#FAF9F5]/50 lg:overflow-y-auto overscroll-contain">
          <ProductImagesEditor v-model="form.galleryImages" :disabled="saving" @uploading="isUploading = $event" />
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="shrink-0 flex items-center justify-end gap-3 px-5 py-4 sm:px-6 border-t border-[#ECEFE7] bg-white">
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
          :disabled="saving || isUploading || (mode === 'create' && (skuLoading || !form.sku))"
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

