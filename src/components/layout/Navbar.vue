<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchProducts } from '../../services/api';
import type { Product } from '../../types';
import {
  Search,
  Leaf,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserRoundPen,
  ChevronRight,
  ShieldCheck,
  Clock3,
  X as ClearIcon,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const productStore = useProductStore();
const authStore = useAuthStore();
const nextTierPoints = 500;

const searchInput = ref('');
const searchResults = ref<Product[]>([]);
const recentSearches = ref<string[]>([]);
const isSearchFocused = ref(false);
const isMobileSearchOpen = ref(false);
const isSearching = ref(false);
const searchError = ref('');
const isMobileMenuOpen = ref(false);
const isUserDropdownOpen = ref(false);
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;
let searchRequestId = 0;
const recentSearchesStorageKey = 'nutrimate.recent-searches';

try {
  const savedSearches = window.localStorage.getItem(recentSearchesStorageKey);
  if (savedSearches) {
    const parsed: unknown = JSON.parse(savedSearches);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) {
      recentSearches.value = parsed.slice(0, 5);
    }
  }
} catch (error: unknown) {
  console.warn('[Navbar] Không thể tải lịch sử tìm kiếm:', error);
}

const currentPoints = computed(() =>
  Math.max(0, Number(authStore.currentUser?.nutriPoints ?? 0))
);

const pointsProgress = computed(() =>
  Math.min((currentPoints.value / nextTierPoints) * 100, 100)
);

function handleSearchSubmit() {
  const query = searchInput.value.trim();
  if (!query) return;
  saveRecentSearch(query);
  closeSearchSuggestions();
  productStore.setSearch(query);
  void router.push({ name: 'catalog' });
}

function saveRecentSearch(query: string) {
  recentSearches.value = [
    query,
    ...recentSearches.value.filter((item) => item.toLocaleLowerCase() !== query.toLocaleLowerCase()),
  ].slice(0, 5);

  try {
    window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(recentSearches.value));
  } catch (error: unknown) {
    console.warn('[Navbar] Không thể lưu lịch sử tìm kiếm:', error);
  }
}

function handleSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchError.value = '';
  searchResults.value = [];
  const query = searchInput.value.trim();
  if (!query) {
    searchRequestId += 1;
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  const requestId = ++searchRequestId;
  searchDebounceTimer = setTimeout(async () => {
    try {
      const result = await fetchProducts({ search: query, limit: 5 });
      if (requestId === searchRequestId) searchResults.value = result.products;
    } catch (error: unknown) {
      if (requestId === searchRequestId) {
        searchError.value = 'Không thể tải gợi ý sản phẩm.';
        console.error('[Navbar] Không thể tải gợi ý tìm kiếm:', error);
      }
    } finally {
      if (requestId === searchRequestId) isSearching.value = false;
    }
  }, 250);
}

function selectRecentSearch(query: string) {
  searchInput.value = query;
  handleSearchSubmit();
}

function selectSearchProduct(product: Product) {
  saveRecentSearch(product.name);
  searchInput.value = product.name;
  closeSearchSuggestions();
  isMobileSearchOpen.value = false;
  void router.push({ name: 'product-detail', params: { id: product.id } });
}

function closeSearchSuggestions() {
  isSearchFocused.value = false;
}

function handleSearchBlur() {
  window.setTimeout(() => {
    isSearchFocused.value = false;
  }, 120);
}

function clearSearchInput() {
  searchRequestId += 1;
  searchInput.value = '';
  searchResults.value = [];
  searchError.value = '';
  isSearching.value = false;
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0] ?? '').join('').toUpperCase();
}

async function handleCustomerLogout() {
  await authStore.logout();
  isUserDropdownOpen.value = false;
  await router.replace({ name: 'home' });
}

onBeforeUnmount(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
});
</script>

