<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { fetchAdminProducts, saveAdminProduct, deleteAdminProduct } from '../../services/api';
import {
  Package,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  CheckCircle2,
  ShoppingBag,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PackageX,
  AlertTriangle,
} from 'lucide-vue-next';
import { useToastStore } from '../../stores/toastStore';
import AdminProductDetailModal, { AdminProductItem } from '../../components/admin/AdminProductDetailModal.vue';
import AdminProductFormModal from '../../components/admin/AdminProductFormModal.vue';
import AdminProductDeleteModal from '../../components/admin/AdminProductDeleteModal.vue';

const toastStore = useToastStore();
const products = ref<AdminProductItem[]>([]);
const availableCategories = ref<{ id: string; name: string }[]>([]);
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const searchQuery = ref('');
const selectedCategoryFilter = ref('all');
const selectedStatusFilter = ref('all');

function resetFilters() {
  searchQuery.value = '';
  selectedCategoryFilter.value = 'all';
  selectedStatusFilter.value = 'all';
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Danh sách sản phẩm sau lọc
const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategoryFilter.value === 'all' || p.categoryId === selectedCategoryFilter.value;

    const matchesStatus =
      selectedStatusFilter.value === 'all' || p.status === selectedStatusFilter.value;

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    const aStock = a.stock ?? 0;
    const bStock = b.stock ?? 0;
    const aLowStock = aStock > 0 && aStock <= 10;
    const bLowStock = bStock > 0 && bStock <= 10;
    if (aLowStock !== bLowStock) return aLowStock ? -1 : 1;
    return aLowStock ? aStock - bStock : 0;
  });
});

const currentPage = ref(1);
const itemsPerPage = 8;
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / itemsPerPage)));
const paginationItems = computed(() => {
  const pages = [...new Set([1, currentPage.value - 1, currentPage.value, currentPage.value + 1, totalPages.value])]
    .filter(page => page >= 1 && page <= totalPages.value)
    .sort((a, b) => a - b);
  const items: (number | '…')[] = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous === 2) items.push(previous + 1);
    else if (previous && page - previous > 2) items.push('…');
    items.push(page);
    previous = page;
  }
  return items;
});
const paginatedProducts = computed(() =>
  filteredProducts.value.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage)
);
const startItemIndex = computed(() => filteredProducts.value.length ? (currentPage.value - 1) * itemsPerPage + 1 : 0);
const endItemIndex = computed(() => Math.min(currentPage.value * itemsPerPage, filteredProducts.value.length));

watch([searchQuery, selectedCategoryFilter, selectedStatusFilter], () => {
  currentPage.value = 1;
});
watch(totalPages, (pages) => {
  currentPage.value = Math.min(currentPage.value, pages);
});

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page;
}

// Thống kê nhanh
const totalProductsCount = computed(() => products.value.length);
const activeProductsCount = computed(() => products.value.filter((p) => p.status === 'Đang bán').length);
const outOfStockCount = computed(() => products.value.filter((product) => (product.stock ?? 0) <= 0).length);
const lowStockCount = computed(() => products.value.filter((product) => {
  const stock = product.stock ?? 0;
  return stock > 0 && stock <= 10;
}).length);
const totalSoldProductsCount = ref<number | null>(null);
const salesLoading = ref(true);
const salesError = ref(false);

async function loadProducts() {
  loading.value = true;
  salesLoading.value = true;
  loadError.value = '';
  salesError.value = false;
  try {
    const data = await fetchAdminProducts();
    products.value = data.products;
    availableCategories.value = data.categories;
    totalSoldProductsCount.value = data.totalSold;
  } catch (error) {
    products.value = [];
    availableCategories.value = [];
    salesError.value = true;
    loadError.value = error instanceof Error ? error.message : 'Không thể tải sản phẩm.';
  } finally {
    loading.value = false;
    salesLoading.value = false;
  }
}

onMounted(loadProducts);

