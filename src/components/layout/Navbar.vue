<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useAuthStore } from '../../stores/authStore';
import {
  Search,
  Leaf,
  ShoppingBag,
  User,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-vue-next';

const router = useRouter();
const cartStore = useCartStore();
const productStore = useProductStore();
const authStore = useAuthStore();

const searchInput = ref('');
const isMobileMenuOpen = ref(false);
const isUserDropdownOpen = ref(false);

function handleSearchSubmit() {
  if (searchInput.value.trim()) {
    productStore.setSearch(searchInput.value.trim());
    router.push({ name: 'catalog' });
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#ECEFE7] transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20 gap-4">
        <!-- 1. BRAND LOGO -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 group shrink-0 focus-visible:outline-none"
        >
          <div class="w-10 h-10 rounded-2xl bg-[#556B2F] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Leaf class="w-5 h-5 text-[#EBF1E6]" />
          </div>
          <span class="font-heading text-2xl font-black tracking-tight text-[#2D3B1E]">
            NutriMate
          </span>
        </RouterLink>

        <!-- 2. SEARCH BAR (Oval Green Tint Pill) -->
        <div class="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-2">
          <form
            @submit.prevent="handleSearchSubmit"
            class="w-full flex items-center bg-[#EBF1E6] hover:bg-[#E5ECE0] focus-within:bg-white rounded-full px-4 py-2 border border-[#C8D7BE] focus-within:border-[#556B2F] focus-within:ring-2 focus-within:ring-[#556B2F]/20 transition-all shadow-2xs"
          >
            <Search class="w-4 h-4 text-[#556B2F] mr-2.5 shrink-0" />
            <input
              type="text"
              v-model="searchInput"
              placeholder="Bạn muốn tìm gì ..."
              class="w-full bg-transparent text-sm text-[#2D3B1E] placeholder-[#7E8B73] outline-none"
            />
          </form>
        </div>

        <!-- 3. MAIN NAVIGATION MENU LINKS -->
        <nav class="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#4A5538]">
          <RouterLink
            to="/"
            exact-active-class="text-[#2D3B1E] font-bold border-b-2 border-[#556B2F]"
            class="py-2 hover:text-[#2D3B1E] transition-colors relative"
          >
            Trang chủ
          </RouterLink>

          <RouterLink
            to="/catalog"
            active-class="text-[#2D3B1E] font-bold border-b-2 border-[#556B2F]"
            class="py-2 hover:text-[#2D3B1E] transition-colors relative"
          >
            Thực phẩm
          </RouterLink>

          <RouterLink
            to="/nutrition"
            active-class="text-[#2D3B1E] font-bold border-b-2 border-[#556B2F]"
            class="py-2 hover:text-[#2D3B1E] transition-colors relative"
          >
            Dinh dưỡng
          </RouterLink>

          <RouterLink
            to="/orders"
            active-class="text-[#2D3B1E] font-bold border-b-2 border-[#556B2F]"
            class="py-2 hover:text-[#2D3B1E] transition-colors relative"
          >
            Đơn hàng
          </RouterLink>

          <RouterLink
            to="/profile"
            active-class="text-[#2D3B1E] font-bold border-b-2 border-[#556B2F]"
            class="py-2 hover:text-[#2D3B1E] transition-colors relative"
          >
            Tài khoản
          </RouterLink>
        </nav>

        <!-- 4. RIGHT SIDE UTILITIES -->
        <div class="flex items-center gap-3 shrink-0">
          <!-- Cart Icon Button with Red Badge -->
          <RouterLink
            to="/cart"
            class="relative w-11 h-11 rounded-full flex items-center justify-center text-[#2D3B1E] hover:bg-[#EBF1E6] transition-colors"
            title="Xem giỏ hàng của bạn"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag class="w-6 h-6 stroke-[1.8]" />
            <span
              v-if="cartStore.totalCount > 0"
              class="absolute 1 top-1 right-1 bg-[#D34538] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
            >
              {{ cartStore.totalCount }}
            </span>
          </RouterLink>

          <!-- User Account Pill Button -->
          <div class="relative">
            <button
              type="button"
              @click="isUserDropdownOpen = !isUserDropdownOpen"
              class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D5DFC8] bg-white hover:bg-[#FAF9F5] text-xs font-bold text-[#2D3B1E] shadow-2xs transition-all"
            >
              <User class="w-4 h-4 text-[#556B2F]" />
              <span class="max-w-[110px] truncate">
                {{ authStore.currentUser ? authStore.currentUser.name : 'Tài khoản' }}
              </span>
              <ChevronDown class="w-3.5 h-3.5 text-[#7E8B73]" />
            </button>

            <!-- User Dropdown Menu -->
            <div
              v-if="isUserDropdownOpen"
              class="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-[#E3E8DC] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div v-if="authStore.currentUser" class="px-4 py-3 border-b border-[#ECEFE7]">
                <p class="text-xs text-[#7E8B73]">Đang đăng nhập với tư cách</p>
                <p class="text-sm font-bold text-[#2D3B1E] truncate">{{ authStore.currentUser.name }}</p>
                <span class="inline-block px-2 py-0.5 mt-1 rounded-full bg-[#EBF1E6] text-[10px] font-bold text-[#556B2F]">
                  {{ authStore.currentUser.membershipTier }} Member • {{ authStore.currentUser.nutriPoints }} pts
                </span>
              </div>

              <RouterLink
                to="/profile"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#2D3B1E] hover:bg-[#F6F8F3] transition-colors"
              >
                <User class="w-4 h-4 text-[#556B2F]" />
                Hồ sơ & Thể trạng BMI
              </RouterLink>

              <RouterLink
                to="/nutrition"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#2D3B1E] hover:bg-[#F6F8F3] transition-colors"
              >
                <Leaf class="w-4 h-4 text-[#556B2F]" />
                Nhật ký Dinh dưỡng & Calo
              </RouterLink>

              <RouterLink
                to="/orders"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#2D3B1E] hover:bg-[#F6F8F3] transition-colors"
              >
                <ShoppingBag class="w-4 h-4 text-[#556B2F]" />
                Đơn hàng & Vận chuyển
              </RouterLink>

              <div class="my-1 border-t border-[#ECEFE7]"></div>

              <RouterLink
                to="/admin"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#556B2F] hover:bg-[#EBF1E6] transition-colors"
              >
                <ShieldCheck class="w-4 h-4 text-[#556B2F]" />
                Trang Quản trị (Admin Portal)
              </RouterLink>

              <button
                v-if="authStore.currentUser"
                type="button"
                @click="authStore.logout(); isUserDropdownOpen = false"
                class="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut class="w-4 h-4" />
                Đăng xuất
              </button>

              <RouterLink
                v-else
                to="/login"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#556B2F] hover:bg-[#EBF1E6]"
              >
                Đăng nhập / Đăng ký
              </RouterLink>
            </div>
          </div>

          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-[#2D3B1E] hover:bg-[#EBF1E6]"
            aria-label="Menu"
          >
            <X v-if="isMobileMenuOpen" class="w-6 h-6" />
            <Menu v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden py-4 border-t border-[#ECEFE7] flex flex-col gap-2"
      >
        <RouterLink
          to="/"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-[#2D3B1E] hover:bg-[#EBF1E6]"
        >
          Trang chủ
        </RouterLink>
        <RouterLink
          to="/catalog"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-[#2D3B1E] hover:bg-[#EBF1E6]"
        >
          Thực phẩm
        </RouterLink>
        <RouterLink
          to="/nutrition"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-[#2D3B1E] hover:bg-[#EBF1E6]"
        >
          Dinh dưỡng
        </RouterLink>
        <RouterLink
          to="/orders"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-[#2D3B1E] hover:bg-[#EBF1E6]"
        >
          Đơn hàng
        </RouterLink>
        <RouterLink
          to="/profile"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-[#2D3B1E] hover:bg-[#EBF1E6]"
        >
          Tài khoản
        </RouterLink>
        <RouterLink
          to="/admin"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2 rounded-xl text-sm font-bold text-[#556B2F] bg-[#EBF1E6]"
        >
          Quản trị viên (Admin)
        </RouterLink>
      </div>
    </div>
  </header>
</template>
