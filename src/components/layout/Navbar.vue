<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useAuthStore } from '../../stores/authStore';
import {
  ShoppingBag,
  Search,
  Leaf,
  LogIn,
  LogOut,
  X,
  Menu,
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();
const productStore = useProductStore();
const authStore = useAuthStore();

const isSearchOpen = ref(false);
const searchInput = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);
const isMobileMenuOpen = ref(false);

function toggleSearch() {
  isSearchOpen.value = !isSearchOpen.value;
  if (isSearchOpen.value) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  } else {
    searchInput.value = '';
  }
}

function handleSearchSubmit() {
  if (searchInput.value.trim()) {
    productStore.setSearch(searchInput.value.trim());
    router.push({ name: 'catalog' });
    isSearchOpen.value = false;
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20 gap-4">
        <!-- Brand Logo -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 group focus-visible:outline-emerald-600 rounded-xl shrink-0"
        >
          <div class="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-800/20 group-hover:scale-105 transition-transform">
            <Leaf class="w-5 h-5 text-emerald-100" />
          </div>
          <div class="flex flex-col">
            <span class="font-heading text-2xl font-black tracking-tight text-slate-900 leading-none group-hover:text-emerald-700 transition-colors">
              Nutri<span class="text-emerald-700">Mate</span>
            </span>
            <span class="text-[10px] font-bold text-emerald-800 tracking-wider uppercase mt-1">
              Diet & Nutrition
            </span>
          </div>
        </RouterLink>

        <!-- Desktop Navigation Links: [Trang chủ] | [Thực phẩm ăn kiêng] | [Bài viết] -->
        <nav class="hidden md:flex items-center gap-2">
          <RouterLink
            to="/"
            exact-active-class="bg-emerald-50 text-emerald-800 font-bold"
            class="px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:bg-slate-50 transition-all"
          >
            Trang chủ
          </RouterLink>

          <RouterLink
            to="/catalog"
            active-class="bg-emerald-50 text-emerald-800 font-bold"
            class="px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:bg-slate-50 transition-all"
          >
            Thực phẩm ăn kiêng
          </RouterLink>

          <RouterLink
            to="/blogs"
            active-class="bg-emerald-50 text-emerald-800 font-bold"
            class="px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:bg-slate-50 transition-all"
          >
            Bài viết
          </RouterLink>
        </nav>

        <!-- Right Side: [Search Icon] | [Cart Icon] | [Login Button] -->
        <div class="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <!-- Search Expandable Component -->
          <div class="relative flex items-center">
            <!-- Expanded Input Box -->
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <form
                v-if="isSearchOpen"
                @submit.prevent="handleSearchSubmit"
                class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-white rounded-full px-3 py-1.5 w-60 sm:w-72 border border-emerald-300 shadow-lg z-20"
              >
                <Search class="w-4 h-4 text-emerald-700 mr-2 shrink-0" />
                <input
                  ref="searchInputRef"
                  type="text"
                  v-model="searchInput"
                  placeholder="Tìm món, calo, đạm..."
                  class="w-full bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-hidden"
                />
                <button
                  type="button"
                  @click="toggleSearch"
                  class="text-slate-400 hover:text-slate-600 p-1 text-xs"
                  aria-label="Đóng tìm kiếm"
                >
                  <X class="w-4 h-4" />
                </button>
              </form>
            </transition>

            <!-- Search Trigger Icon Button -->
            <button
              type="button"
              @click="toggleSearch"
              class="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/80 transition-colors"
              title="Tìm kiếm thực phẩm ăn kiêng"
              aria-label="Mở tìm kiếm"
            >
              <Search class="w-5 h-5" />
            </button>
          </div>

          <!-- Cart Icon Button (Only Icon with Count Badge) -->
          <button
            type="button"
            @click="cartStore.openCart()"
            class="relative w-10 h-10 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-800 flex items-center justify-center transition-all shadow-2xs"
            title="Xem giỏ hàng"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingBag class="w-5 h-5 text-emerald-900" />
            <!-- Badge Count -->
            <span
              v-if="cartStore.totalCount > 0"
              class="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
            >
              {{ cartStore.totalCount }}
            </span>
          </button>

          <!-- User Authentication Button -->
          <div v-if="authStore.currentUser && authStore.currentUser.isLoggedIn" class="flex items-center gap-2">
            <div class="flex items-center gap-2 p-1 pr-3 rounded-full border border-emerald-200 bg-emerald-50/60">
              <img
                :src="authStore.currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'"
                :alt="authStore.currentUser.name"
                class="w-8 h-8 rounded-full object-cover border border-emerald-400"
              />
              <span class="text-xs font-bold text-slate-800 hidden sm:inline max-w-[100px] truncate">
                {{ authStore.currentUser.name }}
              </span>
            </div>
            <button
              type="button"
              @click="authStore.logout()"
              class="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>

          <button
            v-else
            type="button"
            @click="authStore.openAuthModal()"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-xs transition-all min-h-[40px]"
            title="Đăng nhập tài khoản"
          >
            <LogIn class="w-4 h-4" />
            <span>Đăng nhập</span>
          </button>

          <!-- Mobile Menu Toggle -->
          <button
            type="button"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="w-10 h-10 rounded-xl text-slate-700 hover:text-emerald-800 md:hidden flex items-center justify-center"
            aria-label="Mở menu di động"
          >
            <X v-if="isMobileMenuOpen" class="w-6 h-6" />
            <Menu v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden py-4 border-t border-slate-100 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200"
      >
        <RouterLink
          to="/"
          @click="isMobileMenuOpen = false"
          exact-active-class="bg-emerald-50 text-emerald-800 font-bold"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Trang chủ
        </RouterLink>

        <RouterLink
          to="/catalog"
          @click="isMobileMenuOpen = false"
          active-class="bg-emerald-50 text-emerald-800 font-bold"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Thực phẩm ăn kiêng
        </RouterLink>

        <RouterLink
          to="/blogs"
          @click="isMobileMenuOpen = false"
          active-class="bg-emerald-50 text-emerald-800 font-bold"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Bài viết
        </RouterLink>
      </div>
    </div>
  </header>
</template>
