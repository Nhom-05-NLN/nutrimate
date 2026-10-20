<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore, getCartItemKey } from '../stores/cartStore';
import { useToastStore } from '../stores/toastStore';
import CartItemRow from '../components/cart/CartItemRow.vue';
import {
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
  ArrowLeft,
  ShoppingBag,
  Flame,
  Dumbbell,
  AlertCircle,
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();
const toastStore = useToastStore();

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Tính toán dựa trên các món ĐƯỢC CHỌN để checkout
const subtotal = computed(() => cartStore.selectedAmount);
const shippingFee = computed(() => (subtotal.value > 0 ? (subtotal.value >= 300000 ? 0 : 25000) : 0));
const voucherDiscount = computed(() => (subtotal.value >= 200000 ? 25000 : 0));
const grandTotal = computed(() => Math.max(0, subtotal.value + shippingFee.value - voucherDiscount.value));

function goToCheckout() {
  if (cartStore.selectedCount === 0) {
    toastStore.show('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán', 'warning');
    return;
  }
  router.push('/checkout');
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
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm font-medium text-[#7E8B73]" aria-label="Breadcrumb">
      <RouterLink to="/" class="hover:text-[#242424]">Trang chủ</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <span class="text-[#242424] font-bold">Giỏ hàng của bạn</span>
    </nav>

    <!-- Header Title -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <h1 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#242424]">
          Giỏ hàng của bạn
        </h1>
        <span class="px-3.5 py-1 rounded-full bg-[#EBF7E5] text-xs font-bold text-[#4D6A34] border border-[#CCD7BC]">
          {{ cartStore.totalCount }} món
        </span>
      </div>

      <button
        v-if="cartStore.items.length > 0"
        type="button"
        @click="cartStore.clearCart()"
        class="text-xs font-semibold text-[#8C9484] hover:text-rose-600 transition-colors self-start sm:self-auto cursor-pointer"
      >
        Xóa tất cả
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="p-16 text-center bg-white rounded-3xl border border-[#E3E8DC] space-y-4 shadow-2xs">
      <div class="w-20 h-20 rounded-full bg-[#FAF9F5] text-[#7A866E] flex items-center justify-center mx-auto border border-[#E8ECE2]">
        <ShoppingBag class="w-10 h-10 stroke-[1.5]" />
      </div>
      <h3 class="font-heading text-xl font-bold text-[#242424]">Giỏ hàng của bạn đang trống</h3>
      <p class="text-sm text-[#7A866E] max-w-md mx-auto leading-relaxed">
        Hãy khám phá các dòng thực phẩm sạch kiểm soát calo và dinh dưỡng khoa học của NutriMate.
      </p>
      <RouterLink
        to="/catalog"
        class="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-sm font-bold shadow-md transition-all cursor-pointer min-h-[44px]"
      >
        <ShoppingBag class="w-4 h-4" />
        <span>Khám phá thực đơn ngay</span>
      </RouterLink>
    </div>

    <!-- Main Content 2 Columns (Figma 04) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <!-- Cột Trái: Bảng danh sách sản phẩm trong giỏ -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Nutrition Quick Stat Banner (CN_17 / CN_18) -->
        <div class="p-4 sm:p-5 rounded-3xl bg-[#232722] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-[#4D6A34] flex items-center justify-center text-white shrink-0">
              <Flame class="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span class="text-xs text-[#CCD7BC] block font-medium">Dinh dưỡng món được chọn thanh toán</span>
              <span class="text-sm font-bold text-white">
                {{ cartStore.selectedCount }} / {{ cartStore.totalCount }} món đang chọn
              </span>
            </div>
          </div>

          <div class="flex items-center gap-6 divide-x divide-slate-700/60 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            <div class="flex items-center gap-2">
              <Flame class="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span class="text-[10px] text-[#A6B299] uppercase block font-semibold">Năng Lượng</span>
                <span class="font-heading text-sm font-extrabold text-white">{{ cartStore.selectedCalories }} kcal</span>
              </div>
            </div>

            <div class="flex items-center gap-2 pl-6">
              <Dumbbell class="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span class="text-[10px] text-[#A6B299] uppercase block font-semibold">Chất Đạm</span>
                <span class="font-heading text-sm font-extrabold text-white">{{ cartStore.selectedProtein }}g</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bảng Sản Phẩm -->
        <div class="bg-white rounded-3xl border border-[#E3E8DC] overflow-hidden shadow-2xs">
          <!-- Header Bảng -->
          <div class="px-6 py-4 bg-[#F6F8F3] border-b border-[#E8ECE2] flex items-center justify-between text-sm font-bold text-[#4E5C3E]">
            <label class="flex items-center gap-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                :checked="cartStore.isAllSelected"
                @change="cartStore.toggleSelectAll()"
                class="accent-[#4D6A34] w-5 h-5 rounded cursor-pointer"
              />
              <span>Chọn tất cả ({{ cartStore.items.length }} món)</span>
            </label>
            <div class="hidden sm:flex items-center gap-14 pr-6">
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
            </div>
          </div>

          <!-- Items Rows (dùng CartItemRow) -->
          <div class="divide-y divide-[#F0F3EC]">
            <CartItemRow
              v-for="item in cartStore.items"
              :key="getCartItemKey(item.product.id, item.selectedPortion)"
              :item="item"
              :selectable="true"
              :selected="cartStore.isItemSelected(item.product.id, item.selectedPortion)"
              @toggle-select="cartStore.toggleSelectItem(item.product.id, item.selectedPortion)"
              @update-quantity="(qty) => cartStore.updateQuantity(item.product.id, qty, item.selectedPortion)"
              @remove="cartStore.removeItem(item.product.id, item.selectedPortion)"
            />
          </div>
        </div>

        <RouterLink
          to="/catalog"
          class="inline-flex items-center gap-2 text-sm font-bold text-[#4D6A34] hover:text-[#242424] transition-colors pt-2"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Tiếp tục chọn mua thêm thực phẩm</span>
        </RouterLink>
      </div>

      <!-- Cột Phải: Hộp Tóm Tắt Đơn Hàng (Figma 04) -->
      <aside class="lg:col-span-4 bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-sm space-y-6">
        <div class="border-b border-[#F0F3EC] pb-4 flex items-center justify-between">
          <h2 class="font-heading text-xl font-black text-[#242424]">
            Tóm tắt đơn hàng
          </h2>
          <span class="text-xs font-bold text-[#4D6A34] bg-[#EBF7E5] px-2.5 py-1 rounded-full border border-[#CCD7BC]">
            Đang chọn {{ cartStore.selectedCount }} món
          </span>
        </div>

        <!-- Cảnh báo nếu chưa chọn món nào -->
        <div
          v-if="cartStore.selectedCount === 0"
          class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5"
        >
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Vui lòng tích chọn ít nhất 1 sản phẩm ở cột bên trái để tiến hành thanh toán.</span>
        </div>

        <div class="space-y-3.5 text-sm text-[#576449]">
          <div class="flex justify-between">
            <span>Tạm tính ({{ cartStore.selectedCount }} món)</span>
            <span class="font-bold text-[#242424]">{{ formatVnd(subtotal) }}</span>
          </div>

          <div class="flex justify-between">
            <span>Phí vận chuyển</span>
            <div class="text-right">
              <span v-if="shippingFee === 0 && subtotal > 0" class="font-bold text-[#4D6A34]">FREESHIP (Đơn >300k)</span>
              <span v-else class="font-bold text-[#242424]">{{ formatVnd(shippingFee) }}</span>
            </div>
          </div>

          <div class="flex justify-between text-[#4D6A34] font-semibold">
            <span>Giảm giá voucher</span>
            <span>-{{ formatVnd(voucherDiscount) }}</span>
          </div>
        </div>

        <div class="pt-5 border-t border-[#E3E8DC] flex items-baseline justify-between">
          <div>
            <span class="font-heading text-lg font-bold text-[#242424] block">Tổng cộng</span>
            <span class="text-xs text-[#7A866E]">(Đã bao gồm VAT)</span>
          </div>
          <span class="font-heading text-3xl font-black text-[#242424]">
            {{ formatVnd(grandTotal) }}
          </span>
        </div>

        <button
          type="button"
          @click="goToCheckout"
          :disabled="cartStore.selectedCount === 0"
          class="w-full py-4 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base shadow-md flex items-center justify-center gap-2.5 transition-all min-h-[48px] cursor-pointer"
        >
          <span>Tiến hành đặt hàng ({{ formatVnd(grandTotal) }})</span>
          <ArrowRight class="w-5 h-5" />
        </button>

        <!-- 3 Tiêu chí an tâm -->
        <div class="pt-5 border-t border-[#F0F3EC] space-y-3 text-xs text-[#6B7562]">
          <div class="flex items-center gap-2.5">
            <ShieldCheck class="w-4.5 h-4.5 text-[#4D6A34] shrink-0" />
            <span>Bảo mật thanh toán chuẩn PCI-DSS & SSL</span>
          </div>
          <div class="flex items-center gap-2.5">
            <RefreshCw class="w-4.5 h-4.5 text-[#4D6A34] shrink-0" />
            <span>Đổi trả 7 ngày nếu lỗi sản phẩm</span>
          </div>
          <div class="flex items-center gap-2.5">
            <Award class="w-4.5 h-4.5 text-[#4D6A34] shrink-0" />
            <span>100% chính hãng có kiểm định dinh dưỡng</span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Món ăn kèm gợi ý cho bữa ăn của bạn (Figma 04 Bottom Section) -->
    <div class="pt-12 border-t border-[#E3E8DC]">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="font-heading text-2xl font-black text-[#242424]">
            Món ăn kèm gợi ý cho bữa ăn của bạn
          </h3>
        </div>
        <RouterLink to="/catalog" class="text-sm font-bold text-[#4D6A34] hover:underline">
          Xem tất cả gợi ý &gt;
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div
          v-for="sug in suggestedUpsells"
          :key="sug.id"
          class="p-6 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all space-y-4 flex flex-col justify-between shadow-2xs"
        >
          <div class="space-y-3.5">
            <div class="relative rounded-2xl overflow-hidden aspect-16/10">
              <img :src="sug.image" :alt="sug.name" class="w-full h-full object-cover" loading="lazy" />
              <span class="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-white/95 text-xs font-bold text-[#242424] shadow-2xs">
                {{ sug.tag }}
              </span>
            </div>

            <div>
              <h4 class="font-heading text-base font-bold text-[#242424] line-clamp-1">{{ sug.name }}</h4>
              <p class="text-xs text-[#7A866E] line-clamp-1 mt-1">{{ sug.desc }}</p>
            </div>
          </div>

          <div class="pt-4 border-t border-[#F0F3EC] flex items-center justify-between">
            <div>
              <span class="font-heading font-black text-base text-[#242424] block">{{ formatVnd(sug.price) }}</span>
              <span class="text-xs font-semibold text-[#4D6A34]">{{ sug.protein }}</span>
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
              class="px-4 py-2 rounded-xl bg-[#EBF7E5] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
            >
              <ShoppingBag class="w-4 h-4" />
              <span>Thêm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
