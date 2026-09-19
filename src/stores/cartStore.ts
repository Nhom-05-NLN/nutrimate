import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CartItem, Product } from '../types';
import { useToastStore } from './toastStore';

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const isCartOpen = ref<boolean>(false);
  const isCheckoutOpen = ref<boolean>(false);

  const toast = useToastStore();

  const totalCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  const totalCalories = computed(() =>
    Math.round(items.value.reduce((sum, item) => sum + item.product.nutrition.calories * item.quantity, 0))
  );

  const totalProtein = computed(() =>
    Math.round(items.value.reduce((sum, item) => sum + item.product.nutrition.protein * item.quantity, 0) * 10) / 10
  );

  function addItem(product: Product, quantity = 1) {
    const existing = items.value.find((i) => i.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({ product, quantity });
    }
    toast.show(`Đã thêm "${product.name}" vào giỏ hàng!`);
  }

  function removeItem(productId: string) {
    const item = items.value.find((i) => i.product.id === productId);
    items.value = items.value.filter((i) => i.product.id !== productId);
    if (item) {
      toast.show(`Đã xóa "${item.product.name}" khỏi giỏ hàng.`, 'info');
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const item = items.value.find((i) => i.product.id === productId);
    if (item) {
      item.quantity = quantity;
    }
  }

  function clearCart() {
    items.value = [];
  }

  function openCart() {
    isCartOpen.value = true;
  }

  function closeCart() {
    isCartOpen.value = false;
  }

  function openCheckout() {
    isCartOpen.value = false;
    isCheckoutOpen.value = true;
  }

  function closeCheckout() {
    isCheckoutOpen.value = false;
  }

  return {
    items,
    isCartOpen,
    isCheckoutOpen,
    totalCount,
    totalAmount,
    totalCalories,
    totalProtein,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    openCheckout,
    closeCheckout,
  };
});
