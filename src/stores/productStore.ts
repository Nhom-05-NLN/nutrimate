import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Product, Category, ProductFilterQuery } from '../types';
import { fetchProducts, fetchCategories } from '../services/api';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const categories = ref<Category[]>([]);
  const selectedProduct = ref<Product | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const filter = ref<ProductFilterQuery>({
    category: 'all',
    search: '',
    maxCalories: undefined,
    minProtein: undefined,
  });

  async function loadCategories() {
    try {
      categories.value = await fetchCategories();
    } catch (err: unknown) {
      console.warn('Failed to load categories:', err);
    }
  }

  async function loadProducts() {
    isLoading.value = true;
    error.value = null;
    try {
      products.value = await fetchProducts(filter.value);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm';
      error.value = msg;
    } finally {
      isLoading.value = false;
    }
  }

  function setCategory(cat: string) {
    filter.value.category = cat;
    loadProducts();
  }

  function setSearch(query: string) {
    filter.value.search = query;
    loadProducts();
  }

  function setCalorieFilter(max?: number) {
    filter.value.maxCalories = max;
    loadProducts();
  }

  function setProteinFilter(min?: number) {
    filter.value.minProtein = min;
    loadProducts();
  }

  function resetFilter() {
    filter.value = {
      category: 'all',
      search: '',
      maxCalories: undefined,
      minProtein: undefined,
    };
    loadProducts();
  }

  function selectProduct(p: Product | null) {
    selectedProduct.value = p;
  }

  return {
    products,
    categories,
    selectedProduct,
    isLoading,
    error,
    filter,
    loadCategories,
    loadProducts,
    setCategory,
    setSearch,
    setCalorieFilter,
    setProteinFilter,
    resetFilter,
    selectProduct,
  };
});
