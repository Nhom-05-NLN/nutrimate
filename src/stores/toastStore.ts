import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'success' | 'info' | 'error';
  actionLabel?: string;
  actionLink?: string;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);

  function show(
    title: string,
    type: 'success' | 'info' | 'error' = 'success',
    subtitle?: string,
    actionLabel?: string,
    actionLink?: string
  ) {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    toasts.value.push({ id, title, subtitle, type, actionLabel, actionLink });

    setTimeout(() => {
      remove(id);
    }, 4000);
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
