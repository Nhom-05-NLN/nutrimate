<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  fetchAdminCustomers,
  fetchAdminNotifications,
  markAdminNotificationsRead,
  markAdminNotificationRead,
  deleteAdminNotification,
  deleteAllAdminNotifications,
  AdminNotification,
} from '../services/api';
import { useAuthStore } from '../stores/authStore';
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
  Camera,
  Pencil,
  Save,
  LogOut,

  FolderTree,

  Boxes,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isSidebarOpen = ref(false);
const isAccountDetailsOpen = ref(false);
const isNotificationsOpen = ref(false);
const notifications = ref<AdminNotification[]>([]);
const unreadNotificationCount = ref(0);
const notificationPopup = ref<AdminNotification | null>(null);
const notificationsLoading = ref(true);
const notificationsError = ref('');
const notificationActionError = ref('');
const markingNotificationsRead = ref(false);
const deletingNotificationIds = ref(new Set<string>());
const deletingAllNotifications = ref(false);
const isEditingAccount = ref(false);
const accountSaving = ref(false);
const avatarSaving = ref(false);
const accountError = ref('');
const avatarError = ref('');
const avatarInput = ref<HTMLInputElement | null>(null);
const accountForm = ref({ name: '', email: '', phone: '' });
const customerCount = ref<number | null>(null);
let notificationPollTimer: number | null = null;
let notificationPopupTimer: number | null = null;
let notificationRequestInFlight = false;
let notificationSnapshotInitialized = false;

function openAccountDetails() {
  const user = authStore.currentUser;
  if (!user) return;
  accountForm.value = { name: user.name, email: user.email, phone: user.phone };
  accountError.value = '';
  avatarError.value = '';
  isEditingAccount.value = false;
  isAccountDetailsOpen.value = true;
}

function cancelAccountEdit() {
  const user = authStore.currentUser;
  if (user) accountForm.value = { name: user.name, email: user.email, phone: user.phone };
  accountError.value = '';
  isEditingAccount.value = false;
}

async function saveAccountDetails() {
  accountSaving.value = true;
  accountError.value = '';
  try {
    const savedUser = await authStore.updateAccountProfile(accountForm.value);
    accountForm.value = {
      name: savedUser.name,
      email: savedUser.email,
      phone: savedUser.phone,
    };
    isEditingAccount.value = false;
  } catch (error: unknown) {
    accountError.value = error instanceof Error
      ? error.message
      : 'Không thể cập nhật thông tin tài khoản.';
  } finally {
    accountSaving.value = false;
  }
}

async function handleAvatarChange(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const file = input.files?.[0];
  input.value = '';
  avatarError.value = '';
  if (!file) return;

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    avatarError.value = 'Chọn ảnh JPEG, PNG hoặc WebP.';
    return;
  }
  if (file.size > 5_000_000) {
    avatarError.value = 'Ảnh gốc phải nhỏ hơn 5 MB.';
    return;
  }

  avatarSaving.value = true;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 384 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      throw new Error('Không thể xử lý ảnh đại diện.');
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result
          ? resolve(result)
          : reject(new Error('Không thể nén ảnh đại diện.')),
        'image/webp',
        0.72,
      );
    });
    if (blob.size > 750_000) {
      throw new Error('Ảnh sau khi xử lý vẫn quá lớn. Vui lòng chọn ảnh khác.');
    }

    const avatar = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Không thể đọc ảnh đã xử lý.'));
          return;
        }
        resolve(reader.result);
      });
      reader.addEventListener('error', () => {
        reject(reader.error ?? new Error('Không thể đọc ảnh đã xử lý.'));
      });
      reader.readAsDataURL(blob);
    });
    await authStore.updateAvatar(avatar);
  } catch (error: unknown) {
    avatarError.value = error instanceof Error
      ? error.message
      : 'Không thể cập nhật ảnh đại diện.';
  } finally {
    avatarSaving.value = false;
  }
}

