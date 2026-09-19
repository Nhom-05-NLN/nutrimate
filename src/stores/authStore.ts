import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useToastStore } from './toastStore';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  isLoggedIn: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(null);
  const isAuthModalOpen = ref<boolean>(false);
  const toast = useToastStore();

  function openAuthModal() {
    isAuthModalOpen.value = true;
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false;
  }

  function login(user: AuthUser) {
    currentUser.value = user;
    isAuthModalOpen.value = false;
    toast.show(`Chào mừng ${user.name} đã đăng nhập NutriMate!`);
  }

  function loginDemo() {
    login({
      id: 'demo-user-1',
      name: 'Trần Tường Vy',
      email: 'trantuongvy@nutrimate.vn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      phone: '0912 345 678',
      isLoggedIn: true,
    });
  }

  function logout() {
    currentUser.value = null;
    toast.show('Đã đăng xuất tài khoản thành công.', 'info');
  }

  return {
    currentUser,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    login,
    loginDemo,
    logout,
  };
});
