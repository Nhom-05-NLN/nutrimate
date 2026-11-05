<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
  UserRoundPen,
  MapPin,
  Settings,
  ChevronRight,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const productStore = useProductStore();
const authStore = useAuthStore();
const nextTierPoints = 500;

const searchInput = ref('');
const isMobileMenuOpen = ref(false);
const isUserDropdownOpen = ref(false);

const currentPoints = computed(() =>
  Math.max(0, Number(authStore.currentUser?.nutriPoints ?? 0))
);

const pointsProgress = computed(() =>
  Math.min((currentPoints.value / nextTierPoints) * 100, 100)
);

function handleSearchSubmit() {
  if (searchInput.value.trim()) {
    productStore.setSearch(searchInput.value.trim());
    router.push({ name: 'catalog' });
  }
}

async function handleCustomerLogout() {
  await authStore.logout();
  isUserDropdownOpen.value = false;
  await router.replace({ name: 'home' });
}
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
            src="../../public/logo_nutrimate.png"
            alt="NutriMate"
            class="h-14 sm:h-15 w-auto max-w-[220px] object-contain"
          />
        </RouterLink>

        <!-- SEARCH BAR -->
        <div class="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-4">
          <form
            @submit.prevent="handleSearchSubmit"
            class="w-full flex items-center bg-[#EBF7E5] hover:bg-[#E2F0DC] focus-within:bg-white rounded-[8px] px-4 py-2 border border-[#C8D7BE] focus-within:border-[#6B7A3A] focus-within:ring-2 focus-within:ring-[#6B7A3A]/20 transition-all shadow-2xs"
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
            v-if="authStore.currentUser"
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
        <div class="flex items-center gap-3.5 shrink-0">
          <RouterLink
            to="/cart"
            class="relative w-11 h-11 rounded-full flex items-center justify-center text-[#242424] hover:bg-[#EBF7E5] transition-colors"
            title="Xem giỏ hàng của bạn"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag class="w-6 h-6 stroke-[1.8]" />
            <span
              v-if="cartStore.totalCount > 0"
              class="absolute top-1 right-1 bg-[#C5281C] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
            >
              {{ cartStore.totalCount }}
            </span>
          </RouterLink>

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
              class="absolute right-0 mt-3 w-[300px] sm:w-[280px]
                    bg-white rounded-xl shadow-[0_12px_40px_rgba(35,50,25,0.14)]
                    border border-[#E8EBDD] overflow-hidden z-50
                    animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <!-- User Information -->
              <div v-if="authStore.currentUser" class="p-5 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold tracking-wider text-[#8A927E] uppercase">
                    Tài khoản cá nhân
                  </span>
                </div>

                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-[#EDF3E5] flex items-center justify-center shrink-0">
                    <img
                      v-if="authStore.currentUser?.avatar"
                      :src="authStore.currentUser.avatar"
                      alt="Avatar"
                      class="w-full h-full rounded-full object-cover border border-[#D0D3BE]"
                    />

                    <div v-else class="w-7 h-7 rounded-full bg-[#EDF3E5] flex items-center justify-center">
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
          v-if="authStore.currentUser"
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