async function loadCustomerCount() {
  try {
    const result = await fetchAdminCustomers({ limit: 1, includeAvatars: false });
    customerCount.value = result.totalCustomers;
  } catch (error: unknown) {
    console.error(
      '[AdminLayout] Không thể tải tổng số khách hàng:',
      error instanceof Error ? error.message : 'Lỗi không xác định',
    );
    customerCount.value = null;
  }
}

async function loadAdminNotifications() {
  if (notificationRequestInFlight) return;
  notificationRequestInFlight = true;
  try {
    const result = await fetchAdminNotifications();
    const knownNotificationIds = new Set(notifications.value.map((notification) => notification.id));
    const newNotifications = notificationSnapshotInitialized
      ? result.notifications.filter((notification) => !knownNotificationIds.has(notification.id))
      : [];
    notifications.value = result.notifications;
    unreadNotificationCount.value = result.unreadCount;
    notificationsError.value = '';
    notificationSnapshotInitialized = true;
    if (newNotifications.length) {
      showNotificationPopup(newNotifications[0]);
      if (newNotifications.some((notification) => notification.type === 'customer_registered')) {
        void loadCustomerCount();
      }
    }
  } catch (error: unknown) {
    notificationsError.value = error instanceof Error
      ? error.message
      : 'Không thể tải thông báo quản trị.';
    console.error('[AdminLayout] Không thể tải thông báo quản trị:', error);
  } finally {
    notificationsLoading.value = false;
    notificationRequestInFlight = false;
  }
}

async function markNotificationsRead() {
  markingNotificationsRead.value = true;
  notificationsError.value = '';
  try {
    await markAdminNotificationsRead();
    notifications.value = notifications.value.map((notification) => ({
      ...notification,
      readAt: notification.readAt ?? new Date().toISOString(),
    }));
    unreadNotificationCount.value = 0;
  } catch (error: unknown) {
    notificationsError.value = error instanceof Error
      ? error.message
      : 'Không thể cập nhật trạng thái thông báo.';
    console.error('[AdminLayout] Không thể đánh dấu thông báo đã đọc:', error);
  } finally {
    markingNotificationsRead.value = false;
  }
}

async function openNotification(notification: AdminNotification) {
  if (!notification.readAt) {
    notificationActionError.value = '';
    try {
      await markAdminNotificationRead(notification.id);
      notifications.value = notifications.value.map((item) =>
        item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
      );
      unreadNotificationCount.value = Math.max(0, unreadNotificationCount.value - 1);
    } catch (error: unknown) {
      notificationActionError.value = error instanceof Error
        ? error.message
        : 'Không thể cập nhật trạng thái thông báo.';
      console.error('[AdminLayout] Không thể đánh dấu thông báo đã đọc:', error);
      return;
    }
  }
  closeNotifications();
  await router.push(
    notification.type === 'customer_registered' || notification.type === 'customer_logged_in'
      ? '/admin/customers'
      : '/admin',
  );
}

async function removeNotification(notification: AdminNotification) {
  if (deletingNotificationIds.value.has(notification.id)) return;
  deletingNotificationIds.value = new Set(deletingNotificationIds.value).add(notification.id);
  notificationsError.value = '';
  try {
    await deleteAdminNotification(notification.id);
    notifications.value = notifications.value.filter((item) => item.id !== notification.id);
    if (!notification.readAt) {
      unreadNotificationCount.value = Math.max(0, unreadNotificationCount.value - 1);
    }
  } catch (error: unknown) {
    notificationsError.value = error instanceof Error ? error.message : 'Không thể xóa thông báo.';
    console.error('[AdminLayout] Không thể xóa thông báo:', error);
  } finally {
    const remaining = new Set(deletingNotificationIds.value);
    remaining.delete(notification.id);
    deletingNotificationIds.value = remaining;
  }
}