// TRẠNG THÁI MODAL THÊM / SỬA 
const isFormModalOpen = ref(false);
const formModalMode = ref<'create' | 'edit'>('create');
const selectedProductForForm = ref<AdminProductItem | null>(null);

function openCreateModal() {
  formModalMode.value = 'create';
  selectedProductForForm.value = null;
  isFormModalOpen.value = true;
}

function openEditModal(prod: AdminProductItem) {
  formModalMode.value = 'edit';
  selectedProductForForm.value = prod;
  isFormModalOpen.value = true;
}

async function handleFormSubmit(payload: Omit<AdminProductItem, 'id'>) {
  if (saving.value) return;
  saving.value = true;
  try {
    await saveAdminProduct(payload, formModalMode.value === 'edit' ? selectedProductForForm.value?.id : undefined);
    isFormModalOpen.value = false;
    toastStore.show('Đã lưu sản phẩm thành công!', 'success', payload.name);
    await loadProducts();
  } catch (error) {
    toastStore.show(error instanceof Error ? error.message : 'Không thể lưu sản phẩm.', 'error');
  } finally { saving.value = false; }
}

// TRẠNG THÁI MODAL XÓA SẢN PHẨM
const isDeleteModalOpen = ref(false);
const productToDelete = ref<AdminProductItem | null>(null);

function openDeleteModal(prod: AdminProductItem) {
  productToDelete.value = prod;
  isDeleteModalOpen.value = true;
}

async function handleConfirmDelete(product: AdminProductItem) {
  if (saving.value) return;
  saving.value = true;
  try {
    await deleteAdminProduct(product.id);
    isDeleteModalOpen.value = false;
    productToDelete.value = null;
    toastStore.show('Đã xóa sản phẩm thành công!', 'success', product.name);
    await loadProducts();
  } catch (error) {
    toastStore.show(error instanceof Error ? error.message : 'Không thể xóa sản phẩm.', 'error');
  } finally { saving.value = false; }
}

// TRẠNG THÁI MODAL XEM CHI TIẾT SẢN PHẨM
const isDetailModalOpen = ref(false);
const productToView = ref<AdminProductItem | null>(null);

