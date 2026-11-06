import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AdminProductItem } from '../types';

export interface AdminCategoryItem {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Hoạt động' | 'Tạm ẩn';
  createdAt?: string;
  iconName?: string;
}

export const INITIAL_ADMIN_PRODUCTS: AdminProductItem[] = [
  {
    id: 'prod-granola',
    sku: 'NM-GRN-01',
    name: 'Granola Yến Mạch Siêu Hạt',
    category: 'Hạt dinh dưỡng',
    price: 185000,
    originalPrice: 220000,
    calo: 380,
    protein: 14,
    carbs: 42,
    fat: 18,
    sugar: 3,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=100&q=80',
    stock: 142,
    soldCount: 88,
  },
  {
    id: 'prod-chicken',
    sku: 'NM-CKN-02',
    name: 'Ức Gà Sấy Giòn Vị Thảo Mộc',
    category: 'High-Protein',
    price: 65000,
    originalPrice: 75000,
    calo: 145,
    protein: 32,
    carbs: 0,
    fat: 2.5,
    sugar: 0,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=100&q=80',
    stock: 58,
    soldCount: 120,
  },
  {
    id: 'prod-peanut',
    sku: 'NM-PNT-03',
    name: 'Bơ Đậu Phộng Mịn Thuần Chay',
    category: 'Low-Carb',
    price: 120000,
    originalPrice: 140000,
    calo: 190,
    protein: 8,
    carbs: 6,
    fat: 16,
    sugar: 0.8,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=100&q=80',
    stock: 95,
    soldCount: 45,
  },
  {
    id: 'prod-bread',
    sku: 'NM-RYE-04',
    name: 'Bánh Mì Đen Lúa Mạch Nguyên Cám',
    category: 'Low-Carb',
    price: 55000,
    originalPrice: 65000,
    calo: 180,
    protein: 8,
    carbs: 32,
    fat: 2,
    sugar: 1,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=100&q=80',
    stock: 40,
    soldCount: 160,
  },
  {
    id: 'prod-konjac',
    sku: 'NM-KNJ-05',
    name: 'Mì Shirataki Konjac Ăn Kiêng',
    category: 'Sugar-Free',
    price: 32000,
    originalPrice: 38000,
    calo: 10,
    protein: 0,
    carbs: 2.5,
    fat: 0,
    sugar: 0,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=100&q=80',
    stock: 210,
    soldCount: 90,
  },
  {
    id: 'prod-protein-bar',
    sku: 'NM-BAR-06',
    name: 'Thanh Protein Bar Hạnh Nhân Socola',
    category: 'High-Protein',
    price: 45000,
    originalPrice: 55000,
    calo: 210,
    protein: 20,
    carbs: 18,
    fat: 8,
    sugar: 2,
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1622484216858-a5b4819779df?auto=format&fit=crop&w=100&q=80',
    stock: 80,
    soldCount: 110,
  },
];

export const INITIAL_ADMIN_CATEGORIES: AdminCategoryItem[] = [
  {
    id: 'cat-low-carb',
    code: 'CAT-01',
    name: 'Low-Carb',
    description: 'Giảm tinh bột tối đa, đốt mỡ tự nhiên và duy trì năng lượng bền bỉ cho người ăn Keto.',
    status: 'Hoạt động',
    createdAt: '15/10/2026',
    iconName: 'Flame',
  },
  {
    id: 'cat-high-protein',
    code: 'CAT-02',
    name: 'High-Protein',
    description: 'Ức gà, whey sạch, protein bars hỗ trợ phục hồi và phát triển cơ bắp tối ưu.',
    status: 'Hoạt động',
    createdAt: '18/10/2026',
    iconName: 'Dumbbell',
  },
  {
    id: 'cat-sugar-free',
    code: 'CAT-03',
    name: 'Sugar-Free',
    description: 'Ngọt dịu từ cỏ ngọt stevia, an toàn tuyệt đối cho đường huyết và kiểm soát cân nặng.',
    status: 'Hoạt động',
    createdAt: '22/10/2026',
    iconName: 'CandyOff',
  },
  {
    id: 'cat-snacks-nuts',
    code: 'CAT-04',
    name: 'Hạt dinh dưỡng',
    description: 'Hạt sấy mộc nguyên vị, granola giòn rụm cho bữa xế lành mạnh không lo béo ngậy.',
    status: 'Hoạt động',
    createdAt: '25/10/2026',
    iconName: 'Sparkles',
  },
  {
    id: 'cat-dairy',
    code: 'CAT-05',
    name: 'Sữa và sản phẩm từ sữa',
    description: 'Sữa chua Hy Lạp, phô mai tự nhiên giàu đạm và canxi cho xương khớp chắc khỏe.',
    status: 'Hoạt động',
    createdAt: '28/10/2026',
    iconName: 'Milk',
  },
  {
    id: 'cat-organic',
    code: 'CAT-06',
    name: 'Rau củ sấy hữu cơ',
    description: 'Giữ trọn vi chất và vitamin từ nông trại hữu cơ chuẩn VietGAP & GlobalGAP.',
    status: 'Tạm ẩn',
    createdAt: '02/11/2026',
    iconName: 'Apple',
  },
];

export const useAdminStore = defineStore('admin', () => {
  const products = ref<AdminProductItem[]>([...INITIAL_ADMIN_PRODUCTS]);
  const categories = ref<AdminCategoryItem[]>([...INITIAL_ADMIN_CATEGORIES]);

  // Đếm số sản phẩm thực tế theo tên danh mục
  function getProductCountByCategory(categoryName: string): number {
    return products.value.filter(
      (p: AdminProductItem) => p.category?.trim().toLowerCase() === categoryName.trim().toLowerCase()
    ).length;
  }

  // Danh sách danh mục kèm số sản phẩm liên kết thực tế từ bảng products
  const categoriesWithCount = computed(() => {
    return categories.value.map((cat: AdminCategoryItem) => ({
      ...cat,
      productCount: getProductCountByCategory(cat.name),
    }));
  });

  // Danh sách tên các danh mục hoạt động dùng cho dropdown ở các trang khác
  const availableCategoryNames = computed(() => {
    return categories.value
      .filter((c: AdminCategoryItem) => c.status === 'Hoạt động')
      .map((c: AdminCategoryItem) => c.name);
  });

  // Thao tác với sản phẩm
  function addProduct(product: AdminProductItem) {
    products.value.unshift(product);
  }

  function updateProduct(product: AdminProductItem) {
    const idx = products.value.findIndex((p: AdminProductItem) => p.id === product.id);
    if (idx !== -1) {
      products.value[idx] = { ...product };
    }
  }

  function deleteProduct(productId: string) {
    products.value = products.value.filter((p: AdminProductItem) => p.id !== productId);
  }

  // Thao tác với danh mục
  function addCategory(category: AdminCategoryItem) {
    categories.value.push(category);
  }

  function updateCategory(category: AdminCategoryItem) {
    const idx = categories.value.findIndex((c) => c.id === category.id);
    if (idx !== -1) {
      categories.value[idx] = { ...category };
    }
  }

  function deleteCategory(categoryId: string) {
    categories.value = categories.value.filter((c) => c.id !== categoryId);
  }

  return {
    products,
    categories,
    categoriesWithCount,
    availableCategoryNames,
    getProductCountByCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
  };
});
