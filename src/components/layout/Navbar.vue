<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';
import { useChatStore } from '../../stores/chatStore';
import { useProductStore } from '../../stores/productStore';
import {
  ShoppingBag,
  Bot,
  Search,
  Flame,
  Leaf,
  Sparkles
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();
const chatStore = useChatStore();
const productStore = useProductStore();

const searchInput = ref('');

function handleSearchSubmit() {
  if (searchInput.value.trim()) {
    productStore.setSearch(searchInput.value.trim());
    router.push({ name: 'catalog' });
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20 gap-4">
        <!-- Logo & Slogan -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 group focus-visible:outline-emerald-600 rounded-xl p-1"
        >
          <div class="w-11 h-11 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <Leaf class="w-6 h-6" />
          </div>
          <div class="flex flex-col">
            <span class="font-heading text-2xl font-bold tracking-tight text-slate-900 leading-none group-hover:text-emerald-700 transition-colors">
              Nutri<span class="text-emerald-600">Mate</span>
            </span>
            <span class="text-[11px] font-medium text-slate-500 tracking-wider uppercase mt-1">
              Thực Phẩm Ăn Kiêng & Dinh Dưỡng AI
            </span>
          </div>
        </RouterLink>

        <!-- Search Bar (Desktop) -->
        <div class="hidden md:flex flex-1 max-w-md mx-4">
          <form @submit.prevent="handleSearchSubmit" class="relative w-full">
            <input
              type="text"
              v-model="searchInput"
              placeholder="Tìm kiếm: bún nưa, ức gà, bánh mì keto, 0 đường..."
              class="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm transition-all outline-hidden"
            />
            <Search class="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        <!-- Navigation Links -->
        <nav class="hidden lg:flex items-center gap-1 font-medium text-sm text-slate-600">
          <RouterLink
            to="/"
            active-class="text-emerald-700 font-semibold bg-emerald-50"
            class="px-4 py-2 rounded-xl hover:text-emerald-700 hover:bg-slate-50 transition-colors"
          >
            Trang Chủ
          </RouterLink>
          <RouterLink
            to="/catalog"
            active-class="text-emerald-700 font-semibold bg-emerald-50"
            class="px-4 py-2 rounded-xl hover:text-emerald-700 hover:bg-slate-50 transition-colors"
          >
            Thực Đơn Ăn Kiêng
          </RouterLink>
        </nav>

        <!-- Utilities Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Chat AI Button -->
          <button
            type="button"
            @click="chatStore.openChat()"
            class="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60 transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px]"
            title="Tư vấn dinh dưỡng với NutriBot AI"
          >
            <Bot class="w-4 h-4 text-emerald-600 shrink-0" />
            <span class="hidden sm:inline">NutriBot AI</span>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
              <Sparkles class="w-2.5 h-2.5 mr-0.5" /> AI
            </span>
          </button>

          <!-- Cart Drawer Button -->
          <button
            type="button"
            @click="cartStore.openCart()"
            class="relative inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-slate-900 min-h-[44px]"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingBag class="w-4 h-4 text-emerald-400" />
            <span class="hidden md:inline">Giỏ hàng</span>
            <!-- Calorie Tracker Snippet -->
            <span
              v-if="cartStore.totalCalories > 0"
              class="hidden lg:inline-flex items-center gap-1 text-[11px] font-normal text-emerald-300 border-l border-slate-700 pl-2"
            >
              <Flame class="w-3 h-3 text-amber-400" />
              {{ cartStore.totalCalories }} kcal
            </span>
            <!-- Badge Count -->
            <span
              v-if="cartStore.totalCount > 0"
              class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full bg-emerald-500 text-slate-950"
            >
              {{ cartStore.totalCount }}
            </span>
          </button>
        </div>
      </div>

      <!-- Mobile Search Bar -->
      <div class="md:hidden pb-3">
        <form @submit.prevent="handleSearchSubmit" class="relative w-full">
          <input
            type="text"
            v-model="searchInput"
            placeholder="Tìm món ăn kiêng, calo, đạm..."
            class="w-full bg-slate-100 text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm"
          />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
      </div>
    </div>
  </header>
</template>
