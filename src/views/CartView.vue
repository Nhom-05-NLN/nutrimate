<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cartStore';
import {
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
  ArrowLeft,
  ShoppingBag,
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();

const isAllSelected = ref(true);
const selectedItemIds = ref<string[]>(cartStore.items.map((i) => i.product.id));

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedItemIds.value = [];
    isAllSelected.value = false;
  } else {
    selectedItemIds.value = cartStore.items.map((i) => i.product.id);
    isAllSelected.value = true;
  }
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const subtotal = computed(() => cartStore.totalAmount);
const shippingFee = computed(() => (subtotal.value > 0 ? 25000 : 0));
const voucherDiscount = computed(() => (subtotal.value > 0 ? 25000 : 0));
const grandTotal = computed(() => Math.max(0, subtotal.value + shippingFee.value - voucherDiscount.value));

function goToCheckout() {
  if (cartStore.items.length > 0) {
    router.push('/checkout');
  }
}

const suggestedUpsells = [
  {
    id: 'sug-1',
    name: 'Sữa Chua Hy Lạp Lên Men Tự Nhiên 250g',
    desc: 'Giàu lợi khuẩn probiotic, ít đường, cấu trúc dẻo mịn',
    price: 45000,
    protein: '10g Protein / hộp',
    tag: 'Ăn kèm Granola',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'sug-2',
    name: 'Mì Konjac Sợi Phở Ăn Kiêng 200g',
    desc: 'Hàm lượng calo gần như bằng 0, giàu chất xơ hòa tan',
    price: 32000,
    protein: '12 kcal / gói',
    tag: 'Low-Carb / Keto',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'sug-3',
    name: 'Thanh Ngũ Cốc Protein Bar Vị Socola Đen',
    desc: 'Bổ sung năng lượng tức thì trước và sau buổi tập',
    price: 28000,
    protein: '15g Whey Protein',
    tag: 'Tiện lợi tập luyện',
    image: 'https://images.unsplash.com/photo-1622484216858-a5b4819779df?auto=format&fit=crop&w=400&q=80',
  },
];
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#2D3B1E]">Trang chủ</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="text-[#2D3B1E] font-bold">Giỏ hàng của bạn</span>
    </nav>

    <!-- Header Title -->
    <div class="flex items-center gap-3">
      <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
        Giỏ hàng của bạn
      </h1>
      <span class="px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-bold text-[#4D6A34] border border-[#CCD7BC]">
        {{ cartStore.totalCount }} món
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="p-12 text-center bg-white rounded-3xl border border-[#E3E8DC] space-y-4">
      <div class="w-16 h-16 rounded-full bg-[#FAF9F5] text-[#7A866E] flex items-center justify-center mx-auto">
        <ShoppingBag class="w-8 h-8" />
      </div>
      <h3 class="font-heading text-lg font-bold text-[#2D3B1E]">Giỏ hàng của bạn đang trống</h3>
      <p class="text-xs text-[#7A866E] max-w-sm mx-auto">
        Hãy khám phá các dòng thực phẩm sạch kiểm soát calo và dinh dưỡng khoa học của NutriMate.
      </p>
      <RouterLink
        to="/catalog"
        class="inline-block px-6 py-3 rounded-2xl bg-[#4D6A34] text-white text-xs font-bold shadow-md"
      >
        Khám phá thực đơn ngay
      </RouterLink>
    </div>

    <!-- Main Content 2 Columns (Figma 04) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Cột Trái: Bảng danh sách sản phẩm trong giỏ -->
      <div class="lg:col-span-8 space-y-4">
        <div class="bg-white rounded-3xl border border-[#E3E8DC] overflow-hidden shadow-2xs">
          <!-- Header Bảng -->
          <div class="px-6 py-4 bg-[#F6F8F3] border-b border-[#E8ECE2] flex items-center justify-between text-xs font-bold text-[#576449]">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="accent-[#4D6A34] w-4 h-4 rounded cursor-pointer"
              />
              <span>Sản phẩm & Macro tóm tắt</span>
            </label>
            <div class="hidden sm:flex items-center gap-12 pr-6">
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
            </div>
          </div>

          <!-- Items Rows -->
          <div class="divide-y divide-[#F0F3EC]">
            <div
              v-for="item in cartStore.items"
              :key="item.product.id"
              class="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FAF9F5] transition-colors"
            >
              <div class="flex items-start gap-4 flex-1 min-w-0">
                <input
                  type="checkbox"
                  :value="item.product.id"
                  v-model="selectedItemIds"
                  class="accent-[#4D6A34] w-4 h-4 rounded mt-2 cursor-pointer"
                />

                <img
                  :src="item.product.image"
                  :alt="item.product.name"
                  class="w-20 h-20 rounded-2xl object-cover shrink-0 border border-[#E8ECE2]"
                />

                <div class="space-y-1 min-w-0 flex-1">
                  <h3 class="font-heading text-sm font-bold text-[#2D3B1E] leading-snug line-clamp-2">
                    {{ item.product.name }}
                  </h3>
                  <p class="text-xs text-[#7A866E]">
                    Phân loại: <strong>{{ item.selectedPortion || 'Mặc định' }}</strong>
                  </p>
                  <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#CCD7BC] text-[10px] font-bold text-[#4D6A34]">
                      ⚡ {{ item.product.nutrition.calories }} kcal / {{ item.product.nutrition.servingSize }}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-[#EBF1E6] text-[10px] font-bold text-[#3B4E24]">
                      {{ item.product.nutrition.protein }}g Đạm
                    </span>
                  </div>
                </div>
              </div>

              <!-- Giá & Quantity controls -->
              <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0F3EC]">
                <div class="text-xs font-semibold text-[#576449] sm:w-20 text-right">
                  {{ formatVnd(item.product.price) }}
                </div>

                <div class="flex items-center border border-[#CCD7BC] rounded-xl bg-white p-0.5">
                  <button
                    type="button"
                    @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)"
                    class="w-6 h-6 flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5] rounded-lg"
                  >
                    <Minus class="w-3 h-3" />
                  </button>
                  <span class="w-7 text-center text-xs font-bold text-[#2D3B1E]">{{ item.quantity }}</span>
                  <button
                    type="button"
                    @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)"
                    class="w-6 h-6 flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5] rounded-lg"
                  >
                    <Plus class="w-3 h-3" />
                  </button>
                </div>

                <div class="font-heading text-sm font-extrabold text-[#2D3B1E] sm:w-24 text-right">
                  {{ formatVnd(item.product.price * item.quantity) }}
                </div>

                <button
                  type="button"
                  @click="cartStore.removeItem(item.product.id)"
                  class="p-1.5 text-[#8C9484] hover:text-rose-600 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <RouterLink
          to="/catalog"
          class="inline-flex items-center gap-2 text-xs font-bold text-[#4D6A34] hover:text-[#2D3B1E] transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Tiếp tục chọn mua thêm thực phẩm</span>
        </RouterLink>
      </div>

      <!-- Cột Phải: Hộp Tóm Tắt Đơn Hàng (Figma 04) -->
      <aside class="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-sm space-y-6">
        <h2 class="font-heading text-lg font-black text-[#2D3B1E] border-b border-[#F0F3EC] pb-3">
          Tóm tắt đơn hàng
        </h2>

        <div class="space-y-3 text-xs text-[#576449]">
          <div class="flex justify-between">
            <span>Tạm tính</span>
            <span class="font-bold text-[#2D3B1E]">{{ formatVnd(subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Phí vận chuyển</span>
            <span class="font-bold text-[#2D3B1E]">{{ formatVnd(shippingFee) }}</span>
          </div>
          <div class="flex justify-between text-[#4D6A34] font-semibold">
            <span>Giảm giá voucher</span>
            <span>-{{ formatVnd(voucherDiscount) }}</span>
          </div>
        </div>

        <div class="pt-4 border-t border-[#E3E8DC] flex items-baseline justify-between">
          <div>
            <span class="font-heading text-base font-bold text-[#2D3B1E] block">Tổng cộng</span>
            <span class="text-[10px] text-[#7A866E]">(Đã bao gồm VAT)</span>
          </div>
          <span class="font-heading text-2xl font-black text-[#2D3B1E]">
            {{ formatVnd(grandTotal) }}
          </span>
        </div>

        <button
          type="button"
          @click="goToCheckout"
          class="w-full py-4 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[44px]"
        >
          <span>Tiến hành đặt hàng ({{ formatVnd(grandTotal) }})</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <!-- 3 Tiêu chí an tâm -->
        <div class="pt-4 border-t border-[#F0F3EC] space-y-2.5 text-[11px] text-[#6B7562]">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-[#4D6A34] shrink-0" />
            <span>Bảo mật thanh toán chuẩn PCI-DSS & SSL</span>
          </div>
          <div class="flex items-center gap-2">
            <RefreshCw class="w-4 h-4 text-[#4D6A34] shrink-0" />
            <span>Đổi trả 7 ngày nếu lỗi sản phẩm</span>
          </div>
          <div class="flex items-center gap-2">
            <Award class="w-4 h-4 text-[#4D6A34] shrink-0" />
            <span>100% chính hãng có kiểm định dinh dưỡng</span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Món ăn kèm gợi ý cho bữa ăn của bạn (Figma 04 Bottom Section) -->
    <div class="pt-10 border-t border-[#E3E8DC]">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="font-heading text-xl font-extrabold text-[#2D3B1E]">
            Món ăn kèm gợi ý cho bữa ăn của bạn
          </h3>
        </div>
        <RouterLink to="/catalog" class="text-xs font-bold text-[#4D6A34] hover:underline">
          Xem tất cả gợi ý &gt;
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div
          v-for="sug in suggestedUpsells"
          :key="sug.id"
          class="p-5 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all space-y-3 flex flex-col justify-between"
        >
          <div class="space-y-3">
            <div class="relative rounded-2xl overflow-hidden aspect-16/10">
              <img :src="sug.image" :alt="sug.name" class="w-full h-full object-cover" />
              <span class="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-[#2D3B1E]">
                {{ sug.tag }}
              </span>
            </div>

            <div>
              <h4 class="font-heading text-sm font-bold text-[#2D3B1E] line-clamp-1">{{ sug.name }}</h4>
              <p class="text-xs text-[#7A866E] line-clamp-1 mt-0.5">{{ sug.desc }}</p>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between">
            <div>
              <span class="font-bold text-sm text-[#2D3B1E] block">{{ formatVnd(sug.price) }}</span>
              <span class="text-[10px] text-[#7A866E]">{{ sug.protein }}</span>
            </div>

            <button
              type="button"
              @click="cartStore.addItem({
                id: sug.id,
                code: 'NM-SUG',
                name: sug.name,
                category: 'snacks-nuts',
                categoryName: 'Gợi ý thêm',
                price: sug.price,
                image: sug.image,
                description: sug.desc,
                ingredients: ['Tự nhiên'],
                nutrition: { servingSize: '1 phần', calories: 120, protein: 10, carbs: 5, fat: 2, sugar: 1 },
                stock: 99,
                rating: 4.8,
                reviewCount: 30,
                badges: [sug.tag],
                bestFor: 'Ăn kèm',
              }, 1, 'Tiêu chuẩn')"
              class="px-3 py-1.5 rounded-xl bg-[#EBF1E6] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <ShoppingBag class="w-3.5 h-3.5" />
              <span>Thêm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
