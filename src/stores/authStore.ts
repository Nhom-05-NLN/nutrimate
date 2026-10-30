import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UserProfile } from '../types';
import { useToastStore } from './toastStore';
import { fetchCurrentUser, postLogout, RegisteredUser } from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const profileDefaults: Omit<UserProfile, 'id' | 'name' | 'email' | 'phone'> = {
    role: 'customer',
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
  };

  const authStorageKey = "nutrimate-auth-user";
  const authTokenKey = "nutrimate-access-token";
  const localStorageRef =
    typeof localStorage === "undefined" ? null : localStorage;
  const sessionStorageRef =
    typeof sessionStorage === "undefined" ? null : sessionStorage;

  function restoreUser(): { user: UserProfile; storage: Storage; token: string } | null {
    for (const storage of [sessionStorageRef, localStorageRef]) {
      if (!storage) continue;

      try {
        const serializedUser = storage.getItem(authStorageKey);
        if (!serializedUser) continue;

        const profile: unknown = JSON.parse(serializedUser);
        const token = storage.getItem(authTokenKey);
        if (
          typeof profile === "object" &&
          profile !== null &&
          "id" in profile &&
          typeof profile.id === "string" &&
          "name" in profile &&
          typeof profile.name === "string" &&
          "email" in profile &&
          typeof profile.email === "string" &&
          "phone" in profile &&
          typeof profile.phone === "string" &&
          typeof token === "string" &&
          token.length > 0
        ) {
          return {
            user: {
              ...profileDefaults,
              ...profile,
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              role: 'role' in profile && profile.role === 'admin' ? 'admin' : 'customer',
            },
            storage,
            token,
          };
        }

        storage.removeItem(authStorageKey);
        storage.removeItem(authTokenKey);
      } catch (error: unknown) {
        console.error(
          "[AuthStore] Không thể khôi phục phiên đăng nhập:",
          error,
        );
      }
    }

    return null;
  }

  const currentUser = ref<UserProfile | null>(null);
  let activeStorage: Storage | null = null;
  let sessionInitialized = false;
  let sessionRequest: Promise<void> | null = null;

  const isAuthModalOpen = ref<boolean>(false);
  // Set only from the real authentication module's response. Demo login has no JWT.
  const accessToken = ref<string | null>(restoredSession?.token ?? null);
  const toast = useToastStore();

  function openAuthModal() {
    isAuthModalOpen.value = true;
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false;
  }

  function toProfile(user: RegisteredUser, cachedProfile?: UserProfile): UserProfile {
    return {
      ...profileDefaults,
      ...cachedProfile,
      ...user,
      role: user.role,
    };
  }

  async function restoreSession(): Promise<void> {
    if (sessionInitialized) return;
    if (!sessionRequest) {
      sessionRequest = (async () => {
        const user = await fetchCurrentUser();
        if (!user) {
          localStorageRef?.removeItem(authStorageKey);
          sessionStorageRef?.removeItem(authStorageKey);
          currentUser.value = null;
          activeStorage = null;
        } else {
          const cachedSession = restoreUser();
          const cachedProfile =
            cachedSession?.user.id === user.id ? cachedSession.user : undefined;
          currentUser.value = toProfile(user, cachedProfile);
          activeStorage = cachedSession?.storage ?? null;
        }
        sessionInitialized = true;
      })();
    }

    const request = sessionRequest;
    try {
      await request;
    } catch (error: unknown) {
      if (sessionRequest === request) sessionRequest = null;
      throw error;
    }
  }

  function updateProfile(updated: Partial<UserProfile>) {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...updated };
      activeStorage?.setItem(authStorageKey, JSON.stringify(currentUser.value));
      toast.show("Đã cập nhật hồ sơ cá nhân thành công!");
    }
  }

  function login(
    profile: Pick<UserProfile, "id" | "name" | "email" | "phone"> | UserProfile,
    token?: string,
    remember = true
  ) {
    if (!token) {
      throw new Error("Không nhận được token đăng nhập hợp lệ từ máy chủ.");
    }
    const storage = remember ? localStorageRef : sessionStorageRef;
    if (!storage) {
      throw new Error("Trình duyệt không hỗ trợ lưu phiên đăng nhập.");
    }

    const user = toProfile({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role === 'admin' ? 'admin' : 'customer',
    });
    storage.setItem(authStorageKey, JSON.stringify(user));
    storage.setItem(authTokenKey, token);
    (remember ? sessionStorageRef : localStorageRef)?.removeItem(
      authStorageKey,
    );
    (remember ? sessionStorageRef : localStorageRef)?.removeItem(authTokenKey);
    currentUser.value = user;
    accessToken.value = token;
    activeStorage = storage;
    sessionInitialized = true;
    isAuthModalOpen.value = false;
    toast.show(`Chào mừng ${profile.name} đã đăng nhập NutriMate!`);
  }

  async function logout(): Promise<void> {
    const wasAuthenticated = currentUser.value !== null;
    currentUser.value = null;
    accessToken.value = null;
    activeStorage = null;
    isAuthModalOpen.value = false;
    localStorageRef?.removeItem(authStorageKey);
    localStorageRef?.removeItem(authTokenKey);
    sessionStorageRef?.removeItem(authStorageKey);
    sessionStorageRef?.removeItem(authTokenKey);

    if (wasAuthenticated) {
      toast.show("Đã đăng xuất tài khoản thành công.", "info");
    }
  }

  return {
    accessToken,
    currentUser,
    isAuthModalOpen,
    restoreSession,
    openAuthModal,
    closeAuthModal,
    updateProfile,
    login,
    logout,
  };
});
