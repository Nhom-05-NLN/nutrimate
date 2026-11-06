<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fetchProductSalesSummary } from '../../services/api';
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
} from 'lucide-vue-next';
import { useToastStore } from '../../stores/toastStore';
import { useAdminStore } from '../../stores/adminStore';
import AdminProductDetailModal, { AdminProductItem } from '../../components/admin/AdminProductDetailModal.vue';
import AdminProductFormModal from '../../components/admin/AdminProductFormModal.vue';
import AdminProductDeleteModal from '../../components/admin/AdminProductDeleteModal.vue';

const toastStore = useToastStore();
const adminStore = useAdminStore();
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

// Danh mục lấy động từ Admin Store
const availableCategories = computed(() => adminStore.availableCategoryNames);

// Danh sách sản phẩm liên kết với Admin Store
const products = computed(() => adminStore.products);

// Danh sách sản phẩm sau lọc
const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategoryFilter.value === 'all' || p.category === selectedCategoryFilter.value;

    const matchesStatus =
      selectedStatusFilter.value === 'all' || p.status === selectedStatusFilter.value;

    return matchesSearch && matchesCategory && matchesStatus;
  });
});

// Thống kê nhanh
const totalProductsCount = computed(() => products.value.length);
const activeProductsCount = computed(() => products.value.filter((p) => p.status === 'Đang bán').length);
const totalSoldProductsCount = ref<number | null>(null);
const salesLoading = ref(true);
const salesError = ref(false);

async function loadSalesSummary() {
  salesLoading.value = true;
  salesError.value = false;
  try {
    totalSoldProductsCount.value = await fetchProductSalesSummary();
  } catch {
    salesError.value = true;
  } finally {
    salesLoading.value = false;
  }
}

onMounted(loadSalesSummary);

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

function handleFormSubmit(payload: Omit<AdminProductItem, 'id'>) {
  if (formModalMode.value === 'create') {
    const newProduct: AdminProductItem = {
      id: `prod-${Date.now()}`,
      ...payload,
    };
    adminStore.addProduct(newProduct);
    toastStore.show('Thêm sản phẩm thành công!', 'success', newProduct.name);
  } else if (formModalMode.value === 'edit' && selectedProductForForm.value) {
    adminStore.updateProduct({
      id: selectedProductForForm.value.id,
      ...payload,
    });
    toastStore.show('Cập nhật sản phẩm thành công!', 'success', payload.name);
  }
}

// TRẠNG THÁI MODAL XÓA SẢN PHẨM
const isDeleteModalOpen = ref(false);
const productToDelete = ref<AdminProductItem | null>(null);

function openDeleteModal(prod: AdminProductItem) {
  productToDelete.value = prod;
  isDeleteModalOpen.value = true;
}

function handleConfirmDelete(prod: AdminProductItem) {
  adminStore.deleteProduct(prod.id);
  productToDelete.value = null;
  toastStore.show('Xóa sản phẩm thành công!', 'success', prod.name);
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
          class="px-4 py-2.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus class="w-4 h-4 stroke-[2.5]" />
          <span>Thêm sản phẩm mới</span>
        </button>
      </div>
    </div>

    <!-- Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng số sản phẩm</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
            <Package class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">{{ totalProductsCount }} <span class="text-xs font-normal">sản phẩm</span></div>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đang kinh doanh</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-emerald-700">{{ activeProductsCount }} <span class="text-xs font-normal">sản phẩm</span></div>
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
        <div v-else class="font-heading text-2xl font-black text-[#536124]">{{ totalSoldProductsCount?.toLocaleString('vi-VN') }} sản phẩm</div>
      </div>
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
              <option v-for="cat in availableCategories" :key="cat" :value="cat">
                {{ cat }}
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

      <!-- Table Content -->
      <div class="overflow-x-auto">
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
              v-for="item in filteredProducts"
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
                {{ item.stock ?? 0 }}
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
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL THÊM / SỬA SẢN PHẨM -->
    <AdminProductFormModal
      v-model="isFormModalOpen"
      :mode="formModalMode"
      :initial-data="selectedProductForForm"
      :categories="availableCategories"
      @submit="handleFormSubmit"
    />

    <!-- MODAL XÁC NHẬN XÓA -->
    <AdminProductDeleteModal
      v-model="isDeleteModalOpen"
      :product="productToDelete"
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
