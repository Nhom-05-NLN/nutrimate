<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useToastStore } from '../../stores/toastStore';
import { Check, AlertCircle, Info, X } from 'lucide-vue-next';

const router = useRouter();
const toastStore = useToastStore();

function handleAction(link?: string) {
  if (link) {
    router.push(link);
  }
}
</script>

<template>
  <div class="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
    <transition-group
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform -translate-y-4 opacity-0 scale-95"
    >
      <div
        v-for="item in toastStore.toasts"
        :key="item.id"
        class="pointer-events-auto flex items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-[#E0E7D8] shadow-xl text-slate-800 transition-all"
      >
        <!-- Icon -->
        <div class="flex items-center gap-3.5 min-w-0">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            :class="{
              'bg-[#E2EBD5] text-[#4D6A34]': item.type === 'success' || !item.type,
              'bg-rose-100 text-rose-700': item.type === 'error',
              'bg-sky-100 text-sky-700': item.type === 'info',
            }"
          >
            <Check v-if="item.type === 'success' || !item.type" class="w-5 h-5 stroke-[2.5]" />
            <AlertCircle v-else-if="item.type === 'error'" class="w-5 h-5" />
            <Info v-else class="w-5 h-5" />
          </div>

          <!-- Text content -->
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-bold text-[#2D3B1E] truncate">
              {{ item.title }}
            </span>
            <span v-if="item.subtitle" class="text-xs text-[#6B7562] truncate mt-0.5">
              {{ item.subtitle }}
            </span>
          </div>
        </div>

        <!-- Action / Close -->
        <div class="flex items-center gap-2.5 shrink-0">
          <button
            v-if="item.actionLabel"
            type="button"
            @click="handleAction(item.actionLink)"
            class="text-xs font-bold text-[#4D6A34] hover:text-[#2D3B1E] underline underline-offset-4 transition-colors"
          >
            {{ item.actionLabel }}
          </button>

          <button
            type="button"
            @click="toastStore.remove(item.id)"
            class="p-1 rounded-full text-[#8C9484] hover:text-[#2D3B1E] hover:bg-slate-100 transition-colors ml-1"
            aria-label="Đóng thông báo"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>