async function clearAllNotifications() {
  if (!notifications.value.length || deletingAllNotifications.value) return;
  if (!window.confirm('Xóa tất cả thông báo? Thao tác này không thể hoàn tác.')) return;

  deletingAllNotifications.value = true;
  notificationsError.value = '';
  try {
    await deleteAllAdminNotifications();
    notifications.value = [];
    unreadNotificationCount.value = 0;
  } catch (error: unknown) {
    notificationsError.value = error instanceof Error
      ? error.message
      : 'Không thể xóa tất cả thông báo.';
    console.error('[AdminLayout] Không thể xóa tất cả thông báo:', error);
  } finally {
    deletingAllNotifications.value = false;
  }
}

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Thời gian không xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function openNotifications() {
  dismissNotificationPopup();
  isNotificationsOpen.value = true;
  void loadAdminNotifications();
}

function showNotificationPopup(notification: AdminNotification) {
  notificationPopup.value = notification;
  if (notificationPopupTimer !== null) window.clearTimeout(notificationPopupTimer);
  notificationPopupTimer = window.setTimeout(dismissNotificationPopup, 6000);
}

function dismissNotificationPopup() {
  notificationPopup.value = null;
  if (notificationPopupTimer !== null) {
    window.clearTimeout(notificationPopupTimer);
    notificationPopupTimer = null;
  }
}

onMounted(() => {
  void loadCustomerCount();
  void loadAdminNotifications();
  notificationPollTimer = window.setInterval(() => {
    void loadAdminNotifications();
  }, 15_000);
  window.addEventListener('admin-customers-changed', loadCustomerCount);
});

onUnmounted(() => {
  window.removeEventListener('admin-customers-changed', loadCustomerCount);
  if (notificationPollTimer !== null) window.clearInterval(notificationPollTimer);
  dismissNotificationPopup();
});