function openDetailModal(prod: AdminProductItem) {
  productToView.value = prod;
  isDetailModalOpen.value = true;
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header with Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Quản lý Sản phẩm dinh dưỡng
        </h1>
        <p class="text-xs text-[#7A866E] mt-1">
          Quản lý danh sách sản phẩm, giá bán, trạng thái kinh doanh và các thông tin dinh dưỡng.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          :disabled="loading || !!loadError || !availableCategories.length"
          class="px-4 py-2.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus class="w-4 h-4 stroke-[2.5]" />
          <span>Thêm sản phẩm mới</span>
        </button>
      </div>
    </div>

    <!-- Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng số sản phẩm</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
            <Package class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">{{ loading || loadError ? '-' : totalProductsCount }} <span class="text-xs font-normal">sản phẩm</span></div>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đang kinh doanh</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-emerald-700">{{ loading || loadError ? '-' : activeProductsCount }} <span class="text-xs font-normal">sản phẩm</span></div>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Số sản phẩm đã bán</span>
          <div class="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <ShoppingBag class="w-4 h-4" />
          </div>
        </div>
        <div v-if="salesLoading" class="mt-2 text-xs text-[#7A866E]">Đang tải...</div>
        <div v-else-if="salesError" class="font-heading text-2xl font-black text-[#536124]">-</div>
        <div v-else class="font-heading text-2xl font-black text-[#536124]">{{ totalSoldProductsCount?.toLocaleString('vi-VN') }} <span class="text-xs font-normal">sản phẩm</span></div>
      </div>
      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đã hết hàng</span>
          <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <PackageX class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-rose-600">
          {{ loading || loadError ? '-' : outOfStockCount }} <span class="text-xs font-normal">sản phẩm</span>
        </div>
      </div>
    </div>

    <div
      v-if="!loading && !loadError && lowStockCount > 0"
      role="status"
      class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"
    >
      <AlertTriangle class="h-5 w-5 shrink-0" />
      <p>Có <strong>{{ lowStockCount }} sản phẩm sắp hết hàng</strong>, số lượng tồn kho còn từ 1 đến 10. Vui lòng kiểm tra và bổ sung hàng.</p>
    </div>

    <!-- Products Table & Filter Block -->
    <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs p-6 space-y-6">
      <!-- Search & Filters Bar -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <!-- Ô Tìm kiếm -->
          <div class="relative w-full sm:w-64">
            <Search class="w-4 h-4 text-[#7A866E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm theo tên sản phẩm, SKU..."
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] text-xs text-[#2D3B1E] placeholder:text-stone-400 focus:outline-hidden focus:border-[#536124] transition-colors"
            />
          </div>

          <!-- Lọc danh mục -->
          <div class="relative">
            <select
              v-model="selectedCategoryFilter"
              class="appearance-none pl-3 pr-9 py-2 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] text-xs text-[#2D3B1E] focus:outline-hidden focus:border-[#536124]"
            >
              <option value="all">Tất cả danh mục</option>
              <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <ChevronDown aria-hidden="true" class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A866E]" />
          </div>

          <!-- Lọc trạng thái -->
          <div class="relative">
            <select
              v-model="selectedStatusFilter"
              class="appearance-none pl-3 pr-9 py-2 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] text-xs text-[#2D3B1E] focus:outline-hidden focus:border-[#536124]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Đang bán">Đang bán</option>
              <option value="Tạm ngừng">Tạm ngừng</option>
            </select>
            <ChevronDown aria-hidden="true" class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A866E]" />
          </div>
        </div>

        <button
          v-if="searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all'"
          type="button"
          @click="resetFilters"
          class="px-3 py-2 rounded-xl text-xs font-bold text-[#536124] hover:bg-[#EBF1E6] flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Đặt lại</span>
        </button>
      </div>

      <p v-if="loading" class="py-8 text-center text-sm text-[#7A866E]">Đang tải sản phẩm...</p>
      <div v-else-if="loadError" role="alert" class="text-sm text-rose-600">
        {{ loadError }}
        <button type="button" class="ml-2 underline" @click="loadProducts">Thử lại</button>
      </div>
      <!-- Table Content -->
      <div v-if="!loading && !loadError" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
            <tr>
              <th class="py-3 px-3 text-center">Mã SKU</th>
              <th class="py-3 px-3 text-center">Tên sản phẩm</th>
              <th class="py-3 px-3 text-center">Danh mục</th>
              <th class="py-3 px-3 text-center">Giá bán</th>
              <th class="py-3 px-3 text-center">Tồn kho</th>
              <th class="py-3 px-3 text-center">Trạng thái</th>
              <th class="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F0F3EC]">
            <tr
              v-for="item in paginatedProducts"
              :key="item.id || item.sku"
              class="hover:bg-[#FAF9F5] transition-colors"
            >
              <!-- Cột 1: Mã SKU -->
              <td class="py-3.5 px-3">
                <span class="text-xs text-center font-mono bg-[#EBF1E6] font-semibold text-[#536124] px-2 py-1 rounded-lg">
                  {{ item.sku }}
                </span>
              </td>

              <!-- Cột 2: Tên sản phẩm -->
              <td class="py-3.5 px-3">
                <div class="flex items-center gap-2.5">
                  <div>
                    <h4 class="font-bold text-[#2D3B1E] text-xs">{{ item.name }}</h4>
                  </div>
                </div>
              </td>

              <td class="py-3.5 px-3 text-center">
                <span class="px-2 py-0.5 rounded-md bg-[#EBF1E6] text-[10px] font-semibold text-[#536124]">
                  {{ item.category }}
                </span>
              </td>

              <td class="py-3.5 px-3 font-bold  text-center text-[#2D3B1E]">
                <span>{{ formatVnd(item.price) }}</span>
              </td>

              <td class="py-3.5 px-3 text-center font-semibold text-[#2D3B1E]">
                <div class="flex flex-col items-center gap-1">
                  <span :class="(item.stock ?? 0) <= 0 ? 'text-rose-600' : (item.stock ?? 0) <= 10 ? 'text-amber-700' : ''">
                    {{ item.stock ?? 0 }}
                  </span>
                  <span v-if="(item.stock ?? 0) <= 0" class="whitespace-nowrap rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                    Đã hết hàng
                  </span>
                  <span v-else-if="(item.stock ?? 0) <= 10" class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <AlertTriangle aria-hidden="true" class="h-3 w-3" />
                    Sắp hết hàng
                  </span>
                </div>
              </td>

              <td class="py-3.5 px-3 text-center">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  :class="item.status === 'Đang bán' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'"
                >
                  ● {{ item.status }}
                </span>
              </td>

              <td class="py-3.5 px-3 text-center space-x-1">
                <button
                  type="button"
                  @click="openDetailModal(item)"
                  class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#536124] hover:bg-[#EBF7E5] cursor-pointer"
                  title="Xem chi tiết sản phẩm"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="openEditModal(item)"
                  class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#536124] hover:bg-[#EBF7E5] cursor-pointer"
                  title="Chỉnh sửa thông tin"
                >
                  <Edit class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="openDeleteModal(item)"
                  class="p-1.5 rounded-lg text-[#7A866E] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Xóa sản phẩm"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
            <tr v-if="!filteredProducts.length"><td colspan="7" class="py-10 text-center text-[#7A866E]">Không có sản phẩm phù hợp.</td></tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!loading && !loadError && filteredProducts.length > 0"
        class="p-4 border-t border-[#ECEFE7] bg-[#FAF9F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <span class="text-[#7A866E] font-medium">
          Hiển thị <strong>{{ startItemIndex }} - {{ endItemIndex }}</strong> trong tổng số <strong>{{ filteredProducts.length }}</strong> sản phẩm
        </span>

        <div class="flex items-center gap-1.5">
          <!-- Nút Trang trước -->
          <button
            type="button"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
            class="w-8 h-8 rounded-xl border border-[#CCD7BC] bg-white flex items-center justify-center text-[#536124] hover:bg-[#EBF1E6] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <!-- Nút số trang -->
          <div class="flex items-center gap-1">
            <template v-for="(page, index) in paginationItems" :key="`${page}-${index}`">
              <span v-if="page === '…'" class="w-8 h-8 flex items-center justify-center text-[#7A866E]" aria-hidden="true">…</span>
              <button
              v-else
              type="button"
              @click="goToPage(page)"
              :aria-label="`Trang ${page}`"
              :aria-current="page === currentPage ? 'page' : undefined"
              class="w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
              :class="page === currentPage ? 'bg-[#536124] text-white shadow-xs' : 'bg-white border border-[#CCD7BC] text-[#2D3B1E] hover:bg-[#FAF9F5]'"
            >
              {{ page }}
            </button>
            </template>
          </div>

          <!-- Nút Trang sau -->
          <button
            type="button"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
            class="w-8 h-8 rounded-xl border border-[#CCD7BC] bg-white flex items-center justify-center text-[#536124] hover:bg-[#EBF1E6] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Trang tiếp theo"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL THÊM / SỬA SẢN PHẨM -->
    <AdminProductFormModal
      v-model="isFormModalOpen"
      :mode="formModalMode"
      :initial-data="selectedProductForForm"
      :categories="availableCategories"
      :saving="saving"
      @submit="handleFormSubmit"
    />

    <!-- MODAL XÁC NHẬN XÓA -->
    <AdminProductDeleteModal
      v-model="isDeleteModalOpen"
      :product="productToDelete"
      :saving="saving"
      @confirm="handleConfirmDelete"
    />

    <!-- MODAL XEM CHI TIẾT SẢN PHẨM -->
    <AdminProductDetailModal
      v-model="isDetailModalOpen"
      :product="productToView"
      @edit="openEditModal"
    />
  </div>
</template>
