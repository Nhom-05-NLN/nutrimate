<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  FolderTree,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  EyeOff,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next';
import { useToastStore } from '../../stores/toastStore';
import type { AdminCategoryRecord as AdminCategoryItem } from '../../types';
import { fetchAdminCategories, saveAdminCategory, deleteAdminCategory } from '../../services/api';
import AdminCategoryCreateModal from '../../components/admin/AdminCategoryCreateModal.vue';
import AdminCategoryEditModal from '../../components/admin/AdminCategoryEditModal.vue';
import AdminCategoryDeleteModal from '../../components/admin/AdminCategoryDeleteModal.vue';
import AdminCategoryDetailModal, { type AdminCategoryItemWithCount } from '../../components/admin/AdminCategoryDetailModal.vue';

const toastStore = useToastStore();
const categories = ref<AdminCategoryItem[]>([]);
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);

async function loadCategories() {
  loading.value = true;
  loadError.value = '';
  try { categories.value = await fetchAdminCategories(); }
  catch (error) {
    categories.value = [];
    loadError.value = error instanceof Error ? error.message : 'Không thể tải danh mục.';
  } finally { loading.value = false; }
}
onMounted(loadCategories);

// Tiêu chí tìm kiếm & bộ lọc
const searchQuery = ref('');

// Thống kê từ danh mục và sản phẩm trong PostgreSQL.
const totalCategoriesCount = computed(() => categories.value.length);
const visibleCategoriesCount = computed(() => categories.value.filter(category => category.status).length);
const hiddenCategoriesCount = computed(() => categories.value.filter(category => !category.status).length);

// Lọc danh mục đã tải từ API.
const filteredCategories = computed<AdminCategoryItemWithCount[]>(() => {
  return categories.value.filter((cat) => {
    // 1. Search Query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchCode = (cat.code || '').toLowerCase().includes(q);
      const matchName = cat.name.toLowerCase().includes(q);
      const matchDesc = cat.description.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchDesc) return false;
    }

    return true;
  });
});

// PHÂN TRANG (PAGINATION)
const currentPage = ref(1);
const itemsPerPage = ref(5); // 5 danh mục mỗi trang

// Reset về trang 1 khi lọc hoặc tìm kiếm
watch(searchQuery, () => {
  currentPage.value = 1;
});

const totalPages = computed(() => {
  return Math.ceil(filteredCategories.value.length / itemsPerPage.value) || 1;
});

watch(totalPages, (pages) => { currentPage.value = Math.min(currentPage.value, pages); });

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredCategories.value.slice(start, start + itemsPerPage.value);
});

