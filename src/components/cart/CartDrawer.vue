<script setup lang="ts">
import { useCartStore } from '../../stores/cartStore';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Flame,
  Dumbbell,
} from 'lucide-vue-next';

const cartStore = useCartStore();

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
</script>

<template>
  <div>
    <!-- Backdrop overlay -->
    <div
      v-if="cartStore.isCartOpen"
      class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
      @click="cartStore.closeCart()"
    ></div>

    <!-- Slide-over Drawer -->
    <aside
      class="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out"
      :class="cartStore.isCartOpen ? 'translate-x-0' : 'translate-x-full'"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShoppingBag class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-heading text-lg font-bold text-slate-900">Giỏ Hàng Dinh Dưỡng</h2>
            <p class="text-xs text-slate-500">{{ cartStore.totalCount }} món trong giỏ</p>
          </div>
        </div>

        <button
          type="button"
          @click="cartStore.closeCart()"
          class="w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Đóng giỏ hàng"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Nutrition Summary Banner -->
      <div
        v-if="cartStore.items.length > 0"
        class="bg-emerald-950 text-white p-4 mx-4 mt-4 rounded-2xl shadow-inner flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <Flame class="w-5 h-5 text-amber-400" />
          <div>
            <span class="text-[11px] text-emerald-300 block uppercase font-bold tracking-wider">Tổng Năng Lượng</span>
            <span class="font-heading text-base font-extrabold text-white">{{ cartStore.totalCalories }} kcal</span>
          </div>
        </div>
        <div class="h-8 w-px bg-slate-800"></div>
        <div class="flex items-center gap-2">
          <Dumbbell class="w-5 h-5 text-emerald-400" />
          <div>
            <span class="text-[11px] text-emerald-300 block uppercase font-bold tracking-wider">Tổng Đạm (Protein)</span>
            <span class="font-heading text-base font-extrabold text-white">{{ cartStore.totalProtein }}g Đạm</span>
          </div>
        </div>
      </div>

      <!-- Items List -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div
          v-if="cartStore.items.length === 0"
          class="h-full flex flex-col items-center justify-center text-center p-6 space-y-3"
        >
          <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <ShoppingBag class="w-8 h-8" />
          </div>
          <h3 class="font-heading text-base font-bold text-slate-800">Giỏ hàng của bạn đang trống</h3>
          <p class="text-xs text-slate-500 max-w-xs leading-relaxed">
            Hãy khám phá các thực phẩm Low-Carb, Giàu Đạm hoặc Không Đường để nạp dinh dưỡng sạch hôm nay nhé!
          </p>
        </div>

        <div
          v-for="item in cartStore.items"
          :key="item.product.id"
          class="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all"
        >
          <!-- Thumb -->
          <img
            :src="item.product.image"
            :alt="item.product.name"
            class="w-16 h-16 rounded-xl object-cover shrink-0"
          />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h4 class="font-heading text-sm font-bold text-slate-900 truncate">
              {{ item.product.name }}
            </h4>
            <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>{{ item.product.nutrition.calories }} kcal</span>
              <span>•</span>
              <span class="text-emerald-700 font-semibold">{{ item.product.nutrition.protein }}g đạm</span>
            </div>
            <span class="font-heading text-sm font-bold text-emerald-700 block mt-1">
              {{ formatVnd(item.product.price) }}
            </span>
          </div>

          <!-- Quantity Controls -->
          <div class="flex flex-col items-end gap-1.5 shrink-0">
            <button
              type="button"
              @click="cartStore.removeItem(item.product.id)"
              class="text-slate-400 hover:text-rose-600 p-1 transition-colors"
              title="Xóa khỏi giỏ"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <div class="flex items-center border border-slate-300 rounded-xl bg-white">
              <button
                type="button"
                @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)"
                class="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-xl"
              >
                <Minus class="w-3 h-3" />
              </button>
              <span class="w-6 text-center text-xs font-bold text-slate-900">{{ item.quantity }}</span>
              <button
                type="button"
                @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)"
                class="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-xl"
              >
                <Plus class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer & Checkout Button -->
      <div v-if="cartStore.items.length > 0" class="p-5 sm:p-6 border-t border-slate-200 space-y-4 bg-slate-50/50">
        <div class="flex items-baseline justify-between">
          <span class="text-sm font-semibold text-slate-600">Tạm tính:</span>
          <span class="font-heading text-xl font-extrabold text-slate-900">
            {{ formatVnd(cartStore.totalAmount) }}
          </span>
        </div>

        <button
          type="button"
          @click="cartStore.openCheckout()"
          class="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all min-h-[44px]"
        >
          <span>Tiến Hành Đặt Hàng</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <button
          type="button"
          @click="cartStore.clearCart()"
          class="w-full text-center text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors py-1"
        >
          Xóa toàn bộ giỏ hàng
        </button>
      </div>
    </aside>
  </div>
</template>
