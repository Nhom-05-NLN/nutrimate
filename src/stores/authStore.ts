import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UserProfile } from '../types';
import { useToastStore } from './toastStore';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<UserProfile | null>({
    id: 'user-01',
    name: 'Nguyễn Minh Anh',
    email: 'minhanh.fit@gmail.com',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    birthDate: '1998-06-18',
    city: 'TP. Hồ Chí Minh',
    membershipTier: 'Gold',
    nutriPoints: 490,
    currentDiet: 'Eat Clean & Low-Carb',
    fitnessGoal: 'Giảm 3kg mỡ và săn chắc cơ bắp',
    heightCm: 165,
    weightKg: 58.5,
    age: 26,
    gender: 'female',
    bmi: 21.5,
    bmiClassification: 'Bình thường (Thể trạng Cân đối lý tưởng)',
    bmrKcal: 1340,
    tdeeKcal: 1850,
    targetDailyCalories: 1550,
    targetMacros: {
      proteinPercent: 25,
      proteinGrams: 80,
      proteinKcal: 320,
      carbsPercent: 45,
      carbsGrams: 150,
      carbsKcal: 600,
      fatPercent: 30,
      fatGrams: 45,
      fatKcal: 405,
    },
    dietPreferences: ['Low-Carb', 'Giàu Protein', 'Ít đường', 'Không bột ngọt'],
  });

  const isAuthModalOpen = ref<boolean>(false);
  const toast = useToastStore();

  function openAuthModal() {
    isAuthModalOpen.value = true;
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false;
  }

  function updateProfile(updated: Partial<UserProfile>) {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...updated };
      toast.show('Đã cập nhật hồ sơ cá nhân thành công!');
    }
  }

  function login(profile: UserProfile) {
    currentUser.value = profile;
    isAuthModalOpen.value = false;
    toast.show(`Chào mừng ${profile.name} đã đăng nhập NutriMate!`);
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
    updateProfile,
    login,
    logout,
  };
});
