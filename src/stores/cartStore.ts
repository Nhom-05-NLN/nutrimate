import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CartItem, Product } from '../types';
import { useToastStore } from './toastStore';

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([
    {
      product: {
        id: 'prod-granola',
        code: 'NM-GRN-01',
        name: 'Granola Yến Mạch Hạt Dinh Dưỡng Siêu Hạt 500g - Vị Mật Ong & Vani',
        category: 'snacks-nuts',
        categoryName: 'Hạt dinh dưỡng',
        price: 185000,
        originalPrice: 215000,
        image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
        description: 'Granola Yến Mạch nướng mộc mật ong hoa nhãn, hạt macca, hạt điều, hạnh nhân nguyên cám.',
        ingredients: ['Yến mạch Úc (45%)', 'Hạnh nhân Mỹ (15%)', 'Quả óc chó Chile (10%)', 'Hạt điều Bình Phước (10%)', 'Mật ong hoa nhãn'],
        nutrition: {
          servingSize: '40g',
          calories: 152,
          protein: 14,
          carbs: 18,
          fat: 6,
          sugar: 3,
          fiber: 3.2,
          sodium: 25,
        },
        stock: 142,
        rating: 4.9,
        reviewCount: 128,
        badges: ['Bán chạy nhất #1', '100% Tự Nhiên'],
        bestFor: 'Bữa sáng nhanh, ăn xế nạp năng lượng lành mạnh',
      },
      quantity: 1,
      selectedPortion: 'Hũ 500g',
    },
    {
      product: {
        id: 'prod-chicken',
        code: 'NM-CKN-02',
        name: 'Ức Gà Sấy Giòn Vị Thảo Mộc Tự Nhiên 200g',
        category: 'high-protein',
        categoryName: 'Thịt sấy sạch',
        price: 110000,
        originalPrice: 135000,
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
        description: 'Ức gà phi lê sấy nhiệt thấp không dầu mỡ, tẩm ướp tiêu đen và lá hương thảo tự nhiên.',
        ingredients: ['Ức gà tươi phi lê 98%', 'Tiêu đen Phú Quốc', 'Lá hương thảo', 'Muối hồng'],
        nutrition: {
          servingSize: '50g',
          calories: 145,
          protein: 32,
          carbs: 0,
          fat: 1.5,
          sugar: 0,
        },
        stock: 58,
        rating: 5.0,
        reviewCount: 208,
        badges: ['High-Protein', '0g Sugar'],
        bestFor: 'Gymer nạp đạm siết cơ tức thì',
      },
      quantity: 2,
      selectedPortion: 'Gói 200g',
    },
    {
      product: {
        id: 'prod-peanut',
        code: 'NM-PNT-03',
        name: 'Bơ Đậu Phộng Mịn Thuần Chay 350g (Không Đường)',
        category: 'low-carb',
        categoryName: 'Bơ hạt dinh dưỡng',
        price: 90000,
        originalPrice: 110000,
        image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
        description: '100% Đậu phộng sẻ thuần chủng rang mộc nghiền mịn không thêm đường hay dầu cọ.',
        ingredients: ['Đậu phộng sẻ rang chín', 'Muối biển hầm'],
        nutrition: {
          servingSize: '30g',
          calories: 190,
          protein: 8,
          carbs: 6,
          fat: 16,
          sugar: 0.8,
        },
        stock: 84,
        rating: 4.7,
        reviewCount: 142,
        badges: ['Keto & Vegan', '0g Sugar Added'],
        bestFor: 'Ăn kèm bánh mì đen, sinh tố keto',
      },
      quantity: 1,
      selectedPortion: 'Hũ 350g',
    },
  ]);

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

  function addItem(product: Product, quantity = 1, portion = 'Mặc định') {
    const existing = items.value.find(
      (i) => i.product.id === product.id && i.selectedPortion === portion
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({ product, quantity, selectedPortion: portion });
    }
    toast.show(
      'Đã thêm vào giỏ hàng thành công!',
      'success',
      `${product.name} x ${quantity}`,
      'Xem giỏ hàng',
      '/cart'
    );
  }

  function removeItem(productId: string) {
    const item = items.value.find((i) => i.product.id === productId);
    items.value = items.value.filter((i) => i.product.id !== productId);
    if (item) {
      toast.show('Đã xóa sản phẩm khỏi giỏ hàng', 'info', item.product.name);
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
  };
});
