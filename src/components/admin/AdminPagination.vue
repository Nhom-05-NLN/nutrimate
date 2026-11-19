<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { ADMIN_PAGE_SIZE } from '../../utils/adminPagination';

const props = withDefaults(defineProps<{
  currentPage: number;
  totalItems: number;
  itemLabel: string;
  pageSize?: number;
  disabled?: boolean;
}>(), {
  pageSize: ADMIN_PAGE_SIZE,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pageSize)));
const startItemIndex = computed(() => (props.totalItems ? (props.currentPage - 1) * props.pageSize + 1 : 0));
const endItemIndex = computed(() => Math.min(props.currentPage * props.pageSize, props.totalItems));
const paginationItems = computed(() => {
  const pages = [...new Set([1, props.currentPage - 1, props.currentPage, props.currentPage + 1, totalPages.value])]
    .filter((page) => page >= 1 && page <= totalPages.value)
    .sort((a, b) => a - b);
  const items: (number | '…')[] = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous === 2) items.push(previous + 1);
    else if (previous && page - previous > 2) items.push('…');
    items.push(page);
    previous = page;
  }
  return items;
});

function goToPage(page: number) {
  if (props.disabled || page < 1 || page > totalPages.value || page === props.currentPage) return;
  emit('update:currentPage', page);
}
</script>

<template>
  <nav
    v-if="totalItems > 0"
    aria-label="Phân trang"
    class="w-full box-border px-4 py-4 sm:px-5 border-t border-[#ECEFE7] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
  >
    <span class="min-w-0 text-[#7A866E] font-medium">
      Hiển thị <strong>{{ startItemIndex }} - {{ endItemIndex }}</strong>
      trong tổng số <strong>{{ totalItems.toLocaleString('vi-VN') }}</strong> {{ itemLabel }}
    </span>

    <div class="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
      <button
        type="button"
        :disabled="disabled || currentPage <= 1"
        @click="goToPage(currentPage - 1)"
        class="min-w-11 min-h-11 w-11 h-11 rounded-xl border border-[#CCD7BC] bg-white flex items-center justify-center text-[#536124] hover:bg-[#EBF1E6] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536124]"
        title="Trang trước"
        aria-label="Trang trước"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <div class="hidden sm:flex items-center gap-1">
        <template v-for="(page, index) in paginationItems" :key="`${page}-${index}`">
          <span v-if="page === '…'" class="w-11 h-11 flex items-center justify-center text-[#7A866E]" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            :disabled="disabled"
            @click="goToPage(page)"
            :aria-label="`Trang ${page}`"
            :aria-current="page === currentPage ? 'page' : undefined"
            class="min-w-11 min-h-11 w-11 h-11 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536124]"
            :class="page === currentPage ? 'bg-[#536124] text-white shadow-xs' : 'bg-white border border-[#CCD7BC] text-[#2D3B1E] hover:bg-[#FAF9F5]'"
          >
            {{ page }}
          </button>
        </template>
      </div>

      <span class="sm:hidden min-w-20 text-center font-bold text-[#2D3B1E]" aria-live="polite">
        Trang {{ currentPage }} / {{ totalPages }}
      </span>

      <button
        type="button"
        :disabled="disabled || currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
        class="min-w-11 min-h-11 w-11 h-11 rounded-xl border border-[#CCD7BC] bg-white flex items-center justify-center text-[#536124] hover:bg-[#EBF1E6] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536124]"
        title="Trang tiếp theo"
        aria-label="Trang tiếp theo"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </nav>
</template>
