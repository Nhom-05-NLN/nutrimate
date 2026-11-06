<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useCartStore, getCartItemKey } from '../../stores/cartStore';
import CartItemRow from './CartItemRow.vue';
import {
  X,
  ShoppingBag,
  ArrowRight,
  Flame,
  Dumbbell,
  ExternalLink,
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleGoToCart() {
  cartStore.closeCart();
  router.push('/cart');
}

function handleProceedCheckout() {
  cartStore.closeCart();
  router.push('/checkout');
}
</script>

<template>
  <div>
    <!-- Backdrop overlay -->
    <div
      v-if="cartStore.isCartOpen"
      class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
      @click="cartStore.closeCart()"
      aria-hidden="true"
    ></div>

    <!-- Slide-over Drawer -->
    <aside
      class="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#FAF9F5] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-l border-[#E3E8DC]"
      :class="cartStore.isCartOpen ? 'translate-x-0' : 'translate-x-full'"
      role="dialog"
      aria-modal="true"
      aria-label="Giỏ hàng của bạn"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 bg-white border-b border-[#E8ECE2] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#EBF7E5] text-[#4D6A34] flex items-center justify-center border border-[#CCD7BC]">
            <ShoppingBag class="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 class="font-heading text-lg font-bold text-[#242424]">Giỏ Hàng Dinh Dưỡng</h2>
            <p class="text-xs text-[#7A866E] font-medium">{{ cartStore.totalCount }} món đang lưu</p>
          </div>
        </div>

        <button
          type="button"
          @click="cartStore.closeCart()"
          class="w-10 h-10 rounded-2xl text-[#7A866E] hover:bg-[#FAF9F5] hover:text-[#242424] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
          aria-label="Đóng giỏ hàng"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Nutrition Summary Banner (CN_17 / CN_18) -->
      <div
        v-if="cartStore.items.length > 0"
        class="bg-[#232722] text-white p-4 mx-4 mt-4 rounded-2xl shadow-sm flex items-center justify-between border border-slate-800"
      >
        <div class="flex items-center gap-2.5">
          <Flame class="w-5 h-5 text-amber-300 shrink-0" />
          <div>
            <span class="text-[10px] text-[#A6B299] block uppercase font-bold tracking-wider">Tổng Năng Lượng</span>
            <span class="font-heading text-base font-extrabold text-white">{{ cartStore.totalCalories }} kcal</span>
          </div>
        </div>

        <div class="h-8 w-px bg-slate-700"></div>

        <div class="flex items-center gap-2.5">
          <Dumbbell class="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span class="text-[10px] text-[#A6B299] block uppercase font-bold tracking-wider">Tổng Đạm</span>
            <span class="font-heading text-base font-extrabold text-white">{{ cartStore.totalProtein }}g</span>
          </div>
        </div>
      </div>

      <!-- Items List -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        <!-- Empty State -->
        <div
          v-if="cartStore.items.length === 0"
          class="h-full flex flex-col items-center justify-center text-center p-6 space-y-4"
        >
          <div class="w-16 h-16 rounded-full bg-white border border-[#E3E8DC] text-[#7A866E] flex items-center justify-center">
            <ShoppingBag class="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 class="font-heading text-base font-bold text-[#242424]">Giỏ hàng của bạn đang trống</h3>
          <p class="text-xs text-[#7A866E] max-w-xs leading-relaxed">
            Hãy khám phá các thực phẩm Low-Carb, Giàu Đạm hoặc Không Đường để nạp dinh dưỡng sạch hôm nay nhé!
          </p>
          <button
            type="button"
            @click="cartStore.closeCart(); router.push('/catalog')"
            class="px-5 py-2.5 rounded-xl bg-[#4D6A34] text-white text-xs font-bold hover:bg-[#3B4E24] transition-colors"
          >
            Khám phá thực đơn
          </button>
        </div>

        <!-- Render bằng CartItemRow compact mode -->
        <CartItemRow
          v-for="item in cartStore.items"
          :key="getCartItemKey(item.product.id, item.selectedPortion)"
          :item="item"
          :compact="true"
          @update-quantity="(qty) => cartStore.updateQuantity(item.product.id, qty, item.selectedPortion)"
          @remove="cartStore.removeItem(item.product.id, item.selectedPortion)"
        />
      </div>

      <!-- Footer & Checkout Actions -->
      <div v-if="cartStore.items.length > 0" class="p-5 bg-white border-t border-[#E8ECE2] space-y-3 shadow-xs">
        <div class="flex items-baseline justify-between text-sm">
          <span class="font-semibold text-[#576449]">Tổng tạm tính:</span>
          <span class="font-heading text-xl font-black text-[#242424]">
            {{ formatVnd(cartStore.totalAmount) }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            @click="handleGoToCart"
            class="py-3 px-3 rounded-2xl bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#4D6A34] font-bold text-xs border border-[#CCD7BC] flex items-center justify-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
          >
            <ExternalLink class="w-4 h-4" />
            <span>Xem giỏ hàng</span>
          </button>

          <button
            type="button"
            @click="handleProceedCheckout"
            class="py-3 px-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all min-h-[44px] cursor-pointer"
          >
            <span>Thanh toán</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          @click="cartStore.clearCart()"
          class="w-full text-center text-xs font-medium text-[#8C9484] hover:text-rose-600 transition-colors py-1 cursor-pointer"
        >
          Xóa toàn bộ giỏ hàng
        </button>
      </div>
    </aside>
  </div>
</template>