<template>
  <header class="sticky top-0 z-40 bg-[#FEFDF8] border-b border-[#E8E7DD] transition-all">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <div class="flex items-center justify-between h-[82px] gap-4">
        <!-- BRAND LOGO -->
        <RouterLink
          to="/"
          class="flex items-center shrink-0 focus-visible:outline-none
                transition-transform duration-200 hover:scale-[1.03]"
        >
          <img
            src="../../public/logo_nutrimate_transparent.png"
            alt="NutriMate"
            class="h-10 w-auto max-w-[165px] object-contain sm:h-11 sm:max-w-[180px]"
          />
        </RouterLink>

        <!-- SEARCH BAR -->
        <div class="relative mx-2 hidden max-w-[260px] flex-1 md:block lg:mx-4 lg:max-w-[320px]">
          <form
            @submit.prevent="handleSearchSubmit"
            class="flex h-10 w-full items-center rounded-xl border border-[#D5DFC8] bg-[#F5F7F1] px-3 transition-all focus-within:border-[#8E966D] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6B7A3A]/15"
          >
            <Search class="mr-2 h-4 w-4 shrink-0 text-[#6B7A3A]" />
            <input
              type="text"
              v-model="searchInput"
              @input="handleSearchInput"
              @focus="isSearchFocused = true"
              @blur="handleSearchBlur"
              placeholder="Tìm sản phẩm..."
              class="min-w-0 flex-1 bg-transparent text-xs text-[#242424] outline-none placeholder:text-[#7A866E]"
              role="combobox"
              aria-label="Tìm kiếm sản phẩm"
              aria-autocomplete="list"
              :aria-expanded="isSearchFocused"
            />
            <button v-if="searchInput" type="button" class="ml-1 rounded-full p-1 text-[#7A866E] hover:bg-[#EBF1E3]" aria-label="Xóa tìm kiếm" @mousedown.prevent @click="clearSearchInput">
              <ClearIcon class="h-3.5 w-3.5" />
            </button>
          </form>

          <Transition name="search-dropdown">
            <div
              v-if="isSearchFocused && (searchInput.trim() || recentSearches.length)"
              class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#E3E8DC] bg-white shadow-[0_16px_40px_rgba(45,59,30,0.16)]"
              role="listbox"
            >
              <div v-if="searchInput.trim()" class="border-b border-[#F0F3EC] px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#7A866E]">
                Gợi ý sản phẩm
              </div>
              <p v-if="isSearching" class="px-4 py-3 text-xs text-[#7A866E]">Đang tìm sản phẩm...</p>
              <p v-else-if="searchError" role="alert" class="px-4 py-3 text-xs text-rose-600">{{ searchError }}</p>
              <button
                v-for="product in searchResults"
                :key="product.id"
                type="button"
                role="option"
                class="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#F5F7F1]"
                @mousedown.prevent
                @click="selectSearchProduct(product)"
              >
                <img :src="product.image" :alt="product.name" class="h-10 w-10 shrink-0 rounded-lg bg-[#F0F3EC] object-cover" />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-xs font-semibold text-[#242424]">{{ product.name }}</span>
                  <span class="mt-0.5 block text-[10px] text-[#6B7A3A]">{{ new Intl.NumberFormat('vi-VN').format(product.price) }}₫</span>
                </span>
              </button>
              <p v-if="searchInput.trim() && !isSearching && !searchError && searchResults.length === 0" class="px-4 py-3 text-xs text-[#7A866E]">
                Chưa tìm thấy sản phẩm phù hợp.
              </p>
              <div v-if="recentSearches.length" class="border-t border-[#F0F3EC] px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#7A866E]">
                Tìm gần đây
              </div>
              <button
                v-for="(query, index) in recentSearches"
                :key="`${query}-${index}`"
                type="button"
                role="option"
                class="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-[#576449] transition-colors hover:bg-[#F5F7F1]"
                @mousedown.prevent
                @click="selectRecentSearch(query)"
              >
                <Clock3 class="h-3.5 w-3.5 shrink-0 text-[#8E966D]" />
                <span class="truncate">{{ query }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- MAIN NAVIGATION MENU LINKS -->
        <nav class="hidden lg:flex items-center gap-8 text-sm font-bold text-[#333333]">
          <RouterLink
            to="/"
            exact-active-class="text-[#242424] border-b-[2.5px] border-[#6B7A3A] pb-0.5"
            class="py-1 hover:text-[#6B7A3A] transition-colors relative"
          >
            Trang chủ
          </RouterLink>

          <RouterLink
            to="/catalog"
            active-class="text-[#242424] border-b-[2.5px] border-[#6B7A3A] pb-0.5"
            class="py-1 hover:text-[#6B7A3A] transition-colors relative"
          >
            Sản phẩm
          </RouterLink>

          <RouterLink
            to="/nutrition"
            active-class="text-[#242424] border-b-[2.5px] border-[#6B7A3A] pb-0.5"
            class="py-1 hover:text-[#6B7A3A] transition-colors relative"
          >
            Dinh dưỡng
          </RouterLink>

          <RouterLink
            to="/orders"
            active-class="text-[#242424] border-b-[2.5px] border-[#6B7A3A] pb-0.5"
            class="py-1 hover:text-[#6B7A3A] transition-colors relative"
          >
            Đơn hàng
          </RouterLink>
        </nav>

        <!-- RIGHT SIDE UTILITIES -->
        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            @click="isMobileSearchOpen = !isMobileSearchOpen"
            class="flex h-10 w-10 items-center justify-center rounded-full text-[#3B4E24] transition-colors hover:bg-[#EBF1E3] md:hidden"
            :aria-label="isMobileSearchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm sản phẩm'"
          >
            <ClearIcon v-if="isMobileSearchOpen" class="h-5 w-5" />
            <Search v-else class="h-5 w-5" />
          </button>
          <!-- Cart Icon Button with Red Badge (Figma Style & Drawer Trigger) -->
          <button
            type="button"
            @click="cartStore.openCart()"
            class="relative w-11 h-11 rounded-full flex items-center justify-center text-[#242424] hover:bg-[#EBF7E5] transition-colors cursor-pointer"
            title="Xem giỏ hàng của bạn"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag class="w-6 h-6 stroke-[1.8]" />
            <span
              v-if="cartStore.totalCount > 0"
              class="absolute top-1 right-1 bg-[#C5281C] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs"
            >
              {{ cartStore.totalCount }}
            </span>
          </button>

          <!-- User Account Pill Button -->
          <div class="relative">
            <button
              type="button"
              @click="isUserDropdownOpen = !isUserDropdownOpen"
              class="inline-flex items-center gap-2 rounded-full border border-[#D0D3BE] bg-white px-2 py-1.5 text-xs font-bold text-[#242424] shadow-2xs transition-all hover:bg-[#FEFDF8] sm:px-3"
            >
              <span class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#EBF1E3] text-[10px] font-bold text-[#536124]">
                <img v-if="authStore.currentUser?.avatar" :src="authStore.currentUser.avatar" alt="" class="h-full w-full object-cover" />
                <span v-else>{{ authStore.currentUser ? getInitials(authStore.currentUser.name) : '' }}<User v-if="!authStore.currentUser" class="h-4 w-4 text-[#6B7A3A]" /></span>
              </span>
              <span class="hidden max-w-[110px] truncate sm:inline">
                {{ authStore.currentUser ? authStore.currentUser.name : 'Tài khoản' }}
              </span>
              <ChevronDown class="hidden h-3.5 w-3.5 text-[#7A866E] sm:block" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isUserDropdownOpen"
              class="absolute right-0 mt-3 w-[300px] origin-top-right rounded-xl border border-[#E8EBDD] bg-white
                    z-50 overflow-hidden shadow-[0_12px_40px_rgba(35,50,25,0.14)] animate-in fade-in slide-in-from-top-2 duration-200 sm:w-[280px]"
            >
              <!-- User Information -->
              <div v-if="authStore.currentUser" class="p-5 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold tracking-wider text-[#8A927E] uppercase">
                    Tài khoản cá nhân
                  </span>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EDF3E5]">
                    <img
                      v-if="authStore.currentUser?.avatar"
                      :src="authStore.currentUser.avatar"
                      alt="Avatar"
                      class="w-full h-full rounded-full object-cover border border-[#D0D3BE]"
                    />

                    <div v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDF3E5]">
                      <User class="w-4 h-4 text-[#6B7A3A]" />
                    </div>
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold text-[#242424] truncate">
                      {{ authStore.currentUser.name }}
                    </p>

                    <p class="text-xs text-[#8A927E] mt-1">
                      {{ authStore.currentUser.email}}
                    </p>
                  </div>
                </div>
              </div>

              <!-- GUEST INFORMATION -->
              <div v-else class="p-5">
                <p class="text-sm font-bold text-[#242424]">
                  Chào mừng đến với NutriMate!
                </p>
                <p class="text-xs text-[#8A927E] mt-1">
                  Đăng nhập để trải nghiệm đầy đủ các tính năng.
                </p>
              </div>

              <div class="border-t border-[#ECEFE7]"></div>

              <!-- Account Actions -->
              <div v-if="authStore.currentUser" class="p-2.5 space-y-1">

                <RouterLink
                  v-if="authStore.currentUser"
                  to="/profile"
                  @click="isUserDropdownOpen = false"
                  class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F4F7EF] transition-colors group"
                >
                  <UserRoundPen class="w-[19px] h-[19px] text-[#71813B]" />

                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-[#333333]">
                      Hồ sơ cá nhân
                    </p>
                  </div>

                  <ChevronRight
                    class="w-4 h-4 text-[#A3AA98] group-hover:text-[#71813B]"
                  />
                </RouterLink>

                <RouterLink
                  v-if="authStore.currentUser?.role === 'admin'"
                  to="/admin"
                  @click="isUserDropdownOpen = false"
                  class="flex items-center gap-3 rounded-xl bg-[#F4F7EF] px-3 py-3 transition-colors group hover:bg-[#EBF7E5]"
                >
                  <ShieldCheck class="h-[19px] w-[19px] text-[#536124]" />
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-bold text-[#2D3B1E]">Về trang quản trị</p>
                    <p class="mt-0.5 text-[11px] text-[#7A866E]">Mở bảng điều khiển admin</p>
                  </div>
                  <ChevronRight class="h-4 w-4 text-[#A3AA98] group-hover:text-[#536124]" />
                </RouterLink>

                <RouterLink v-if="authStore.currentUser" to="/nutrition" @click="isUserDropdownOpen = false" class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F4F7EF] transition-colors group">
                  <Leaf class="w-[19px] h-[19px] text-[#71813B]" />

                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-[#333333]">
                      Nhật ký Dinh dưỡng & Calo
                    </p>
                  </div>

                  <ChevronRight
                    class="w-4 h-4 text-[#A3AA98] group-hover:text-[#71813B]"
                  />
                </RouterLink>

                <RouterLink  to="/orders" @click="isUserDropdownOpen = false" class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F4F7EF] transition-colors group">
                  <ShoppingBag class="w-[19px] h-[19px] text-[#71813B]" />

                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-[#333333]">
                       Đơn hàng & Vận chuyển
                    </p>
                  </div>

                  <ChevronRight
                    class="w-4 h-4 text-[#A3AA98] group-hover:text-[#71813B]"
                  />
                </RouterLink>
              </div>

              <!-- Login -->
              <div v-else class="p-3">
                <RouterLink
                  :to="{ name: 'login', query: { redirect: route.fullPath } }"
                  @click="isUserDropdownOpen = false"
                  class="flex items-center justify-center gap-2 w-full
                        py-3 rounded-xl bg-[#71813B] text-white
                        text-sm font-bold hover:bg-[#5F6D32] transition-colors"
                >
                  <User class="w-4 h-4" />
                  Đăng nhập / Đăng ký
                </RouterLink>
              </div>

              <!-- Logout -->
              <div v-if="authStore.currentUser" class="border-t border-[#ECEFE7] p-2.5">
                <button
                  type="button"
                  @click="handleCustomerLogout"
                  class="w-full flex items-center gap-3 px-3 py-1 rounded-xl
                        text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut class="w-[19px] h-[19px]" />

                  <span class="text-[13px] font-semibold">
                    Đăng xuất
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-[#242424] hover:bg-[#EBF7E5]"
            aria-label="Menu"
          >
            <X v-if="isMobileMenuOpen" class="w-6 h-6" />
            <Menu v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <Transition name="search-dropdown">
        <div v-if="isMobileSearchOpen" class="relative border-t border-[#ECEFE7] py-3 md:hidden">
          <form @submit.prevent="handleSearchSubmit" class="flex h-11 items-center gap-2 rounded-xl border border-[#D5DFC8] bg-[#F5F7F1] px-3 focus-within:border-[#8E966D] focus-within:bg-white">
            <Search class="h-4 w-4 shrink-0 text-[#6B7A3A]" />
            <input
              v-model="searchInput"
              type="search"
              placeholder="Tìm sản phẩm..."
              class="min-w-0 flex-1 bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#7A866E]"
              @input="handleSearchInput"
              @focus="isSearchFocused = true"
              @blur="handleSearchBlur"
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" class="rounded-lg bg-[#4D6A34] px-3 py-2 text-xs font-bold text-white">Tìm</button>
          </form>
          <div
            v-if="isSearchFocused && (searchInput.trim() || recentSearches.length)"
            class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#E3E8DC] bg-white shadow-[0_16px_40px_rgba(45,59,30,0.16)]"
          >
            <p v-if="isSearching" class="px-4 py-3 text-xs text-[#7A866E]">Đang tìm sản phẩm...</p>
            <p v-else-if="searchError" role="alert" class="px-4 py-3 text-xs text-rose-600">{{ searchError }}</p>
            <template v-else-if="searchInput.trim()">
              <button v-for="product in searchResults" :key="product.id" type="button" class="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#F5F7F1]" @mousedown.prevent @click="selectSearchProduct(product)">
                <img :src="product.image" :alt="product.name" class="h-10 w-10 shrink-0 rounded-lg bg-[#F0F3EC] object-cover" />
                <span class="truncate text-xs font-semibold text-[#242424]">{{ product.name }}</span>
              </button>
              <p v-if="!searchResults.length && !isSearching" class="px-4 py-3 text-xs text-[#7A866E]">Chưa tìm thấy sản phẩm phù hợp.</p>
            </template>
            <template v-if="recentSearches.length">
              <p class="border-t border-[#F0F3EC] px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#7A866E]">Tìm gần đây</p>
              <button v-for="(query, index) in recentSearches" :key="`${query}-${index}`" type="button" class="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-[#576449] hover:bg-[#F5F7F1]" @mousedown.prevent @click="selectRecentSearch(query)">
                <Clock3 class="h-3.5 w-3.5 shrink-0 text-[#8E966D]" />
                <span class="truncate">{{ query }}</span>
              </button>
            </template>
          </div>
        </div>
      </Transition>

      <!-- Mobile Dropdown Navigation -->
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden py-4 border-t border-[#ECEFE7] flex flex-col gap-2"
      >
        <RouterLink
          to="/"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#242424] hover:bg-[#EBF7E5]"
        >
          Trang chủ
        </RouterLink>
        <RouterLink
          to="/catalog"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#242424] hover:bg-[#EBF7E5]"
        >
          Thực phẩm
        </RouterLink>
        <RouterLink
          to="/nutrition"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#242424] hover:bg-[#EBF7E5]"
        >
          Dinh dưỡng
        </RouterLink>
        <RouterLink
          to="/orders"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#242424] hover:bg-[#EBF7E5]"
        >
          Đơn hàng
        </RouterLink>
        <RouterLink
          v-if="authStore.currentUser?.role === 'admin'"
          to="/admin"
          @click="isMobileMenuOpen = false"
          class="mx-2 flex items-center gap-2 rounded-xl bg-[#536124] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#434F1D]"
        >
          <ShieldCheck class="h-4 w-4" />
          Về trang quản trị
        </RouterLink>
      </div>
    </div>
  </header>
</template>