const startItemIndex = computed(() => {
  if (filteredCategories.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const endItemIndex = computed(() => {
  return Math.min(currentPage.value * itemsPerPage.value, filteredCategories.value.length);
});

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function resetFilters() {
  searchQuery.value = '';
  currentPage.value = 1;
}

// -------------------------------------------------------------
// 1. MODAL THÊM DANH MỤC MỚI
// -------------------------------------------------------------
const isCreateModalOpen = ref(false);

function openCreateModal() {
  isCreateModalOpen.value = true;
}

async function handleCreateSubmit(payload: { name: string; description: string; status: boolean }) {
  if (saving.value) return;
  saving.value = true;
  try {
    await saveAdminCategory(payload);
    isCreateModalOpen.value = false;
    toastStore.show('Thêm danh mục thành công!', 'success', payload.name);
    await loadCategories();
  } catch (error) { toastStore.show(error instanceof Error ? error.message : 'Không thể lưu danh mục.', 'error'); }
  finally { saving.value = false; }
}

// -------------------------------------------------------------
// 2. MODAL CHỈNH SỬA DANH MỤC
// -------------------------------------------------------------
const isEditModalOpen = ref(false);
const categoryToEdit = ref<AdminCategoryItem | null>(null);

function openEditModal(category: AdminCategoryItem) {
  categoryToEdit.value = category;
  isEditModalOpen.value = true;
}

async function handleEditSubmit(payload: { name: string; description: string; status: boolean }) {
  if (!categoryToEdit.value || saving.value) return;
  saving.value = true;
  try {
    await saveAdminCategory(payload, categoryToEdit.value.id);
    isEditModalOpen.value = false;
    toastStore.show('Cập nhật danh mục thành công!', 'success', payload.name);
    await loadCategories();
  } catch (error) { toastStore.show(error instanceof Error ? error.message : 'Không thể lưu danh mục.', 'error'); }
  finally { saving.value = false; }
}

// -------------------------------------------------------------
// 3. MODAL XÁC NHẬN XÓA DANH MỤC
// -------------------------------------------------------------
const isDeleteModalOpen = ref(false);
const categoryToDelete = ref<AdminCategoryItemWithCount | null>(null);

function openDeleteModal(category: AdminCategoryItemWithCount) {
  categoryToDelete.value = category;
  isDeleteModalOpen.value = true;
}

async function handleConfirmDelete() {
  if (!categoryToDelete.value || saving.value) return;
  saving.value = true;
  try {
    await deleteAdminCategory(categoryToDelete.value.id);
    isDeleteModalOpen.value = false;
    toastStore.show('Đã xóa danh mục thành công!', 'success', categoryToDelete.value.name);
    categoryToDelete.value = null;
    await loadCategories();
  } catch (error) { toastStore.show(error instanceof Error ? error.message : 'Không thể xóa danh mục.', 'error'); }
  finally { saving.value = false; }
}

// -------------------------------------------------------------
// 4. MODAL XEM CHI TIẾT DANH MỤC
// -------------------------------------------------------------
const isDetailModalOpen = ref(false);
const categoryToView = ref<AdminCategoryItemWithCount | null>(null);

function openDetailModal(category: AdminCategoryItemWithCount) {
  categoryToView.value = category;
  isDetailModalOpen.value = true;
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header with Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Quản lý Danh mục dinh dưỡng
        </h1>
        <p class="text-xs text-[#7A866E] mt-1">
          Tổ chức và phân loại sản phẩm theo từng nhóm thực phẩm.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          :disabled="loading || !!loadError"
          class="px-4 py-2.5 rounded-2xl bg-[#536124] hover:bg-[#434F1D] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus class="w-4 h-4 stroke-[2.5]" />
          <span>Thêm danh mục mới</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <!-- Thẻ 1: Tổng số danh mục -->
      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng số danh mục</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#536124] flex items-center justify-center">
            <FolderTree class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">{{ loading || loadError ? '-' : totalCategoriesCount }} <span class="text-xs font-normal">danh mục</span></div>
      </div>

      <!-- Thẻ 2: Đang hiển thị -->
      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đang hiển thị</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-emerald-700">{{ loading || loadError ? '-' : visibleCategoriesCount }} <span class="text-xs font-normal">danh mục</span></div>
      </div>

      <!-- Thẻ 3: Đang ẩn -->
      <div class="bg-white p-5 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Đang ẩn</span>
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <EyeOff class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-amber-700">{{ loading || loadError ? '-' : hiddenCategoriesCount }} <span class="text-xs font-normal">danh mục</span></div>
      </div>
    </div>

    <!-- Main Table Card -->
    <div class="bg-white rounded-3xl border border-[#E3E8DC] shadow-2xs overflow-hidden">
      <!-- Search & Filters Toolbar -->
      <div class="p-5 border-b border-[#ECEFE7] flex flex-col md:flex-row items-center gap-4">
        <div class="relative w-full md:w-80">
          <Search class="w-4 h-4 text-[#7A866E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm theo mã danh mục, tên, mô tả..."
            class="w-full pl-10 pr-4 py-2 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] text-xs text-[#2D3B1E] placeholder:text-stone-400 focus:outline-hidden focus:border-[#536124] transition-colors"
          />
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto flex-wrap">

          <button
            v-if="searchQuery"
            type="button"
            @click="resetFilters"
            class="px-3 py-2 rounded-xl text-xs font-bold text-[#536124] hover:bg-[#EBF1E6] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      <p v-if="loading" class="py-10 text-center text-sm text-[#7A866E]">Đang tải danh mục...</p>
      <div v-else-if="loadError" role="alert" class="p-5 text-sm text-rose-600">
        {{ loadError }} <button type="button" class="ml-2 underline" @click="loadCategories">Thử lại</button>
      </div>
      <!-- Categories Data Table -->
      <div v-if="!loading && !loadError" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
            <tr>
              <th class="py-3 px-3 text-center">Mã danh mục</th>
              <th class="py-3 px-4 text-center">Tên danh mục</th>
              <th class="py-3 px-5 text-center">Mô tả</th>
              <th class="py-3 px-3 text-center">Số sản phẩm</th>
              <th class="py-3 px-3 text-center">Trạng thái</th>
              <th class="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F0F3EC]">
            <tr
              v-for="cat in paginatedCategories"
              :key="cat.id"
              class="hover:bg-[#FAF9F5] transition-colors group"
            >
              <!-- Cột 1: Mã danh mục -->
              <td class="py-3.5 px-3 text-center">
                <span class="text-xs font-mono bg-[#EBF1E6] font-semibold text-[#536124] px-2 py-1 rounded-lg">
                  {{ cat.code || cat.id }}
                </span>
              </td>

              <!-- Cột 2: Tên danh mục -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2.5">
                  <span class="font-bold text-[#2D3B1E] text-xs group-hover:text-[#536124] transition-colors">
                    {{ cat.name }}
                  </span>
                </div>
              </td>

              <!-- Cột 3: Mô tả -->
              <td class="py-3.5 px-5">
                <p class="text-xs text-[#576449] line-clamp-2 max-w-md leading-relaxed" :title="cat.description">
                  {{ cat.description }}
                </p>
              </td>

              <!-- Cột 4: Số sản phẩm liên kết từ kho thực tế -->
              <td class="py-3.5 px-3 text-center">
                <span
                  class="font-bold px-2.5 py-1 rounded-full text-[11px] border"
                  :class="(cat.productCount || 0) > 0 ? 'bg-[#FAF9F5] text-[#2D3B1E] border-[#E3E8DC]' : 'bg-stone-50 text-stone-400 border-stone-200'"
                >
                  {{ cat.productCount || 0 }}
                </span>
              </td>

              <td class="py-3.5 px-3 text-center">
                <span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold" :class="cat.status ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'">
                  <component :is="cat.status ? Eye : EyeOff" class="h-3 w-3" />
                  {{ cat.status ? 'Đang hiển thị' : 'Đang ẩn' }}
                </span>
              </td>

              <!-- Cột 6: Thao tác -->
              <td class="py-3.5 px-3 text-center space-x-1">
                <button
                  type="button"
                  @click="openDetailModal(cat)"
                  class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#536124] hover:bg-[#EBF7E5] cursor-pointer transition-colors"
                  title="Xem chi tiết danh mục"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  @click="openEditModal(cat)"
                  class="p-1.5 rounded-lg text-[#7A866E] hover:text-[#536124] hover:bg-[#EBF7E5] cursor-pointer transition-colors"
                  title="Chỉnh sửa thông tin"
                >
                  <Edit class="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  @click="openDeleteModal(cat)"
                  class="p-1.5 rounded-lg text-[#7A866E] hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Xóa danh mục"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="filteredCategories.length === 0">
              <td colspan="6" class="py-12 text-center text-[#7A866E]">
                <FolderTree class="w-8 h-8 mx-auto text-stone-300 mb-2 stroke-[1.5]" />
                <p class="font-bold text-[#2D3B1E]">Không tìm thấy danh mục nào phù hợp</p>
                <p class="text-xs text-[#7A866E] mt-1">Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Toolbar (Thanh phân trang) -->
      <div
        v-if="!loading && !loadError && filteredCategories.length > 0"
        class="p-4 border-t border-[#ECEFE7] bg-[#FAF9F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <span class="text-[#7A866E] font-medium">
          Hiển thị <strong>{{ startItemIndex }} - {{ endItemIndex }}</strong> trong tổng số <strong>{{ filteredCategories.length }}</strong> danh mục
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
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              @click="goToPage(page)"
              class="w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
              :class="page === currentPage ? 'bg-[#536124] text-white shadow-xs' : 'bg-white border border-[#CCD7BC] text-[#2D3B1E] hover:bg-[#FAF9F5]'"
            >
              {{ page }}
            </button>
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

    <!-- 1. MODAL THÊM DANH MỤC MỚI -->
    <AdminCategoryCreateModal
      v-model="isCreateModalOpen"
      :existing-categories="categories"
      :saving="saving"
      @submit="handleCreateSubmit"
    />

    <!-- 2. MODAL CHỈNH SỬA DANH MỤC -->
    <AdminCategoryEditModal
      v-model="isEditModalOpen"
      :category="categoryToEdit"
      :existing-categories="categories"
      :saving="saving"
      @submit="handleEditSubmit"
    />

    <!-- 3. MODAL XÁC NHẬN XÓA DANH MỤC -->
    <AdminCategoryDeleteModal
      v-model="isDeleteModalOpen"
      :category="categoryToDelete"
      :saving="saving"
      @confirm="handleConfirmDelete"
    />

    <!-- 4. MODAL XEM CHI TIẾT DANH MỤC -->
    <AdminCategoryDetailModal
      v-model="isDetailModalOpen"
      :category="categoryToView"
      @edit="openEditModal"
    />
  </div>
</template>
