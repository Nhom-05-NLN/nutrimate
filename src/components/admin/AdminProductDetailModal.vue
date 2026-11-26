<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  X,
  Star,
  ShieldCheck,
  Eye,
  Flame,
  Dumbbell,
  Wheat,
  CandyOff,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-vue-next';
import type { AdminProductItem } from '../../types';

export type { AdminProductItem };

const props = defineProps<{
  modelValue: boolean;
  product: AdminProductItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'edit', product: AdminProductItem): void;
}>();

const activeTab = ref<'info' | 'nutrition' | 'ingredients'>('info');
const activeImageIndex = ref(0);

const galleryImages = computed(() => {
  const product = props.product;
  if (product?.galleryImages?.length) return product.galleryImages;
  return product?.image ? [product.image] : [];
});

watch([() => props.modelValue, galleryImages], () => {
  activeImageIndex.value = 0;
});
const productDescription = computed(() => props.product?.description || 'Chưa có mô tả.');
const productIngredients = computed(() => props.product?.ingredients ?? []);
const nutritionScope = computed(() => {
  const product = props.product;
  if (!product?.unit?.trim()) return '1 đơn vị sản phẩm';
  return ['1', product.unit.trim(), product.package_size?.trim()].filter(Boolean).join(' ');
});
const nutritionRows = computed(() => [
  { label: 'Năng lượng / Calo', value: props.product?.calo, unit: 'kcal' },
  { label: 'Tổng chất béo', value: props.product?.fat, unit: 'g' },
  { label: 'Tinh bột / Carbs', value: props.product?.carbs, unit: 'g' },
  { label: 'Chất xơ', value: props.product?.fiber, unit: 'g' },
  { label: 'Đường', value: props.product?.sugar, unit: 'g' },
  { label: 'Chất đạm', value: props.product?.protein, unit: 'g' },
  { label: 'Natri', value: props.product?.sodium, unit: 'mg' },
]);

