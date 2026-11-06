<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Boxes,
  Search,
  ArrowDownToLine,
  PackageX,
  Package,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  RotateCcw,
} from 'lucide-vue-next';
import { useAdminStore } from '../../stores/adminStore';
import { useToastStore } from '../../stores/toastStore';
import ToastNotification from '../../components/common/ToastNotification.vue';

const toast = useToastStore();
const adminStore = useAdminStore();
const products = computed(() =>
  adminStore.products.map((product) => ({
    ...product,
    stock: product.stock ?? 0,
  })),
);
const search = ref('');
const category = ref('all');
const status = ref('all');
const page = ref(1);
const pageSize = 5;
const tab = ref<'stock' | 'history'>('stock');
const categories = computed(() => adminStore.categories);
const stockStatus = (product: { stock: number }) => (product.stock > 0 ? 'available' : 'out');
const statusLabel = (status: 'available' | 'out') =>
  ({ out: 'Hết hàng', available: 'Còn hàng' })[status];
const totalStock = computed(() => products.value.reduce((sum, product) => sum + product.stock, 0));
const outCount = computed(() => products.value.filter((p) => p.stock === 0).length);
const filtered = computed(() =>
  products.value.filter((p) => {
    const q = search.value.trim().toLowerCase();
    return (
      (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q)) &&
      (category.value === 'all' || p.category === category.value) &&
      (status.value === 'all' || stockStatus(p) === status.value)
    );
  }),
);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);
watch([search, category, status], () => {
  page.value = 1;
});
function goToPage(nextPage: number) {
  if (nextPage >= 1 && nextPage <= pages.value) page.value = nextPage;
}

function resetFilters() {
  search.value = '';
  category.value = 'all';
  status.value = 'all';
}
const money = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
const movements = ref<
  {
    id: number;
    name: string;
    code: string;
    quantity: number;
    before: number;
    after: number;
    note: string;
    date: string;
  }[]
>([]);
const modal = ref(false);
const productId = ref('');
const quantity = ref<number | string>(1);
const note = ref('');
const error = ref('');
const selected = computed(() => products.value.find((p) => p.id === productId.value));
function openMovement(id = '') {
  productId.value = id;
  quantity.value = 1;
  note.value = '';
  error.value = '';
  modal.value = true;
}
function submitMovement() {
  const p = selected.value;
  const amount = Number(quantity.value);
  error.value = '';
  if (!p) {
    error.value = 'Vui lòng chọn sản phẩm.';
    return;
  }
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    error.value = 'Số lượng phải là số nguyên lớn hơn 0.';
    return;
  }
  const after = p.stock + amount;
  if (!Number.isSafeInteger(after)) {
    error.value = 'Số lượng tồn kho vượt giới hạn cho phép.';
    return;
  }
  movements.value.unshift({
    id: Date.now(),
    name: p.name,
    code: p.sku,
    quantity: amount,
    before: p.stock,
    after,
    note: note.value.trim(),
    date: new Date().toLocaleString('vi-VN'),
  });
  adminStore.updateProduct({ ...p, stock: after });
  modal.value = false;
  toast.show('Nhập kho thành công!', 'success', `${p.name} · ${amount} sản phẩm`);
}
</script>

