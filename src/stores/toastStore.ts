import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);

  function show(message: string, type: 'success' | 'info' | 'error' = 'success') {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toasts.value.push({ id, message, type });

    setTimeout(() => {
      remove(id);
    }, 3000);
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    show,
    remove,
  };
});