const coreNavItems = [
  { path: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Sản phẩm', icon: Package },
  { path: '/admin/categories', label: 'Danh mục', icon: FolderTree },
  { path: '/admin/inventory', label: 'Tồn kho', icon: Boxes, badge: '4 cảnh báo' },
  { path: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { path: '/admin/customers', label: 'Khách hàng', icon: Users },
];

const aiNavItems = [
  { path: '/admin/knowledge-base', label: 'AI Knowledge Base', icon: Bot, badge: 'v2.5' },
];

const navItems = computed(() => [...coreNavItems, ...aiNavItems]);
const adminPageTitle = computed(() =>
  navItems.value.find((item) => item.path === route.path)?.label ?? 'Quản trị',
);
const todayLabel = new Date().toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function closeNotifications() {
  isNotificationsOpen.value = false;
}

async function handleAdminLogout() {
  await authStore.logout();
  isAccountDetailsOpen.value = false;
  isSidebarOpen.value = false;
  await router.replace('/admin/login');
}
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
              v-for="item in coreNavItems"
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
                v-if="item.path === '/admin/customers' ? customerCount !== null : item.badge"
                class="px-2 py-0.5 rounded-full text-[9px] font-bold"
                :class="route.path === item.path ? 'bg-white/20 text-white' : 'bg-[#EBF7E5] text-[#536124]'"
              >
                {{ item.path === '/admin/customers' ? customerCount?.toLocaleString('vi-VN') : item.badge }}
              </span>
            </RouterLink>
          </div>

          <!-- Nhóm 2: DINH DƯỠNG & TRÍ TUỆ AI -->
          <div class="space-y-1 pt-2 border-t border-[#F0F3EC]">
            <span class="text-[10px] font-bold text-[#8C9882] uppercase tracking-wider px-3 block mb-2">
              DINH DƯỠNG & TRÍ TUỆ AI
            </span>
            <RouterLink
              v-for="item in aiNavItems" :key="item.path" :to="item.path"
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
                class="px-2 py-0.5 rounded-full text-[9px] font-bold"
                :class="route.path === item.path ? 'bg-white/20 text-white' : 'bg-[#EBF7E5] text-[#536124]'"
              >
                {{ item.badge }}
              </span>
            </RouterLink>

          </div>
        </div>
      </div>

      <!-- Bottom: THẺ TÀI KHOẢN ADMIN (PINNED / CỐ ĐỊNH Ở ĐÁY, KHÔNG CUỘN) -->
      <div class="shrink-0 p-4 border-t border-[#ECEFE7] bg-white">
        <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] flex items-center justify-between shadow-2xs">
          <button
            type="button"
            class="flex items-center gap-2.5 min-w-0 text-left rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536124]"
            aria-haspopup="dialog"
            aria-label="Xem thông tin tài khoản quản trị viên"
            @click="openAccountDetails"
          >
            <img
              :src="authStore.currentUser?.avatar"
              :alt="`Ảnh đại diện ${authStore.currentUser?.name ?? 'quản trị viên'}`"
              class="w-9 h-9 rounded-full object-cover border border-[#CCD7BC]"
            />
            <div class="min-w-0">
              <h4 class="font-heading text-xs font-bold text-[#2D3B1E] truncate">
                {{ authStore.currentUser?.name ?? 'Quản trị viên' }}
              </h4>
              <span class="text-[10px] text-[#7A866E] truncate block">
                {{ authStore.currentUser?.role === 'admin' ? 'Quản trị viên' : 'Tài khoản' }}
              </span>
            </div>
          </button>

          <RouterLink
            to="/"
            title="Quay lại cửa hàng khách hàng"
            class="p-2 text-[#7A866E] hover:text-[#536124] rounded-xl hover:bg-white transition-colors cursor-pointer"
          >
            <Store class="w-4 h-4" />
          </RouterLink>
        </div>
        <button
          type="button"
          class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E3E8DC] px-3 py-2.5 text-xs font-bold text-[#576449] transition-colors hover:border-[#D9B7B0] hover:bg-[#FBF3F1] hover:text-[#A33A2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536124]"
          @click="handleAdminLogout"
        >
          <LogOut class="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>

    <div
      v-if="isAccountDetailsOpen && authStore.currentUser"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      @click.self="isAccountDetailsOpen = false"
      @keydown.esc="isAccountDetailsOpen = false"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-account-dialog-title"
        class="w-full max-w-lg overflow-hidden rounded-3xl border border-[#DEE5D4] bg-white shadow-2xl"
      >
        <div class="relative bg-linear-to-br from-[#2D3B1E] via-[#536124] to-[#7A8A43] px-6 pb-6 pt-5 text-white">
          <div class="absolute -right-10 -top-16 h-44 w-44 rounded-full border border-white/10"></div>
          <div class="absolute -right-2 -top-8 h-28 w-28 rounded-full border border-white/10"></div>
          <div class="relative flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-white/70">NutriMate Admin</p>
              <h2 id="admin-account-dialog-title" class="mt-1 font-heading text-xl font-bold">
                Hồ sơ tài khoản
              </h2>
            </div>
            <button
              type="button"
              class="rounded-xl p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
              aria-label="Đóng thông tin tài khoản"
              @click="isAccountDetailsOpen = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          <div class="relative mt-5 flex items-center gap-4">
            <div class="relative shrink-0">
              <img
                :src="authStore.currentUser.avatar"
                :alt="`Ảnh đại diện ${authStore.currentUser.name}`"
                class="h-20 w-20 rounded-2xl border-2 border-white/70 object-cover shadow-lg"
              />
              <button
                type="button"
                class="absolute -bottom-2 -right-2 rounded-xl border-2 border-[#536124] bg-white p-2 text-[#536124] shadow-md transition hover:bg-[#EBF7E5] disabled:cursor-wait disabled:opacity-60"
                :disabled="avatarSaving"
                aria-label="Thay đổi ảnh đại diện"
                title="Thay đổi ảnh đại diện"
                @click="avatarInput?.click()"
              >
                <Camera class="h-4 w-4" />
              </button>
              <input
                ref="avatarInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="handleAvatarChange"
              />
            </div>
            <div class="min-w-0">
              <h3 class="truncate font-heading text-lg font-bold">{{ authStore.currentUser.name }}</h3>
              <p class="mt-0.5 truncate text-sm text-white/75">{{ authStore.currentUser.email }}</p>
              <span class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
                <span class="h-1.5 w-1.5 rounded-full bg-[#C7E58B]"></span>
                {{ authStore.currentUser.role === 'admin' ? 'Quản trị viên' : 'Tài khoản' }}
              </span>
            </div>
          </div>
        </div>

        <form class="space-y-5 p-6" @submit.prevent="saveAccountDetails">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-bold text-[#2D3B1E]">Thông tin cá nhân</h3>
              <p class="mt-0.5 text-xs text-[#7A866E]">Cập nhật thông tin hồ sơ quản trị viên</p>
            </div>
            <button
              v-if="!isEditingAccount"
              type="button"
              class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#CCD7BC] px-3 py-2 text-xs font-bold text-[#536124] transition hover:bg-[#F4F7EF]"
              @click="isEditingAccount = true; accountError = ''"
            >
              <Pencil class="h-3.5 w-3.5" />
              Chỉnh sửa
            </button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-1.5 sm:col-span-2">
              <span class="text-xs font-semibold text-[#576449]">Họ và tên</span>
              <input
                v-model="accountForm.name"
                type="text"
                maxlength="150"
                required
                :disabled="!isEditingAccount || accountSaving"
                class="w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2D3B1E] outline-none transition disabled:cursor-default disabled:bg-[#F7F8F5]"
                :class="isEditingAccount ? 'border-[#CCD7BC] focus:border-[#536124] focus:ring-2 focus:ring-[#536124]/10' : 'border-[#E8ECE3] bg-[#F7F8F5]'"
              />
            </label>
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-[#576449]">Email</span>
              <input
                v-model="accountForm.email"
                type="email"
                maxlength="255"
                required
                :disabled="!isEditingAccount || accountSaving"
                class="w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2D3B1E] outline-none transition disabled:cursor-default disabled:bg-[#F7F8F5]"
                :class="isEditingAccount ? 'border-[#CCD7BC] focus:border-[#536124] focus:ring-2 focus:ring-[#536124]/10' : 'border-[#E8ECE3] bg-[#F7F8F5]'"
              />
            </label>
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-[#576449]">Số điện thoại</span>
              <input
                v-model="accountForm.phone"
                type="tel"
                maxlength="20"
                autocomplete="tel"
                required
                :disabled="!isEditingAccount || accountSaving"
                class="w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2D3B1E] outline-none transition disabled:cursor-default disabled:bg-[#F7F8F5]"
                :class="isEditingAccount ? 'border-[#CCD7BC] focus:border-[#536124] focus:ring-2 focus:ring-[#536124]/10' : 'border-[#E8ECE3] bg-[#F7F8F5]'"
              />
            </label>
          </div>

          <div class="rounded-xl bg-[#F7F8F5] px-3.5 py-3">
            <span class="block text-[11px] font-semibold text-[#7A866E]">Mã tài khoản</span>
            <span class="mt-1 block break-all font-mono text-xs text-[#2D3B1E]">{{ authStore.currentUser.id }}</span>
          </div>

          <p v-if="avatarSaving" role="status" class="text-xs text-[#536124]">Đang cập nhật ảnh đại diện…</p>
          <p v-if="avatarError" role="alert" class="text-xs text-red-600">{{ avatarError }}</p>
          <p v-if="accountError" role="alert" class="text-xs text-red-600">{{ accountError }}</p>

          <div v-if="isEditingAccount" class="flex justify-end gap-2 border-t border-[#F0F3EC] pt-4">
            <button
              type="button"
              :disabled="accountSaving"
              class="rounded-xl border border-[#CCD7BC] px-4 py-2.5 text-sm font-bold text-[#576449] transition hover:bg-[#FAF9F5] disabled:opacity-60"
              @click="cancelAccountEdit"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="accountSaving"
              class="inline-flex items-center gap-2 rounded-xl bg-[#536124] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#434F1D] disabled:cursor-wait disabled:opacity-60"
            >
              <Save class="h-4 w-4" />
              {{ accountSaving ? 'Đang lưu…' : 'Lưu thay đổi' }}
            </button>
          </div>
        </form>
      </section>
    </div>

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
            <RouterLink to="/admin" class="font-semibold text-[#2D3B1E] transition-colors hover:text-[#536124]">
              Admin
            </RouterLink>
            <ChevronRight class="w-3.5 h-3.5" />
            <span class="text-[#536124] font-bold">{{ adminPageTitle }}</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#2D3B1E]">
            <Calendar class="w-3.5 h-3.5 text-[#536124]" />
            <span>Hôm nay, {{ todayLabel }}</span>
          </div>

          <button
            type="button"
            class="relative w-9 h-9 rounded-full bg-[#FAF9F5] border border-[#E3E8DC] text-[#2D3B1E] flex items-center justify-center hover:bg-[#F6F8F3] cursor-pointer transition-colors"
            aria-label="Thông báo"
            aria-haspopup="dialog"
            :aria-expanded="isNotificationsOpen"
            aria-controls="admin-notifications-panel"
            @click="openNotifications"
          >
            <Bell class="w-4 h-4" />
            <span
              v-if="unreadNotificationCount > 0"
              class="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white ring-2 ring-white"
            >
              {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
            </span>
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

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-3 opacity-0 sm:translate-x-3 sm:translate-y-0"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-to-class="translate-y-3 opacity-0 sm:translate-x-3 sm:translate-y-0"
    >
      <div
        v-if="notificationPopup"
        role="status"
        aria-live="polite"
        class="fixed right-4 top-20 z-[55] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-[#DCE7D2] bg-white p-4 shadow-xl sm:right-6"
      >
        <div class="flex items-start gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF7E5] text-[#536124]">
            <Bell class="h-5 w-5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-[#2D3B1E]">{{ notificationPopup.title }}</p>
            <p class="mt-1 text-sm leading-5 text-[#576449]">{{ notificationPopup.message }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-[#8C9882] transition hover:bg-[#F4F7EF] hover:text-[#2D3B1E]"
            aria-label="Đóng thông báo mới"
            @click="dismissNotificationPopup"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          class="mt-3 ml-[52px] text-xs font-bold text-[#536124] underline underline-offset-2 hover:text-[#2D3B1E]"
          @click="openNotifications"
        >
          Xem thông báo
        </button>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isNotificationsOpen"
        class="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
        @click.self="closeNotifications"
        @keydown.esc="closeNotifications"
      >
        <Transition
          appear
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <aside
            id="admin-notifications-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-notifications-title"
            class="absolute inset-y-0 right-0 flex w-full flex-col border-l border-[#E3E8DC] bg-[#FAF9F5] shadow-2xl sm:max-w-xl"
          >
            <header class="flex items-center justify-between border-b border-[#E3E8DC] bg-white px-5 py-5 sm:px-8 sm:py-6">
              <div class="flex items-center gap-3">
                <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF7E5] text-[#536124]">
                  <Bell class="h-5 w-5" />
                </span>
                <div>
                  <h2 id="admin-notifications-title" class="font-heading text-xl font-bold text-[#2D3B1E]">
                    Trung tâm thông báo
                  </h2>
                  <p class="mt-1 text-sm text-[#7A866E]">Theo dõi cập nhật và hoạt động quản trị</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="unreadNotificationCount > 0"
                  type="button"
                  :disabled="markingNotificationsRead"
                  class="hidden rounded-xl px-3 py-2 text-xs font-bold text-[#536124] transition hover:bg-[#F4F7EF] disabled:opacity-50 sm:inline-flex"
                  @click="markNotificationsRead"
                >
                  {{ markingNotificationsRead ? 'Đang cập nhật…' : 'Đánh dấu đã đọc' }}
                </button>
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-xl text-[#7A866E] transition-colors hover:bg-[#F4F7EF] hover:text-[#2D3B1E]"
                  aria-label="Đóng thông báo"
                  @click="closeNotifications"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>
            </header>

            <div class="flex min-h-0 flex-1 flex-col p-4 sm:p-7">
              <div
                v-if="unreadNotificationCount > 0"
                class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE7D2] bg-[#F1F4EB] px-4 py-3 sm:hidden"
              >
                <span class="text-xs font-semibold text-[#536124]">{{ unreadNotificationCount }} thông báo chưa đọc</span>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    :disabled="markingNotificationsRead"
                    class="text-xs font-bold text-[#536124] underline underline-offset-2 disabled:opacity-50"
                    @click="markNotificationsRead"
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>
              </div>
              <div
                v-if="notificationsError"
                role="alert"
                class="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
              >
                <p class="font-bold">Không thể tải thông báo</p>
                <p class="mt-1">{{ notificationsError }}</p>
                <button
                  type="button"
                  class="mt-3 font-bold underline underline-offset-2"
                  @click="loadAdminNotifications"
                >
                  Thử tải lại
                </button>
              </div>
              <p
                v-if="notificationActionError && !notificationsError"
                role="alert"
                class="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {{ notificationActionError }}
              </p>
              <div
                v-if="!notificationsError && notificationsLoading"
                role="status"
                class="flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-[#E3E8DC] bg-white text-sm text-[#7A866E]"
              >
                Đang tải thông báo…
              </div>
              <div
                v-else-if="!notificationsError && notifications.length"
                class="min-h-0 flex-1 space-y-3 overflow-y-auto"
              >
                <article
                  v-for="notification in notifications"
                  :key="notification.id"
                  class="flex items-start gap-3 rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#CCD7BC] hover:shadow-md"
                  :class="notification.readAt ? 'border-[#E8ECE3] bg-white shadow-xs' : 'border-[#C9D8B5] bg-[#F1F4EB] shadow-sm'"
                >
                  <button
                    type="button"
                    class="flex min-w-0 flex-1 gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#536124]"
                    @click="openNotification(notification)"
                  >
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF7E5] text-[#536124] ring-1 ring-inset ring-[#DCE7D2]">
                      <Users class="h-5 w-5" />
                    </span>
                    <span class="min-w-0 flex-1 pt-0.5">
                      <span class="flex items-start justify-between gap-3">
                        <span class="text-left text-sm font-bold leading-5 text-[#2D3B1E]">{{ notification.title }}</span>
                        <span
                          v-if="!notification.readAt"
                          class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#71813B] ring-2 ring-[#E2EBD5]"
                          aria-label="Chưa đọc"
                        ></span>
                      </span>
                      <span class="mt-1 block text-left text-sm leading-5 text-[#576449]">{{ notification.message }}</span>
                      <span class="mt-2.5 block text-left text-xs font-medium text-[#8C9882]">{{ formatNotificationDate(notification.createdAt) }}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    :disabled="deletingNotificationIds.has(notification.id) || deletingAllNotifications"
                    :aria-label="`Xóa thông báo: ${notification.title}`"
                    title="Xóa thông báo"
                    class="shrink-0 rounded-lg p-2 text-[#9AA58B] transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536124] disabled:cursor-wait disabled:opacity-50"
                    @click="removeNotification(notification)"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </article>
              </div>
              <div
                v-else-if="!notificationsError"
                class="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#E3E8DC] bg-white px-6 py-10 text-center shadow-[0_8px_30px_rgba(45,59,30,0.04)]"
              >
                <span class="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F1F4EB] text-[#71813B]">
                  <Bell class="h-8 w-8" />
                </span>
                <h3 class="mt-6 font-heading text-lg font-bold text-[#2D3B1E]">
                  Bạn đã cập nhật mọi thứ
                </h3>
                <p class="mt-2 max-w-sm text-sm leading-6 text-[#7A866E]">
                  Hiện chưa có thông báo mới. Các cập nhật về đơn hàng và hoạt động hệ thống sẽ xuất hiện tại đây.
                </p>
                <span class="mt-7 h-1 w-12 rounded-full bg-[#DDE8D1]"></span>
              </div>
            </div>
            <footer
              v-if="notifications.length && !notificationsLoading && !notificationsError"
              class="shrink-0 border-t border-[#E3E8DC] bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7"
            >
              <button
                type="button"
                :disabled="deletingAllNotifications"
                class="flex w-full items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-50"
                @click="clearAllNotifications"
              >
                {{ deletingAllNotifications ? 'Đang xóa…' : 'Xóa tất cả thông báo' }}
              </button>
            </footer>
          </aside>
        </Transition>
      </div>
    </Transition>
  </div>
</template>
