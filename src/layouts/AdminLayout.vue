<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Bot,
  BarChart3,
  Settings,
  Bell,
  Calendar,
  Leaf,
  Store,
  ChevronRight,
  Menu,
  X,
} from 'lucide-vue-next';

const route = useRoute();
const isSidebarOpen = ref(false);

const navItems = [
  { path: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Sản phẩm & Kho', icon: Package },
  { path: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart, badge: '12 mới' },
  { path: '/admin/customers', label: 'Khách hàng', icon: Users, badge: '3.8k' },
  { path: '/admin/knowledge-base', label: 'AI Knowledge Base', icon: Bot, badge: 'v2.4' },
];
</script>

<template>
  <div class="min-h-screen flex bg-[#FAF9F5] text-[#2D3B1E]">
    <!-- Mobile Backdrop -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="isSidebarOpen = false"
    ></div>

    <!-- 1. LEFT SIDEBAR (CỐ ĐỊNH TOÀN THỜI GIAN, PROFILE PINNED Ở ĐÁY) -->
    <aside
      class="fixed lg:sticky top-0 bottom-0 left-0 z-50 w-64 h-screen bg-white border-r border-[#E3E8DC] flex flex-col justify-between shrink-0 transition-transform duration-200"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <!-- Top Area: Logo + Navigation Links (Scroll độc lập nếu màn hình nhỏ) -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <!-- Brand Logo -->
        <div class="flex items-center justify-between">
          <RouterLink to="/admin" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-2xl bg-[#536124] text-white flex items-center justify-center shadow-2xs">
              <Leaf class="w-5 h-5 text-[#EBF7E5]" />
            </div>
            <div>
              <span class="font-heading text-lg font-black text-[#2D3B1E] block leading-none">NutriMate</span>
              <span class="text-[9px] font-bold text-[#536124] uppercase tracking-wider block mt-1">ADMIN PORTAL</span>
            </div>
          </RouterLink>

          <button
            type="button"
            @click="isSidebarOpen = false"
            class="lg:hidden p-1 text-[#7A866E]"
            aria-label="Đóng sidebar"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Menu Navigation Links -->
        <div class="space-y-6">
          <!-- Nhóm 1: VẬN HÀNH LÕI -->
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-[#8C9882] uppercase tracking-wider px-3 block mb-2">
              VẬN HÀNH LÕI
            </span>
            <RouterLink
              v-for="item in navItems.slice(0, 4)"
              :key="item.path"
              :to="item.path"
              class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-colors"
              :class="[
                route.path === item.path
                  ? 'bg-[#536124] text-white shadow-xs font-bold hover:bg-[#434F1D] hover:text-white'
                  : 'text-[#576449] hover:bg-[#EBF7E5] hover:text-[#2D3B1E] font-semibold'
              ]"
              @click="isSidebarOpen = false"
            >
              <div class="flex items-center gap-3">
                <component :is="item.icon" class="w-4 h-4" />
                <span>{{ item.label }}</span>
              </div>
              <span
                v-if="item.badge"
                class="px-2 py-0.5 rounded-full text-[9px] font-bold"
                :class="route.path === item.path ? 'bg-white/20 text-white' : 'bg-[#EBF7E5] text-[#536124]'"
              >
                {{ item.badge }}
              </span>
            </RouterLink>
          </div>

          <!-- Nhóm 2: DINH DƯỠNG & TRÍ TUỆ AI -->
          <div class="space-y-1 pt-2 border-t border-[#F0F3EC]">
            <span class="text-[10px] font-bold text-[#8C9882] uppercase tracking-wider px-3 block mb-2">
              DINH DƯỠNG & TRÍ TUỆ AI
            </span>
            <RouterLink
              :to="navItems[4].path"
              class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-colors"
              :class="[
                route.path === navItems[4].path
                  ? 'bg-[#536124] text-white shadow-xs font-bold hover:bg-[#434F1D] hover:text-white'
                  : 'text-[#576449] hover:bg-[#EBF7E5] hover:text-[#2D3B1E] font-semibold'
              ]"
              @click="isSidebarOpen = false"
            >
              <div class="flex items-center gap-3">
                <component :is="navItems[4].icon" class="w-4 h-4" />
                <span>{{ navItems[4].label }}</span>
              </div>
              <span
                class="px-2 py-0.5 rounded-full text-[9px] font-bold"
                :class="route.path === navItems[4].path ? 'bg-white/20 text-white' : 'bg-[#EBF7E5] text-[#536124]'"
              >
                {{ navItems[4].badge }}
              </span>
            </RouterLink>

            <a
              href="#"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#576449] hover:bg-[#EBF7E5] hover:text-[#2D3B1E] transition-colors"
            >
              <BarChart3 class="w-4 h-4" />
              <span>Báo cáo doanh thu</span>
            </a>

            <a
              href="#"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#576449] hover:bg-[#EBF7E5] hover:text-[#2D3B1E] transition-colors"
            >
              <Settings class="w-4 h-4" />
              <span>Cài đặt hệ thống</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom: THẺ TÀI KHOẢN ADMIN (PINNED / CỐ ĐỊNH Ở ĐÁY, KHÔNG CUỘN) -->
      <div class="shrink-0 p-4 border-t border-[#ECEFE7] bg-white">
        <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] flex items-center justify-between shadow-2xs">
          <div class="flex items-center gap-2.5 min-w-0">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
              alt="Admin Avatar"
              class="w-9 h-9 rounded-full object-cover border border-[#CCD7BC]"
            />
            <div class="min-w-0">
              <h4 class="font-heading text-xs font-bold text-[#2D3B1E] truncate">Lê Hoàng Phúc</h4>
              <span class="text-[10px] text-[#7A866E] truncate block">Quản trị viên cấp cao</span>
            </div>
          </div>

          <RouterLink
            to="/"
            title="Quay lại cửa hàng khách hàng"
            class="p-2 text-[#7A866E] hover:text-[#536124] rounded-xl hover:bg-white transition-colors cursor-pointer"
          >
            <Store class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>
    </aside>

    <!-- 2. MAIN CONTENT AREA -->
    <div class="flex-1 flex flex-col min-w-0 min-h-screen">
      <!-- Top Bar -->
      <header class="h-16 bg-white/95 backdrop-blur-md border-b border-[#E3E8DC] px-6 flex items-center justify-between sticky top-0 z-30">
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="isSidebarOpen = true"
            class="lg:hidden p-2 rounded-xl text-[#2D3B1E] hover:bg-[#FAF9F5]"
            aria-label="Mở sidebar"
          >
            <Menu class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-2 text-xs text-[#7A866E]">
            <span class="font-semibold text-[#2D3B1E]">Quản trị viên</span>
            <ChevronRight class="w-3.5 h-3.5" />
            <span class="text-[#536124] font-bold">Hệ thống vận hành</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E]">
            <Calendar class="w-3.5 h-3.5 text-[#536124]" />
            <span>Hôm nay, 24/10/2024</span>
          </div>

          <button
            type="button"
            class="relative w-9 h-9 rounded-full bg-[#FAF9F5] border border-[#E3E8DC] text-[#2D3B1E] flex items-center justify-center hover:bg-[#F6F8F3] cursor-pointer"
            aria-label="Thông báo"
          >
            <Bell class="w-4 h-4" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
          </button>

          <RouterLink
            to="/"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBF7E5] text-xs font-bold text-[#536124] hover:bg-[#536124] hover:text-white transition-colors"
          >
            <Store class="w-3.5 h-3.5" />
            <span>Xem Website</span>
          </RouterLink>
        </div>
      </header>

      <!-- Router View Body -->
      <main class="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        <slot />
      </main>
    </div>
  </div>
</template>
