<script setup lang="ts">
import { X, Layers, Calendar, CheckCircle2, EyeOff, Tag, FileText } from 'lucide-vue-next';
import { computed } from 'vue';
import { useAdminStore, type AdminCategoryItem } from '../../stores/adminStore';

export interface AdminCategoryItemWithCount extends AdminCategoryItem {
  productCount?: number;
}

const props = defineProps<{
  modelValue: boolean;
  category: AdminCategoryItemWithCount | null;
}>();

const adminStore = useAdminStore();
const categoryProducts = computed(() => {
  if (!props.category) return [];
  const categoryName = props.category.name.trim().toLowerCase();
  return adminStore.products.filter(
    (product) => product.category?.trim().toLowerCase() === categoryName
  );
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'edit', category: AdminCategoryItemWithCount): void;
}>();

function handleClose() {
  emit('update:modelValue', false);
}

function handleEdit(category: AdminCategoryItemWithCount) {
  emit('update:modelValue', false);
  emit('edit', category);
}
</script>

<template>
  <div
    v-if="modelValue && category"
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 overflow-y-auto"
  >
    <div
      class="bg-white rounded-3xl max-w-lg w-full my-8 overflow-hidden shadow-2xl border border-[#E3E8DC] animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-[#FAF9F5] border-b border-[#ECEFE7] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-heading text-lg font-black text-[#2D3B1E]">
              Chi Tiết Danh Mục
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

      <!-- Modal Body -->
      <div class="p-6 space-y-4 text-xs">
        <!-- Tên danh mục & Trạng thái -->
        <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC] space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-[11px] font-bold text-[#7A866E] uppercase tracking-wider block">Tên danh mục</span>
              <h2 class="font-heading text-xl font-black text-[#2D3B1E] mt-0.5">
                {{ category.name }}
              </h2>
            </div>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0"
              :class="category.status === 'Hoạt động' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'"
            >
              <component :is="category.status === 'Hoạt động' ? CheckCircle2 : EyeOff" class="w-3.5 h-3.5" />
              <span>{{ category.status }}</span>
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-[#ECEFE7]">
            <div class="space-y-0.5">
              <span class="text-[11px] text-[#7A866E] flex items-center gap-1">
                <Tag class="w-3.5 h-3.5 text-[#536124]" />
                <span>Mã danh mục:</span>
              </span>
              <span class="font-mono font-bold text-[#536124] bg-[#EBF1E6] px-2 py-0.5 rounded-md inline-block">
                {{ category.code || category.id }}
              </span>
            </div>

            <div class="space-y-0.5">
              <span class="text-[11px] text-[#7A866E] flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5 text-[#536124]" />
                <span>Ngày tạo:</span>
              </span>
              <span class="font-bold text-[#2D3B1E]">{{ category.createdAt || '15/10/2026' }}</span>
            </div>
          </div>
        </div>

        <!-- Thông tin chi tiết: Mô tả & Số sản phẩm liên kết -->
        <div class="space-y-3 p-4 rounded-2xl border border-[#E3E8DC] bg-white">
          <div class="flex items-center justify-between py-1.5 border-b border-[#ECEFE7]">
            <span class="text-[#7A866E] flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5 text-[#536124]" />
              <span>Số sản phẩm thuộc danh mục:</span>
            </span>
            <span class="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {{ categoryProducts.length }} sản phẩm
            </span>
          </div>

          <ul v-if="categoryProducts.length" class="max-h-64 overflow-y-auto divide-y divide-[#ECEFE7]" aria-label="Sản phẩm thuộc danh mục">
            <li v-for="product in categoryProducts" :key="product.id" class="flex items-center gap-3 py-3">
              <img :src="product.image" alt="" class="h-12 w-12 shrink-0 rounded-xl object-cover bg-[#FAF9F5]" loading="lazy" />
              <div class="min-w-0 flex-1 space-y-1">
                <p class="font-bold text-[#2D3B1E] break-words">{{ product.name }}</p>
                <p class="font-mono text-[11px] text-[#7A866E]">{{ product.sku }}</p>
                <p class="text-[11px]" :class="product.status === 'Đang bán' ? 'text-emerald-700' : 'text-stone-500'">
                  {{ product.status }}
                </p>
              </div>
              <span class="shrink-0 font-bold text-[#536124]">
                {{ product.price.toLocaleString('vi-VN') }} ₫
              </span>
            </li>
          </ul>
          <p v-else class="py-3 text-center text-[#7A866E]">Chưa có sản phẩm nào thuộc danh mục này.</p>

          <div class="pt-1.5 space-y-1">
            <span class="text-[#7A866E] flex items-center gap-1.5">
              <FileText class="w-3.5 h-3.5 text-[#536124]" />
              <span>Mô tả danh mục:</span>
            </span>
            <p class="text-xs text-[#576449] bg-[#FAF9F5] p-3 rounded-xl border border-[#E3E8DC] leading-relaxed">
              {{ category.description }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-3 border-t border-[#ECEFE7] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2.5 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] hover:bg-white text-xs font-bold text-[#2D3B1E] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
