import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { CartItem, Product } from '../types';
import { useToastStore } from './toastStore';
import { useAuthStore } from './authStore';

export function getCartItemKey(productId: string): string {
  return productId;
}

function normalizeCart(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const item of items) {
    const existing = merged.get(item.product.id);
    if (existing) existing.quantity += item.quantity;
    else merged.set(item.product.id, { product: item.product, quantity: item.quantity });
  }
  return [...merged.values()];
}

function normalizeSelected(keys: string[]) {
  return [...new Set(keys.map(key => key.split('___')[0]!))];
}

function getCartStorageKey(userId?: string | null): string {
  return userId ? `nutrimate_cart_items_v2_${userId}` : 'nutrimate_cart_items_v2_guest';
}

function getSelectedStorageKey(userId?: string | null): string {
  return userId ? `nutrimate_cart_selected_v2_${userId}` : 'nutrimate_cart_selected_v2_guest';
}

// Dọn dẹp key lưu trữ cũ từng chứa sản phẩm mẫu
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('nutrimate_cart_items_v1');
    localStorage.removeItem('nutrimate_cart_selected_v1');
  } catch {
    // Ignored in restricted environments
  }
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
  const items = ref<CartItem[]>(normalizeCart(loadFromStorage<CartItem[]>(getCartStorageKey(authStore.currentUser?.id), [])));

  // Cart identity is the product ID.
  const initialSelectedKeys = loadFromStorage<string[]>(
    getSelectedStorageKey(authStore.currentUser?.id),
    items.value.map((i) => getCartItemKey(i.product.id))
  );
  const selectedKeys = ref<string[]>(normalizeSelected(initialSelectedKeys));

  const isCartOpen = ref<boolean>(false);
  const isCheckoutOpen = ref<boolean>(false);
  const toast = useToastStore();

  // Đồng bộ giỏ hàng khi đổi tài khoản đăng nhập
  watch(
    () => authStore.currentUser?.id,
    (newUserId) => {
      const userItems = loadFromStorage<CartItem[]>(getCartStorageKey(newUserId), []);
      items.value = normalizeCart(userItems);
      selectedKeys.value = normalizeSelected(loadFromStorage<string[]>(
        getSelectedStorageKey(newUserId),
        userItems.map((i) => getCartItemKey(i.product.id))
      ));
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
      const key = getCartItemKey(item.product.id);
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
      selectedKeys.value.includes(getCartItemKey(item.product.id))
    );
  });

  // Actions
  function isItemSelected(productId: string): boolean {
    const key = getCartItemKey(productId);
    return selectedKeys.value.includes(key);
  }

  function toggleSelectItem(productId: string) {
    const key = getCartItemKey(productId);
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
      selectedKeys.value = items.value.map((i) => getCartItemKey(i.product.id));
    }
  }

  function selectAll() {
    selectedKeys.value = items.value.map((i) => getCartItemKey(i.product.id));
  }

  function unselectAll() {
    selectedKeys.value = [];
  }

  function addItem(
    product: Product,
    quantity = 1,
    silent = false,
  ) {
    const key = getCartItemKey(product.id);

    const existing = items.value.find(
      (i) => getCartItemKey(i.product.id) === key
    );

    if (existing) {
      existing.quantity += quantity;
      if (product.isAiRecommended) existing.product.isAiRecommended = true;
    } else {
      items.value.push({
        product,
        quantity,
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
        `${product.name} x ${quantity}`,
        'Xem giỏ hàng',
        '/cart'
      );
    }
  }

  function removeItem(productId: string) {
    const removed = items.value.find(item => item.product.id === productId);
    items.value = items.value.filter(item => item.product.id !== productId);
    selectedKeys.value = selectedKeys.value.filter(key => key !== getCartItemKey(productId));
    if (removed) toast.show('Đã xóa sản phẩm khỏi giỏ hàng', 'info', removed.product.name);
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return removeItem(productId);
    const item = items.value.find(item => item.product.id === productId);
    if (item) item.quantity = quantity;
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