function formatNutrient(value: number | undefined, unit: string): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${unit}`;
}

// Tính % giảm giá
const discountPercent = computed(() => {
  if (!props.product?.originalPrice || props.product.originalPrice <= props.product.price) return 0;
  return Math.round(((props.product.originalPrice - props.product.price) / props.product.originalPrice) * 100);
});

// Đánh giá và số lượng
const ratingValue = computed(() => props.product?.rating ?? 0);
const reviewCountValue = computed(() => props.product?.reviewCount ?? 0);

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleClose() {
  emit('update:modelValue', false);
}

function handleEdit() {
  if (props.product) {
    emit('edit', props.product);
    emit('update:modelValue', false);
  }
}
</script>

<template>
  <div
    v-if="modelValue && product"
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
  >
    <div
      class="bg-[#FAF9F5] rounded-xl max-w-4xl w-full my-6 overflow-hidden shadow-2xl border border-[#E3E8DC] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
    >
      <!-- 1. MODAL TOP HEADER: Tiêu đề gọn gàng -->
      <div class="px-6 py-4 bg-white border-b border-[#ECEFE7] flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
            <Eye class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-heading text-lg font-black text-[#2D3B1E]">
              Chi Tiết Sản Phẩm
            </h3>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handleClose"
            class="p-2 rounded-xl text-[#7A866E] hover:text-[#2D3B1E] hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- 2. MODAL BODY (SCROLLABLE) -->
      <div class="p-6 overflow-y-auto space-y-6">
        <!-- Banner thông tin tổng quan của sản phẩm (Top Header info) -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECEFE7] pb-4">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs font-bold text-[#536124] bg-[#EBF1E6] border border-[#CCD7BC] px-2.5 py-1 rounded-lg">
                Mã SKU: {{ product.sku }}
              </span>
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF9F5] text-[#536124] border border-[#E3E8DC]">
                Danh mục: {{ product.category }}
              </span>
              <span
                class="px-2.5 py-1 rounded-lg text-xs font-bold"
                :class="product.status === 'Đang bán' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'"
              >
                ● {{ product.status }}
              </span>
            </div>
          </div>

          <!-- Thông tin chính: Cột ảnh + Cột thông tin chi tiết -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-1">
            <!-- Cột Trái: Ảnh sản phẩm -->
            <div class="md:col-span-4 flex flex-col items-center sm:items-start space-y-3">
              <div class="w-full max-w-[220px] mx-auto md:mx-0 aspect-square rounded-2xl overflow-hidden bg-[#FAF9F5] border border-[#CCD7BC] relative shadow-inner">
                <img
                  v-if="galleryImages.length"
                  :src="galleryImages[activeImageIndex] || galleryImages[0]"
                  :alt="product.name"
                  class="w-full h-full object-cover transition-all duration-300"
                />
                <span
                  v-if="discountPercent > 0"
                  class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-md"
                >
                  -{{ discountPercent }}%
                </span>
              </div>

              <!-- Thumbnails nhỏ gọn -->
              <div
                v-if="galleryImages.length > 1"
                class="grid grid-cols-4 gap-2 w-full max-w-[220px] mx-auto md:mx-0"
              >
                <button
                  v-for="(img, idx) in galleryImages"
                  :key="idx"
                  type="button"
                  @click="activeImageIndex = idx"
                  :aria-label="`Xem ảnh ${idx + 1} của ${product.name}`"
                  :aria-pressed="activeImageIndex === idx"
                  class="aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer"
                  :class="activeImageIndex === idx ? 'border-[#536124] scale-95 shadow-xs ring-2 ring-[#536124]/20' : 'border-[#E3E8DC] opacity-70 hover:opacity-100'"
                >
                  <img :src="img" :alt="`${product.name} - ảnh ${idx + 1}`" class="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            <!-- Cột Phải: Tên sản phẩm, Đánh giá, Giá & Đặc điểm -->
            <div class="md:col-span-8 flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                <h2 class="font-heading text-xl sm:text-2xl font-black text-[#2D3B1E] leading-snug">
                  {{ product.name }}
                </h2>

                <!-- Rating sao & Lượt đánh giá -->
                <div class="flex items-center gap-3 text-xs flex-wrap">
                  <div class="flex items-center gap-1 font-bold text-[#E8A020]">
                    <Star class="w-4 h-4 fill-[#E8A020] text-[#E8A020]" />
                    <span class="text-sm text-[#2D3B1E]">{{ ratingValue }}</span>
                  </div>
                  <span class="text-[#7A866E]">•</span>
                  <span class="text-[#576449] font-medium">{{ reviewCountValue }} lượt đánh giá</span>
                  <span class="text-[#7A866E]">•</span>
                  <span class="text-xs text-[#7A866E]">Quy cách: <strong>{{ [product.unit, product.package_size].filter(Boolean).join(' ') || '—' }}</strong></span>
                  <span class="text-[#7A866E]">•</span>
                  <span class="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck class="w-3.5 h-3.5" /> Chính hãng 100%
                  </span>
                </div>

                <!-- Khung Giá Bán -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC] flex items-baseline gap-3 flex-wrap">
                  <span class="font-heading text-2xl sm:text-3xl font-black text-[#536124]">
                    {{ formatVnd(product.price) }}
                  </span>
                  <span
                    v-if="product.originalPrice && product.originalPrice > product.price"
                    class="text-sm font-semibold text-[#7A866E] line-through"
                  >
                    {{ formatVnd(product.originalPrice) }}
                  </span>
                  <span
                    v-if="discountPercent > 0"
                    class="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                  >
                    Tiết kiệm {{ discountPercent }}%
                  </span>
                </div>
              </div>

              <!-- Cam kết chất lượng -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#ECEFE7] text-[11px] text-[#576449]">
                <div class="flex items-center gap-1.5">
                  <CheckCircle2 class="w-3.5 h-3.5 text-[#536124] shrink-0" />
                  <span>Kiểm định Viện Dinh Dưỡng</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <HeartHandshake class="w-3.5 h-3.5 text-[#536124] shrink-0" />
                  <span>Thành phần sạch lành mạnh</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs chuyển đổi thông tin chuyên sâu -->
        <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs overflow-hidden">
          <div class="flex border-b border-[#ECEFE7] bg-[#FAF9F5] px-4 pt-2 gap-2">
            <button
              type="button"
              @click="activeTab = 'info'"
              class="px-4 py-2.5 font-heading text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5"
              :class="activeTab === 'info' ? 'bg-white text-[#536124] border-t-2 border-[#536124] shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>Mô tả sản phẩm</span>
            </button>
            <button
              type="button"
              @click="activeTab = 'nutrition'"
              class="px-4 py-2.5 font-heading text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5"
              :class="activeTab === 'nutrition' ? 'bg-white text-[#536124] border-t-2 border-[#536124] shadow-2xs' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
            >
              <Flame class="w-3.5 h-3.5" />
              <span>Thông tin dinh dưỡng</span>
            </button>
          </div>

          <div class="p-6">
            <!-- TAB 1: MÔ TẢ & THÀNH PHẦN NGUYÊN LIỆU -->
            <div v-if="activeTab === 'info'" class="space-y-5 text-xs sm:text-sm text-[#4E5C3E]">
              <div>
                <h4 class="font-heading text-sm font-bold text-[#2D3B1E] mb-2">Mô tả sản phẩm:</h4>
                <p class="leading-relaxed whitespace-pre-line bg-[#FAF9F5] p-4 rounded-2xl border border-[#E3E8DC]">
                  {{ productDescription }}
                </p>
              </div>

              <div>
                <h4 class="font-heading text-sm font-bold text-[#2D3B1E] mb-2">Thành phần nguyên liệu chi tiết:</h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(ing, idx) in productIngredients"
                    :key="idx"
                    class="px-3 py-1.5 rounded-xl bg-white border border-[#CCD7BC] text-xs font-semibold text-[#536124] shadow-2xs"
                  >
                    {{ ing }}
                  </span>
                </div>
              </div>

              <!-- Gợi ý sử dụng lành mạnh -->
              <div class="space-y-2 pt-2">
                <h4 class="font-heading text-sm font-bold text-[#2D3B1E]">Hướng dẫn sử dụng:</h4>
                <p class="whitespace-pre-line text-xs text-[#576449]">{{ product.usageInstruction || 'Chưa có hướng dẫn sử dụng.' }}</p>
              </div>
            </div>

            <!-- TAB 2: BẢNG THÔNG TIN DINH DƯỠNG -->
            <div v-else class="space-y-5">
              <!-- 4 Thẻ Macro nổi bật -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] shadow-2xs">
                  <div class="w-7 h-7 mx-auto rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5">
                    <Flame class="w-4 h-4" />
                  </div>
                  <span class="text-xs text-[#7A866E] block font-medium">Năng lượng / Calo</span>
                  <span class="font-heading text-xl font-semibold text-[#2D3B1E]">
                    {{ product.calo }} <span class="text-xs font-normal">kcal</span>
                  </span>
                </div>

                <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] shadow-2xs">
                  <div class="w-7 h-7 mx-auto rounded-xl bg-emerald-100 text-[#536124] flex items-center justify-center mb-1.5">
                    <Dumbbell class="w-4 h-4" />
                  </div>
                  <span class="text-xs text-[#7A866E] block font-medium">Chất đạm</span>
                  <span class="font-heading text-xl font-semibold text-[#2D3B1E]">
                    {{ product.protein }} <span class="text-xs font-normal">g</span>
                  </span>
                </div>

                <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] shadow-2xs">
                  <div class="w-7 h-7 mx-auto rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-1.5">
                    <Wheat class="w-4 h-4" />
                  </div>
                  <span class="text-xs text-[#7A866E] block font-medium">Tinh bột / Carbs</span>
                  <span class="font-heading text-xl font-semibold text-[#2D3B1E]">
                    {{ product.carbs || 0 }} <span class="text-xs font-normal">g</span>
                  </span>
                </div>

                <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] shadow-2xs">
                  <div class="w-7 h-7 mx-auto rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-1.5">
                    <CandyOff class="w-4 h-4" />
                  </div>
                  <span class="text-xs text-[#7A866E] block font-medium">Đường</span>
                  <span class="font-heading text-xl font-semibold text-[#2D3B1E]">
                    {{ product.sugar }} <span class="text-xs font-normal">g</span>
                  </span>
                </div>
              </div>

              <div class="p-5 rounded-2xl bg-white border border-[#E3E8DC] space-y-3">
                <div class="border-b-2 border-[#242424] pb-2 space-y-1">
                  <h5 class="font-heading text-sm font-black text-[#242424] uppercase tracking-wider">Thông tin dinh dưỡng chi tiết</h5>
                  <p class="text-[11px] text-[#7A866E]">Giá trị dinh dưỡng trong {{ nutritionScope }}</p>
                </div>
                <dl class="divide-y divide-[#F0F3EC] text-xs">
                  <div v-for="row in nutritionRows" :key="row.label" class="py-2.5 flex items-center justify-between gap-4">
                    <dt class="font-semibold text-[#242424]">{{ row.label }}</dt>
                    <dd class="shrink-0 font-semibold text-[#2D3B1E]">{{ formatNutrient(row.value, row.unit) }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. MODAL FOOTER -->
      <div class="px-6 py-4 bg-white border-t border-[#ECEFE7] flex items-center justify-end shrink-0">
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="handleClose"
            class="px-5 py-2.5 rounded-xl border border-[#DEE5D4] text-xs font-bold text-[#576449] hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
