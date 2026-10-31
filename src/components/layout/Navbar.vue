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
  LogOut,
  ChevronDown,
  ShieldCheck,
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
  <header class="sticky top-0 z-40 bg-[#FEFDF8] border-b border-[#E8E7DD] transition-all">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <div class="flex items-center justify-between h-[82px] gap-4">
        <!-- 1. BRAND LOGO -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 group shrink-0 focus-visible:outline-none"
        >
          <div class="w-10 h-10 rounded-2xl bg-[#6B7A3A] flex items-center justify-center text-white shadow-2xs transition-transform group-hover:scale-105">
            <Leaf class="w-5 h-5 text-[#EBF7E5]" />
          </div>
          <span class="font-heading text-2xl font-black tracking-tight text-[#242424]">
            NutriMate
          </span>
        </RouterLink>

        <!-- 2. SEARCH BAR (Oval Green Tint Pill) -->
        <div class="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-4">
          <form
            @submit.prevent="handleSearchSubmit"
            class="w-full flex items-center bg-[#EBF7E5] hover:bg-[#E2F0DC] focus-within:bg-white rounded-full px-4 py-2 border border-[#C8D7BE] focus-within:border-[#6B7A3A] focus-within:ring-2 focus-within:ring-[#6B7A3A]/20 transition-all shadow-2xs"
          >
            <Search class="w-4 h-4 text-[#6B7A3A] mr-2.5 shrink-0" />
            <input
              type="text"
              v-model="searchInput"
              placeholder="Bạn muốn tìm gì ..."
              class="w-full bg-transparent text-sm text-[#242424] placeholder-[#7A866E] outline-none"
            />
          </form>
        </div>

        <!-- 3. MAIN NAVIGATION MENU LINKS -->
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
            Thực phẩm
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

          <RouterLink
            to="/profile"
            active-class="text-[#242424] border-b-[2.5px] border-[#6B7A3A] pb-0.5"
            class="py-1 hover:text-[#6B7A3A] transition-colors relative"
          >
            Tài khoản
          </RouterLink>
        </nav>

        <!-- 4. RIGHT SIDE UTILITIES -->
        <div class="flex items-center gap-3.5 shrink-0">
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
              class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D0D3BE] bg-white hover:bg-[#FEFDF8] text-xs font-bold text-[#242424] shadow-2xs transition-all"
            >
              <User class="w-4 h-4 text-[#6B7A3A]" />
              <span class="max-w-[110px] truncate">
                {{ authStore.currentUser ? authStore.currentUser.name : 'Tài khoản' }}
              </span>
              <ChevronDown class="w-3.5 h-3.5 text-[#7A866E]" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isUserDropdownOpen"
              class="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-[#E3E8DC] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div v-if="authStore.currentUser" class="px-4 py-3 border-b border-[#ECEFE7]">
                <p class="text-xs text-[#7A866E]">Tài khoản cá nhân</p>
                <p class="text-sm font-bold text-[#242424] truncate">{{ authStore.currentUser.name }}</p>
                <span class="inline-block px-2 py-0.5 mt-1 rounded-full bg-[#EBF7E5] text-[10px] font-bold text-[#6B7A3A]">
                  {{ authStore.currentUser.membershipTier }} Member • {{ authStore.currentUser.nutriPoints }} pts
                </span>
              </div>

              <RouterLink
                to="/profile"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#242424] hover:bg-[#F6F8F3] transition-colors"
              >
                <User class="w-4 h-4 text-[#6B7A3A]" />
                Hồ sơ & Thể trạng BMI
              </RouterLink>

              <RouterLink
                to="/nutrition"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#242424] hover:bg-[#F6F8F3] transition-colors"
              >
                <Leaf class="w-4 h-4 text-[#6B7A3A]" />
                Nhật ký Dinh dưỡng & Calo
              </RouterLink>

              <RouterLink
                to="/orders"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#242424] hover:bg-[#F6F8F3] transition-colors"
              >
                <ShoppingBag class="w-4 h-4 text-[#6B7A3A]" />
                Đơn hàng & Vận chuyển
              </RouterLink>

              <RouterLink
                v-if="authStore.currentUser?.role === 'admin'"
                to="/admin"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#6B7A3A] hover:bg-[#EBF7E5] transition-colors"
              >
                <ShieldCheck class="w-4 h-4 text-[#6B7A3A]" />
                Trang Quản trị
              </RouterLink>

              <div class="my-1 border-t border-[#ECEFE7]"></div>

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
                class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#6B7A3A] hover:bg-[#EBF7E5]"
              >
                Đăng nhập / Đăng ký
              </RouterLink>
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
          to="/profile"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#242424] hover:bg-[#EBF7E5]"
        >
          Tài khoản
        </RouterLink>
        <RouterLink
          v-if="authStore.currentUser?.role === 'admin'"
          to="/admin"
          @click="isMobileMenuOpen = false"
          class="px-4 py-2.5 rounded-xl text-sm font-bold text-[#6B7A3A] bg-[#EBF7E5]"
        >
          Trang Quản trị
        </RouterLink>
      </div>
    </div>
  </header>
</template>