<template>
  <div class="space-y-6 text-[#2D3B1E]">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black">Quản lý tồn kho</h1>
        <p class="mt-1 text-xs text-[#7A866E]">
          Theo dõi số lượng và kiểm soát hoạt động nhập kho sản phẩm.
        </p>
      </div>
      <div class="flex gap-3">
        <button
          class="flex items-center justify-center gap-2 rounded-xl bg-[#536124] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#434F1D] cursor-pointer"
          @click="openMovement()"
        >
          <ArrowDownToLine class="h-4 w-4" />Nhập kho
        </button>
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="rounded-3xl border border-[#E3E8DC] bg-white p-5 shadow-2xs">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          Sản phẩm trong kho<Boxes class="h-5 w-5 text-[#536124]" />
        </div>
        <p class="mt-3 text-2xl font-black">
          {{ products.length }} <span class="text-xs font-normal">sản phẩm</span>
        </p>
      </div>
      <div class="rounded-3xl border border-[#E3E8DC] bg-white p-5 shadow-2xs">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          Tổng số lượng tồn<Package class="h-5 w-5 text-[#536124]" />
        </div>
        <p class="mt-3 text-2xl font-black">
          {{ totalStock.toLocaleString('vi-VN') }} <span class="text-xs font-normal">đơn vị</span>
        </p>
      </div>
      <div class="rounded-3xl border border-[#E3E8DC] bg-white p-5 shadow-2xs">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          Đã hết hàng<PackageX class="h-5 w-5 text-rose-600" />
        </div>
        <p class="mt-3 text-2xl font-black text-rose-600">
          {{ outCount }} <span class="text-xs font-normal">sản phẩm</span>
        </p>
      </div>
    </div>
    <div class="overflow-hidden rounded-3xl border border-[#E3E8DC] bg-white shadow-2xs">
      <div class="flex gap-6 border-b border-[#ECEFE7] px-5">
        <button
          class="flex items-center gap-2 border-b-2 py-4 text-xs font-bold cursor-pointer"
          :class="
            tab === 'stock'
              ? 'border-[#536124] text-[#536124]'
              : 'border-transparent text-[#7A866E]'
          "
          @click="tab = 'stock'"
        >
          <Boxes class="h-4 w-4" />Danh sách tồn kho
        </button>
        <button
          class="flex items-center gap-2 border-b-2 py-4 text-xs font-bold cursor-pointer"
          :class="
            tab === 'history'
              ? 'border-[#536124] text-[#536124]'
              : 'border-transparent text-[#7A866E]'
          "
          @click="tab = 'history'"
        >
          <History class="h-4 w-4" />Lịch sử nhập kho
        </button>
      </div>
      <template v-if="tab === 'stock'">
        <div class="flex flex-wrap items-center gap-3 p-5">
          <div class="relative w-full md:w-80">
            <Search class="w-4 h-4 text-[#7A866E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="search"
              aria-label="Tìm sản phẩm"
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] text-xs text-[#2D3B1E] placeholder:text-stone-400 focus:outline-hidden focus:border-[#536124] transition-colors"
              placeholder="Tìm tên sản phẩm,..."
            />
          </div>
          <div class="relative">
            <select
              v-model="category"
              aria-label="Lọc danh mục"
              class="appearance-none pl-3 pr-9 py-2 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] text-xs text-[#2D3B1E] focus:outline-hidden focus:border-[#536124]"
            >
              <option value="all">Tất cả danh mục</option>
              <option
                v-for="c in categories"
                :key="c.id"
                :value="c.name"
              >
                {{ c.name }}
              </option></select
            ><ChevronDown
              class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A866E]"
            />
          </div>
          <div class="relative">
            <select
              v-model="status"
              aria-label="Lọc trạng thái tồn kho"
              class="appearance-none pl-3 pr-9 py-2 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] text-xs text-[#2D3B1E] focus:outline-hidden focus:border-[#536124]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Còn hàng</option>
              <option value="out">Hết hàng</option></select
            ><ChevronDown
              class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A866E]"
            />
          </div>
          <button
            v-if="search || category !== 'all' || status !== 'all'"
            class="flex items-center justify-center gap-2 rounded-xl border border-[#CCD7BC] bg-white px-4 py-2.5 text-xs font-bold text-[#536124] hover:bg-[#FAF9F5] cursor-pointer"
            @click="resetFilters"
          >
            <RotateCcw class="h-3.5 w-3.5" />Đặt lại
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr>
                <th
                  class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
                >
                  Sản phẩm
                </th>
                <th
                  class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
                >
                  Danh mục
                </th>
                <th
                  class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
                >
                  Giá bán
                </th>
                <th
                  class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
                >
                  Tồn kho
                </th>
                <th
                  class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
                >
                  Trạng thái kho
                </th>
                <th
                  class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in visible"
                :key="p.id"
                class="border-t border-[#F0F3EC] hover:bg-[#FAF9F5]"
              >
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3 min-w-60">
                    <img
                      :src="p.image"
                      alt=""
                      class="h-11 w-11 rounded-xl object-cover bg-[#FAF9F5]"
                    />
                    <div>
                      <p class="font-bold max-w-64">{{ p.name }}</p>
                      <p class="mt-1 font-mono text-[11px] text-[#7A866E]">{{ p.sku }}</p>
                    </div>
                  </div>
                </td>
                <td class="text-center px-5 py-4">{{ p.category }}</td>
                <td class="text-center px-5 py-4 whitespace-nowrap">{{ money(p.price) }}</td>
                <td class="px-5 py-4 text-center font-semibold text-xs">{{ p.stock }}</td>
                <td class="text-center px-5 py-4">
                  <span
                    class="inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold"
                    :class="
                      stockStatus(p) === 'out'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-800'
                    "
                    >{{ statusLabel(stockStatus(p)) }}</span
                  >
                </td>
                <td class="px-5 py-4 text-center">
                  <div class="flex justify-center">
                    <button
                      type="button"
                      class="rounded-lg p-2 text-[#536124] hover:bg-[#EBF1E6] cursor-pointer"
                      :aria-label="`Nhập kho ${p.name}`"
                      title="Nhập kho"
                      @click="openMovement(p.id)"
                    >
                      <ArrowDownToLine class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td
                  colspan="6"
                  class="px-5 py-4 py-14 text-center text-[#7A866E]"
                >
                  <PackageX class="mx-auto mb-3 h-8 w-8 text-stone-300" />Không tìm thấy sản phẩm
                  phù hợp.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="filtered.length > 0"
          class="p-4 border-t border-[#ECEFE7] bg-[#FAF9F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        >
          <span class="text-[#7A866E] font-medium">
            Hiển thị
            <strong
              >{{ (page - 1) * pageSize + 1 }} -
              {{ Math.min(page * pageSize, filtered.length) }}</strong
            >
            trong tổng số <strong>{{ filtered.length }}</strong> sản phẩm
          </span>

          <div class="flex items-center gap-1.5">
            <!-- Nút Trang trước -->
            <button
              type="button"
              :disabled="page <= 1"
              @click="goToPage(page - 1)"
              class="w-8 h-8 rounded-xl border border-[#CCD7BC] bg-white flex items-center justify-center text-[#536124] hover:bg-[#EBF1E6] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>

            <!-- Nút số trang -->
            <div class="flex items-center gap-1">
              <button
                v-for="pageNumber in pages"
                :key="pageNumber"
                type="button"
                @click="goToPage(pageNumber)"
                class="w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                :class="
                  pageNumber === page
                    ? 'bg-[#536124] text-white shadow-xs'
                    : 'bg-white border border-[#CCD7BC] text-[#2D3B1E] hover:bg-[#FAF9F5]'
                "
              >
                {{ pageNumber }}
              </button>
            </div>

            <!-- Nút Trang sau -->
            <button
              type="button"
              :disabled="page >= pages"
              @click="goToPage(page + 1)"
              class="w-8 h-8 rounded-xl border border-[#CCD7BC] bg-white flex items-center justify-center text-[#536124] hover:bg-[#EBF1E6] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang tiếp theo"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table
          v-if="movements.length"
          class="w-full text-left text-xs"
        >
          <thead>
            <tr>
              <th
                class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
              >
                Thời gian
              </th>
              <th
                class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
              >
                Sản phẩm
              </th>
              <th
                class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
              >
                Số lượng
              </th>
              <th
                class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
              >
                Tồn trước / sau
              </th>
              <th
                class="whitespace-nowrap bg-[#FAF9F5] px-5 py-3 text-[10px] font-bold uppercase text-[#7A866E] text-center"
              >
                Ghi chú
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in movements"
              :key="m.id"
              class="border-t border-[#ECEFE7]"
            >
              <td class="px-5 py-4 whitespace-nowrap text-center">{{ m.date }}</td>
              <td class="px-5 py-4">
                <p class="font-bold min-w-48">{{ m.name }}</p>
                <p class="text-[#7A866E] mt-1">{{ m.code }}</p>
              </td>
              <td class="px-5 py-4 font-bold text-center">+{{ m.quantity }}</td>
              <td class="px-5 py-4 text-center">{{ m.before }} → {{ m.after }}</td>
              <td class="px-5 py-4 min-w-40 break-words">{{ m.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div
          v-else
          class="py-16 text-center text-[#7A866E]"
        >
          <History class="mx-auto h-9 w-9 text-stone-300" />
          <p class="mt-3 text-sm font-bold">Chưa có giao dịch nhập kho</p>
          <p class="mt-1 text-xs">Các giao dịch mới sẽ xuất hiện tại đây.</p>
        </div>
      </div>
    </div>
    <Teleport to="body"
      ><div
        v-if="modal"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs"
        @click.self="modal = false"
        @keydown.esc="modal = false"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="movement-title"
          class="my-8 w-full max-w-lg rounded-3xl border border-[#E3E8DC] bg-white shadow-2xl"
        >
          <header
            class="flex items-center justify-between rounded-t-3xl border-b border-[#ECEFE7] bg-[#FAF9F5] px-6 py-4"
          >
            <h2
              id="movement-title"
              class="font-heading text-lg font-black"
            >
              Nhập kho sản phẩm
            </h2>
            <button
              class="rounded-lg p-2 text-[#536124] hover:bg-[#EBF1E6] cursor-pointer"
              aria-label="Đóng"
              @click="modal = false"
            >
              <X class="h-5 w-5" />
            </button>
          </header>
          <form
            class="space-y-4 p-6 text-xs"
            @submit.prevent="submitMovement"
          >
            <div>
              <label
                for="inventory-product"
                class="mb-2 block font-bold"
                >Sản phẩm <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <select
                  id="inventory-product"
                  v-model="productId"
                  class="w-full appearance-none rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] pl-3 pr-9 py-2.5 text-xs text-[#2D3B1E] outline-none focus:border-[#536124]"
                  required
                >
                  <option
                    disabled
                    value=""
                  >
                    Chọn sản phẩm
                  </option>
                  <option
                    v-for="p in products"
                    :key="p.id"
                    :value="p.id"
                  >
                    {{ p.sku }} · {{ p.name }}
                  </option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A866E]"
                />
                </div>
            </div>
            <p
              v-if="selected"
              class="rounded-xl bg-[#EBF1E6] p-3 text-[#536124]"
            >
              Tồn kho hiện tại: <strong>{{ selected.stock }} đơn vị</strong>
            </p>
            <div>
              <label
                for="inventory-quantity"
                class="mb-2 block font-bold"
                >Số lượng nhập <span class="text-rose-500">*</span></label
              ><input
                id="inventory-quantity"
                v-model="quantity"
                class="w-full rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] px-3 py-2.5 text-xs text-[#2D3B1E] outline-none focus:border-[#536124]"
                type="number"
                min="1"
                step="1"
                required
              />
            </div>
            <div>
              <label
                for="inventory-note"
                class="mb-2 block font-bold"
                >Ghi chú</label
              ><textarea
                id="inventory-note"
                v-model="note"
                rows="3"
                maxlength="500"
                class="w-full rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] px-3 py-2.5 text-xs text-[#2D3B1E] outline-none focus:border-[#536124]"
                placeholder="Nhập lý do hoặc thông tin giao dịch..."
              ></textarea>
            </div>
            <p
              v-if="error"
              role="alert"
              class="rounded-xl bg-rose-50 p-3 text-rose-600"
            >
              {{ error }}
            </p>
            <footer class="flex justify-end gap-3 border-t border-[#ECEFE7] pt-4">
              <button
                type="button"
                class="flex items-center justify-center gap-2 rounded-xl border border-[#CCD7BC] bg-white px-4 py-2.5 text-xs font-bold text-[#536124] hover:bg-[#FAF9F5] cursor-pointer"
                @click="modal = false"
              >
                Hủy</button
              ><button
                class="flex items-center justify-center gap-2 rounded-xl bg-[#536124] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#434F1D] cursor-pointer"
                type="submit"
              >
                Xác nhận nhập kho
              </button>
            </footer>
          </form>
        </section>
      </div></Teleport
    >
    <ToastNotification />
  </div>
</template>
