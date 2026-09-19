<script setup lang="ts">
import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';

const toastStore = useToastStore();
</script>

<template>
  <div class="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <transition-group
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-[-20px] opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-[-20px] opacity-0"
    >
      <div
        v-for="item in toastStore.toasts"
        :key="item.id"
        class="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium backdrop-blur-md"
        :class="{
          'bg-slate-900/95 text-white border-slate-700': item.type === 'success' || !item.type,
          'bg-rose-900/95 text-white border-rose-700': item.type === 'error',
          'bg-emerald-900/95 text-white border-emerald-700': item.type === 'info'
        }"
      >
        <div class="flex items-center gap-2.5">
          <CheckCircle2 v-if="item.type === 'success' || !item.type" class="w-5 h-5 text-emerald-400 shrink-0" />
          <AlertCircle v-else-if="item.type === 'error'" class="w-5 h-5 text-rose-400 shrink-0" />
          <Info v-else class="w-5 h-5 text-sky-400 shrink-0" />
          <span>{{ item.message }}</span>
        </div>
        <button
          type="button"
          @click="toastStore.remove(item.id)"
          class="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Đóng thông báo"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
