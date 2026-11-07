import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Product, Category, ProductFilterQuery } from '../types';
import { fetchProducts, fetchCategories } from '../services/api';

export const FIGMA_SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-granola',
    code: 'NM-GRN-01',
    name: 'Granola Yến Mạch Hạt Dinh Dưỡng Siêu Hạt 500g',
    category: 'snacks-nuts',
    categoryName: 'Hạt dinh dưỡng',
    price: 185000,
    originalPrice: 215000,
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
    description: 'Granola nướng mật ong tự nhiên, giàu hạnh nhân, macca, óc chó và yến mạch nguyên cám.',
    ingredients: ['Yến mạch Úc 45%', 'Hạnh nhân 15%', 'Óc chó 10%', 'Hạt điều 10%', 'Mật ong hoa nhãn'],
    nutrition: {
      servingSize: '500g',
      calories: 380,
      protein: 14,
      carbs: 28,
      fat: 12,
      sugar: 3,
    },
    stock: 142,
    rating: 4.9,
    reviewCount: 124,
    badges: ['Keto Friendly', 'Giàu Chất Xơ'],
    portions: [
      { label: 'Hũ 500g', weight: '500g', price: 185000, inStock: true, savingBadge: 'Tiết kiệm 15%' },
      { label: 'Hũ 250g', weight: '250g', price: 105000, inStock: true },
      { label: 'Túi refill 1000g', weight: '1000g', price: 330000, inStock: true, savingBadge: 'Tiết kiệm 25%' },
    ],
    isFeatured: true,
    bestFor: 'Bữa sáng & Ăn xế thanh sạch',
  },
  {
    id: 'prod-chicken',
    code: 'NM-CKN-02',
    name: 'Ức Gà Sấy Vị Thảo Mộc Tự Nhiên 200g',
    category: 'high-protein',
    categoryName: 'Thịt sấy sạch',
    price: 110000,
    originalPrice: 135000,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
    description: 'Ức gà phi lê nướng giòn không dầu, tẩm ướp thảo mộc hương thơm tự nhiên, 0g đường.',
    ingredients: ['Ức gà phi lê 98%', 'Thảo mộc tự nhiên', 'Muối hồng'],
    nutrition: {
      servingSize: '200g',
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
    portions: [
      { label: 'Gói 200g', weight: '200g', price: 110000, inStock: true },
      { label: 'Combo 3 gói (600g)', weight: '600g', price: 310000, inStock: true, savingBadge: 'Tiết kiệm 20k' },
    ],
    isFeatured: true,
    bestFor: 'Gymer nạp đạm siết cơ',
  },
  {
    id: 'prod-bar',
    code: 'NM-BAR-03',
    name: 'Thanh Protein Bar Socola Hạnh Nhân NutriFit',
    category: 'high-protein',
    categoryName: 'Snack thể thao',
    price: 42000,
    originalPrice: 50000,
    image: 'https://images.unsplash.com/photo-1622484216858-a5b4819779df?auto=format&fit=crop&w=600&q=80',
    description: 'Thanh dinh dưỡng giàu whey isolate và hạt giòn, nạp 20g protein tiện lợi.',
    ingredients: ['Whey Isolate', 'Hạnh nhân', 'Socola đen nguyên chất'],
    nutrition: {
      servingSize: '60g',
      calories: 210,
      protein: 20,
      carbs: 16,
      fat: 7,
      sugar: 1.2,
    },
    stock: 88,
    rating: 4.8,
    reviewCount: 89,
    badges: ['Keto Friendly', 'Ít Đường'],
    isFeatured: true,
    bestFor: 'Nạp năng lượng tập luyện',
  },
  {
    id: 'prod-rye-bread',
    code: 'NM-RYE-04',
    name: 'Bánh Mì Đen Lúa Mạch Nguyên Cám',
    category: 'low-carb',
    categoryName: 'Bánh ăn kiêng',
    price: 55000,
    originalPrice: 70000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    description: 'Bánh mì đen lúa mạch nguyên cám lên men tự nhiên, chỉ số đường huyết GI thấp.',
    ingredients: ['Bột lúa mạch đen', 'Men tự nhiên', 'Nước tinh khiết', 'Muối'],
    nutrition: {
      servingSize: '450g',
      calories: 180,
      protein: 8,
      carbs: 26,
      fat: 1.2,
      sugar: 1,
    },
    stock: 58,
    rating: 4.9,
    reviewCount: 176,
    badges: ['Low-Carb', 'Thuần chay'],
    isFeatured: true,
    bestFor: 'Bữa sáng Eat Clean',
  },
  {
    id: 'prod-cashew',
    code: 'NM-CSH-05',
    name: 'Hạt Điều Rang Củi Không Muối Hữu Cơ',
    category: 'snacks-nuts',
    categoryName: 'Hạt dinh dưỡng',
    price: 165000,
    originalPrice: 195000,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80',
    description: 'Hạt điều Bình Phước rang củi truyền thống nguyên vị bùi béo tự nhiên.',
    ingredients: ['Hạt điều hữu cơ 100%'],
    nutrition: {
      servingSize: '500g',
      calories: 310,
      protein: 11,
      carbs: 18,
      fat: 22,
      sugar: 2,
    },
    stock: 95,
    rating: 4.9,
    reviewCount: 95,
    badges: ['Keto Friendly', 'Không muối'],
    isFeatured: true,
    bestFor: 'Bổ sung chất béo tốt',
  },
  {
    id: 'prod-peanut',
    code: 'NM-PNT-06',
    name: 'Bơ Đậu Phộng Mịn Thuần Chay 350g',
    category: 'low-carb',
    categoryName: 'Bơ hạt',
    price: 89000,
    originalPrice: 110000,
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
    description: 'Đậu phộng sẻ thuần chủng rang mộc nghiền mịn không thêm đường hay dầu cọ.',
    ingredients: ['Đậu phộng sẻ 100%'],
    nutrition: {
      servingSize: '350g',
      calories: 190,
      protein: 8,
      carbs: 6,
      fat: 16,
      sugar: 0.8,
    },
    stock: 84,
    rating: 4.7,
    reviewCount: 142,
    badges: ['0g Sugar', 'Keto Friendly'],
    portions: [
      { label: 'Hũ 350g', weight: '350g', price: 89000, inStock: true },
      { label: 'Hũ 500g', weight: '500g', price: 120000, inStock: true, savingBadge: 'Tiết kiệm 15%' },
    ],
    isFeatured: true,
    bestFor: 'Ăn kèm bánh mì đen & smoothie',
  },
  {
    id: 'prod-seaweed',
    code: 'NM-SWD-07',
    name: 'Snack Rong Biển Kẹp Hạt Dinh Dưỡng',
    category: 'snacks-nuts',
    categoryName: 'Snack healthy',
    price: 75000,
    originalPrice: 90000,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    description: 'Lá rong biển nướng giòn rụm kẹp hạt bí, hạnh nhân và mè trắng giàu khoáng chất.',
    ingredients: ['Rong biển Hàn Quốc', 'Hạnh nhân', 'Hạt bí xanh', 'Mè trắng'],
    nutrition: {
      servingSize: '150g',
      calories: 120,
      protein: 6,
      carbs: 8,
      fat: 4,
      sugar: 0,
    },
    stock: 67,
    rating: 4.9,
    reviewCount: 67,
    badges: ['Low-Calorie', 'Vegan'],
    isFeatured: true,
    bestFor: 'Snack văn phòng',
  },
  {
    id: 'prod-shirataki',
    code: 'NM-SHR-08',
    name: 'Mì Shirataki Konjac Không Tinh Bột',
    category: 'low-carb',
    categoryName: 'Thực phẩm Konjac',
    price: 35000,
    originalPrice: 45000,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    description: 'Sợi mì củ nưa Konjac gần như 0 calo, giàu chất xơ glucomannan no lâu.',
    ingredients: ['Bột củ nưa Konjac', 'Nước vôi tôi tự nhiên'],
    nutrition: {
      servingSize: '200g',
      calories: 10,
      protein: 0,
      carbs: 2.3,
      fat: 0,
      sugar: 0,
    },
    stock: 112,
    rating: 4.8,
    reviewCount: 112,
    badges: ['Zero-Calorie', 'Keto Star'],
    isFeatured: true,
    bestFor: 'Thay thế bún phở truyền thống',
  },
];

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>(FIGMA_SEED_PRODUCTS);
  const totalProducts = ref<number>(FIGMA_SEED_PRODUCTS.length);
  const currentPage = ref<number>(1);
  const pageSize = ref<number>(8);
  const totalPages = ref<number>(Math.ceil(FIGMA_SEED_PRODUCTS.length / pageSize.value));

  const categories = ref<Category[]>([
    { id: 'low-carb', name: 'Low-Carb & KETO', slug: 'low-carb', description: 'Ít tinh bột, giàu chất xơ', dietType: 'low-carb', count: 18 },
    { id: 'high-protein', name: 'High-Protein', slug: 'high-protein', description: 'Giàu đạm siết cơ', dietType: 'high-protein', count: 22 },
    { id: 'sugar-free', name: 'Sugar-Free', slug: 'sugar-free', description: '0g đường tinh luyện', dietType: 'sugar-free', count: 15 },
    { id: 'snacks-nuts', name: 'Hạt dinh dưỡng', slug: 'snacks-nuts', description: 'Hạt nướng mộc & Granola', dietType: 'snacks-nuts', count: 14 },
  ]);
  const selectedProduct = ref<Product | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const filter = ref<ProductFilterQuery>({
    category: 'all',
    search: '',
    maxCalories: undefined,
    minProtein: undefined,
    page: 1,
    limit: pageSize.value,
    sort: 'newest',
  });

  async function loadCategories() {
    try {
      const data = await fetchCategories();
      if (data) {
        categories.value = data;
      }
    } catch {
      // Fallback to initial categories
    }
  }

  async function loadProducts(page?: number) {
    if (page !== undefined && page > 0) {
      currentPage.value = page;
    }
    filter.value.page = currentPage.value;
    filter.value.limit = pageSize.value;

    isLoading.value = true;
    error.value = null;
    try {
      const result = await fetchProducts(filter.value);
      if (result && result.products.length > 0) {
        products.value = result.products;
        totalProducts.value = result.total;
        totalPages.value = result.totalPages;
        currentPage.value = result.page;
      }
    } catch {
      // Fallback to local FIGMA_SEED_PRODUCTS
      const offset = (currentPage.value - 1) * pageSize.value;
      const fallbackProducts = FIGMA_SEED_PRODUCTS.filter((product) =>
        filter.value.categories?.length
          ? filter.value.categories.includes(product.category)
          : !filter.value.category || filter.value.category === 'all' || product.category === filter.value.category
      );
      if (filter.value.sort === 'sold_desc') {
        fallbackProducts.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0) || a.id.localeCompare(b.id));
      }
      products.value = fallbackProducts.slice(offset, offset + pageSize.value);
      totalProducts.value = fallbackProducts.length;
      totalPages.value = Math.max(1, Math.ceil(fallbackProducts.length / pageSize.value));
    } finally {
      isLoading.value = false;
    }
  }

  function setPage(page: number) {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
      loadProducts(page);
    }
  }

  function nextPage() {
    if (currentPage.value < totalPages.value) {
      setPage(currentPage.value + 1);
    }
  }

  function prevPage() {
    if (currentPage.value > 1) {
      setPage(currentPage.value - 1);
    }
  }

  function setSort(sortOption: string) {
    filter.value.sort = sortOption;
    currentPage.value = 1;
    loadProducts(1);
  }

  function setCategories(categories: string[]) {
    filter.value.categories = [...categories];
    filter.value.category = 'all';
    currentPage.value = 1;
    loadProducts(1);
  }

  function setCategory(cat: string) {
    filter.value.categories = [];
    filter.value.category = cat;
    currentPage.value = 1;
    loadProducts(1);
  }

  function setSearch(query: string) {
    filter.value.search = query;
    currentPage.value = 1;
    loadProducts(1);
  }

  function setCalorieFilter(max?: number) {
    filter.value.maxCalories = max;
    currentPage.value = 1;
    loadProducts(1);
  }

  function setProteinFilter(min?: number) {
    filter.value.minProtein = min;
    currentPage.value = 1;
    loadProducts(1);
  }

  function resetFilter() {
    filter.value = {
      category: 'all',
      search: '',
      maxCalories: undefined,
      minProtein: undefined,
      page: 1,
      limit: pageSize.value,
      sort: 'newest',
    };
    currentPage.value = 1;
    loadProducts(1);
  }

  function selectProduct(p: Product | null) {
    selectedProduct.value = p;
  }

  function clearSelectedProduct() {
    selectedProduct.value = null;
  }

  return {
    products,
    totalProducts,
    currentPage,
    pageSize,
    totalPages,
    categories,
    selectedProduct,
    isLoading,
    error,
    filter,
    loadCategories,
    loadProducts,
    setPage,
    nextPage,
    prevPage,
    setSort,
    setCategory,
    setCategories,
    setSearch,
    setCalorieFilter,
    setProteinFilter,
    resetFilter,
    selectProduct,
    clearSelectedProduct,
  };
});
