import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { CartItem, Product } from '../types';
import { useToastStore } from './toastStore';
import { useAuthStore } from './authStore';

export function getCartItemKey(productId: string, portion = 'Mặc định'): string {
  return `${productId}___${portion || 'Mặc định'}`;
}

function getCartStorageKey(userId?: string | null): string {
  return userId ? `nutrimate_cart_items_v2_${userId}` : 'nutrimate_cart_items_v2_guest';
}

function getSelectedStorageKey(userId?: string | null): string {
  return userId ? `nutrimate_cart_selected_v2_${userId}` : 'nutrimate_cart_selected_v2_guest';
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const useCartStore = defineStore('cart', () => {
  const authStore = useAuthStore();
  const items = ref<CartItem[]>(loadFromStorage<CartItem[]>(getCartStorageKey(authStore.currentUser?.id), []));

  // Key format: productId___portion
  const initialSelectedKeys = loadFromStorage<string[]>(
    getSelectedStorageKey(authStore.currentUser?.id),
    items.value.map((i) => getCartItemKey(i.product.id, i.selectedPortion))
  );
  const selectedKeys = ref<string[]>(initialSelectedKeys);

  const isCartOpen = ref<boolean>(false);
  const isCheckoutOpen = ref<boolean>(false);
  const toast = useToastStore();

  // Đồng bộ giỏ hàng khi đổi tài khoản đăng nhập
  watch(
    () => authStore.currentUser?.id,
    (newUserId) => {
      const userItems = loadFromStorage<CartItem[]>(getCartStorageKey(newUserId), []);
      items.value = userItems;
      selectedKeys.value = loadFromStorage<string[]>(
        getSelectedStorageKey(newUserId),
        userItems.map((i) => getCartItemKey(i.product.id, i.selectedPortion))
      );
    }
  );

  // Đồng bộ localStorage
  watch(
    items,
    (newItems) => {
      try {
        localStorage.setItem(getCartStorageKey(authStore.currentUser?.id), JSON.stringify(newItems));
      } catch {
        // Ignored in restricted environments
      }
    },
    { deep: true }
  );

  watch(
    selectedKeys,
    (newKeys) => {
      try {
        localStorage.setItem(getSelectedStorageKey(authStore.currentUser?.id), JSON.stringify(newKeys));
      } catch {
        // Ignored in restricted environments
      }
    },
    { deep: true }
  );

  // Computed - Toàn bộ giỏ hàng
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

  // Computed - Món được chọn để Checkout
  const selectedItems = computed(() => {
    return items.value.filter((item) => {
      const key = getCartItemKey(item.product.id, item.selectedPortion);
      return selectedKeys.value.includes(key);
    });
  });

  const selectedCount = computed(() =>
    selectedItems.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const selectedAmount = computed(() =>
    selectedItems.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  const selectedCalories = computed(() =>
    Math.round(selectedItems.value.reduce((sum, item) => sum + item.product.nutrition.calories * item.quantity, 0))
  );

  const selectedProtein = computed(() =>
    Math.round(selectedItems.value.reduce((sum, item) => sum + item.product.nutrition.protein * item.quantity, 0) * 10) / 10
  );

  const isAllSelected = computed(() => {
    if (items.value.length === 0) return false;
    return items.value.every((item) =>
      selectedKeys.value.includes(getCartItemKey(item.product.id, item.selectedPortion))
    );
  });

  // Actions
  function isItemSelected(productId: string, portion = 'Mặc định'): boolean {
    const key = getCartItemKey(productId, portion);
    return selectedKeys.value.includes(key);
  }

  function toggleSelectItem(productId: string, portion = 'Mặc định') {
    const key = getCartItemKey(productId, portion);
    const index = selectedKeys.value.indexOf(key);
    if (index > -1) {
      selectedKeys.value = selectedKeys.value.filter((k) => k !== key);
    } else {
      selectedKeys.value = [...selectedKeys.value, key];
    }
  }

  function toggleSelectAll() {
    if (isAllSelected.value) {
      selectedKeys.value = [];
    } else {
      selectedKeys.value = items.value.map((i) => getCartItemKey(i.product.id, i.selectedPortion));
    }
  }

  function selectAll() {
    selectedKeys.value = items.value.map((i) => getCartItemKey(i.product.id, i.selectedPortion));
  }

  function unselectAll() {
    selectedKeys.value = [];
  }

  function addItem(
    product: Product,
    quantity = 1,
    portion = 'Mặc định',
    silentOrVariantId: boolean | string = false,
    variantId?: string,
  ) {
    const silent = typeof silentOrVariantId === 'boolean' ? silentOrVariantId : false;
    const selectedVariantId = typeof silentOrVariantId === 'string' ? silentOrVariantId : variantId;
    const normalizedPortion = portion || 'Mặc định';
    const key = getCartItemKey(product.id, normalizedPortion);

    const existing = items.value.find(
      (i) =>
        getCartItemKey(i.product.id, i.selectedPortion) === key &&
        i.variantId === selectedVariantId
    );

    if (existing) {
      existing.quantity += quantity;
      if (product.isAiRecommended) existing.product.isAiRecommended = true;
    } else {
      items.value.push({
        product,
        quantity,
        selectedPortion: normalizedPortion,
        variantId: selectedVariantId,
      });
    }

    // Tự động chọn item vừa thêm
    if (!selectedKeys.value.includes(key)) {
      selectedKeys.value = [...selectedKeys.value, key];
    }

    if (!silent) {
      toast.show(
        'Đã thêm vào giỏ hàng thành công!',
        'success',
        `${product.name} (${normalizedPortion}) x ${quantity}`,
        'Xem giỏ hàng',
        '/cart'
      );
    }
  }

  function removeItem(productId: string, portion?: string) {
    let removedItem: CartItem | undefined;

    if (portion) {
      const targetKey = getCartItemKey(productId, portion);
      removedItem = items.value.find(
        (i) => getCartItemKey(i.product.id, i.selectedPortion) === targetKey
      );
      items.value = items.value.filter(
        (i) => getCartItemKey(i.product.id, i.selectedPortion) !== targetKey
      );
      selectedKeys.value = selectedKeys.value.filter((k) => k !== targetKey);
    } else {
      removedItem = items.value.find((i) => i.product.id === productId);
      items.value = items.value.filter((i) => i.product.id !== productId);
      selectedKeys.value = selectedKeys.value.filter(
        (k) => !k.startsWith(`${productId}___`)
      );
    }

    if (removedItem) {
      toast.show('Đã xóa sản phẩm khỏi giỏ hàng', 'info', removedItem.product.name);
    }
  }

  function updateQuantity(productId: string, quantity: number, portion?: string) {
    const targetKey = portion ? getCartItemKey(productId, portion) : null;

    if (quantity <= 0) {
      removeItem(productId, portion);
      return;
    }

    const item = items.value.find((i) => {
      if (targetKey) {
        return getCartItemKey(i.product.id, i.selectedPortion) === targetKey;
      }
      return i.product.id === productId;
    });

    if (item) {
      item.quantity = quantity;
    }
  }

  function clearCart() {
    items.value = [];
    selectedKeys.value = [];
    try {
      localStorage.removeItem(getCartStorageKey(authStore.currentUser?.id));
      localStorage.removeItem(getSelectedStorageKey(authStore.currentUser?.id));
    } catch {
      // Ignored
    }
  }

  function openCart() {
    isCartOpen.value = true;
  }

  function closeCart() {
    isCartOpen.value = false;
  }

  function toggleCart() {
    isCartOpen.value = !isCartOpen.value;
  }

  function openCheckout() {
    isCheckoutOpen.value = true;
  }

  function closeCheckout() {
    isCheckoutOpen.value = false;
  }

  function toggleCheckout() {
    isCheckoutOpen.value = !isCheckoutOpen.value;
  }

  return {
    items,
    selectedKeys,
    isCartOpen,
    isCheckoutOpen,
    // Computed all
    totalCount,
    totalAmount,
    totalCalories,
    totalProtein,
    // Computed selected
    selectedItems,
    selectedCount,
    selectedAmount,
    selectedCalories,
    selectedProtein,
    isAllSelected,
    // Selection helpers
    isItemSelected,
    toggleSelectItem,
    toggleSelectAll,
    selectAll,
    unselectAll,
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    openCheckout,
    closeCheckout,
    toggleCheckout,
  };
});
