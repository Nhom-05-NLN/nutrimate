import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UserProfile } from '../types';
import { useToastStore } from './toastStore';
import { DEFAULT_USER_AVATAR, LEGACY_DEFAULT_USER_AVATAR } from '../constants/avatar';
import {
  fetchCurrentUser,
  postLogout,
  RegisteredUser,
  ShippingAddress,
  updateCurrentUser,
  updateCurrentUserAvatar,
  updateCurrentUserDietPreferences,
} from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const profileDefaults: Omit<UserProfile, 'id' | 'name' | 'email' | 'phone'> = {
    role: 'customer',
    avatar: DEFAULT_USER_AVATAR,
    birthDate: '1998-06-18',
    city: 'TP. Hồ Chí Minh',
    membershipTier: 'Gold',
    nutriPoints: 490,
    currentDiet: 'Chưa chọn',
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
    dietPreferences: [],
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
          const hasLegacyDefaultDietPreferences =
            'dietPreferences' in profile &&
            Array.isArray(profile.dietPreferences) &&
            profile.dietPreferences.length === 2 &&
            profile.dietPreferences[0] === 'Low-Carb' &&
            profile.dietPreferences[1] === 'Giàu Protein' &&
            'currentDiet' in profile &&
            profile.currentDiet === 'Eat Clean & Low-Carb';
          const user: UserProfile = {
              ...profileDefaults,
              ...profile,
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              ...(hasLegacyDefaultDietPreferences
                ? { currentDiet: 'Chưa chọn', dietPreferences: [] }
                : {}),
              avatar:
                'avatar' in profile &&
                typeof profile.avatar === 'string' &&
                profile.avatar !== LEGACY_DEFAULT_USER_AVATAR
                  ? profile.avatar
                  : DEFAULT_USER_AVATAR,
              role: 'role' in profile && profile.role === 'admin' ? 'admin' : 'customer',
            };
          if (hasLegacyDefaultDietPreferences) {
            storage.setItem(authStorageKey, JSON.stringify(user));
          }
          return {
            user,
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

  const restoredSession = restoreUser();
  const currentUser = ref<UserProfile | null>(null);
  let activeStorage: Storage | null = null;
  let sessionInitialized = false;
  let sessionRequest: Promise<void> | null = null;
  let sessionExpiryTimer: ReturnType<typeof setTimeout> | null = null;

  const isAuthModalOpen = ref<boolean>(false);
  // Set only from the real authentication module's response. Demo login has no JWT.
  const accessToken = ref<string | null>(restoredSession?.token ?? null);
  const toast = useToastStore();

  function getTokenExpiry(token: string): number | null {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload || typeof atob !== 'function') return null;

    try {
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const payload: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'exp' in payload &&
        typeof payload.exp === 'number'
      ) {
        return payload.exp * 1000;
      }
    } catch (error: unknown) {
      console.error('[AuthStore] Không thể đọc thời hạn phiên đăng nhập:', error);
    }

    return null;
  }

  function clearSessionExpiryTimer(): void {
    if (sessionExpiryTimer !== null) {
      clearTimeout(sessionExpiryTimer);
      sessionExpiryTimer = null;
    }
  }

  function scheduleSessionExpiry(token: string): void {
    clearSessionExpiryTimer();
    const expiresAt = getTokenExpiry(token);
    if (expiresAt === null) return;

    const delay = Math.max(0, expiresAt - Date.now());
    sessionExpiryTimer = setTimeout(() => {
      if (accessToken.value !== token) return;
      if (Date.now() < expiresAt) {
        scheduleSessionExpiry(token);
        return;
      }
      void logout(true);
    }, Math.min(delay, 2_147_000_000));
  }

  function openAuthModal() {
    isAuthModalOpen.value = true;
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false;
  }

  function toProfile(
    user: Pick<RegisteredUser, 'id' | 'name' | 'email' | 'phone' | 'role' | 'defaultAddress' | 'avatarUrl'> &
      Partial<Pick<RegisteredUser, 'dietPreferences'>>,
    cachedProfile?: UserProfile,
  ): UserProfile {
    return {
      ...profileDefaults,
      ...cachedProfile,
      ...user,
      avatar: user.avatarUrl || (
        cachedProfile?.avatar && cachedProfile.avatar !== LEGACY_DEFAULT_USER_AVATAR
          ? cachedProfile.avatar
          : profileDefaults.avatar
      ),
      role: user.role,
      defaultAddress:
        (user.defaultAddress?.isDefault ? user.defaultAddress : null) ??
        (cachedProfile?.defaultAddress?.isDefault ? cachedProfile.defaultAddress : null) ??
        null,
      dietPreferences: user.dietPreferences ?? cachedProfile?.dietPreferences ?? [],
    };
  }

  async function restoreSession(): Promise<void> {
    if (sessionInitialized) return;
    if (!sessionRequest) {
      sessionRequest = (async () => {
        const user = await fetchCurrentUser();
        if (!user) {
          clearSessionExpiryTimer();
          localStorageRef?.removeItem(authStorageKey);
          localStorageRef?.removeItem(authTokenKey);
          sessionStorageRef?.removeItem(authStorageKey);
          sessionStorageRef?.removeItem(authTokenKey);
          currentUser.value = null;
          accessToken.value = null;
          activeStorage = null;
        } else {
          const cachedSession = restoreUser();
          const cachedProfile =
            cachedSession?.user.id === user.id ? cachedSession.user : undefined;
          const cachedToken =
            cachedSession?.user.id === user.id ? cachedSession.token : null;
          currentUser.value = toProfile(user, cachedProfile);
          activeStorage = cachedSession?.storage ?? null;
          accessToken.value = cachedToken;
          if (cachedToken) scheduleSessionExpiry(cachedToken);
          else clearSessionExpiryTimer();
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

  async function updateDietPreferences(dietPreferences: string[]): Promise<void> {
    if (!currentUser.value) return;
    const savedPreferences = await updateCurrentUserDietPreferences(dietPreferences);
    if (!currentUser.value) return;
    currentUser.value = {
      ...currentUser.value,
      dietPreferences: savedPreferences,
      currentDiet: savedPreferences.join(' & ') || 'Chưa chọn',
    };
    activeStorage?.setItem(authStorageKey, JSON.stringify(currentUser.value));
  }

  async function updateAvatar(avatar: string): Promise<void> {
    if (!currentUser.value) {
      throw new Error("Vui lòng đăng nhập để đổi ảnh đại diện.");
    }

    const avatarUrl = await updateCurrentUserAvatar(avatar);
    const updatedUser = { ...currentUser.value, avatar: avatarUrl };
    currentUser.value = updatedUser;
    toast.show("Đã cập nhật ảnh đại diện.", "success");
  }

  async function updateAccountProfile(
    updated: Pick<RegisteredUser, "name" | "email" | "phone">,
  ): Promise<Awaited<ReturnType<typeof updateCurrentUser>>> {
    const savedUser = await updateCurrentUser(updated);
    if (!currentUser.value || currentUser.value.id !== savedUser.id) {
      throw new Error("Không thể cập nhật tài khoản hiện tại. Vui lòng tải lại trang.");
    }

    currentUser.value = { ...currentUser.value, ...savedUser };
    activeStorage?.setItem(authStorageKey, JSON.stringify(currentUser.value));
    toast.show("Đã cập nhật thông tin cá nhân thành công!", "success");
    return savedUser;
  }

  function login(
    profile: Pick<UserProfile, "id" | "name" | "email" | "phone"> &
      Partial<Pick<RegisteredUser, "avatarUrl">> | UserProfile,
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
      role: 'role' in profile && profile.role === 'admin' ? 'admin' : 'customer',
      avatarUrl: 'avatarUrl' in profile ? profile.avatarUrl : null,
      dietPreferences: 'dietPreferences' in profile ? profile.dietPreferences : [],
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
    scheduleSessionExpiry(token);
  }

  async function logout(sessionExpired = false): Promise<void> {
    const wasAuthenticated = currentUser.value !== null;
    clearSessionExpiryTimer();
    try {
      await postLogout();
    } catch {
      console.error('[AuthStore] Could not clear the server login session.');
    }
    currentUser.value = null;
    accessToken.value = null;
    activeStorage = null;
    isAuthModalOpen.value = false;
    localStorageRef?.removeItem(authStorageKey);
    localStorageRef?.removeItem(authTokenKey);
    sessionStorageRef?.removeItem(authStorageKey);
    sessionStorageRef?.removeItem(authTokenKey);

    if (wasAuthenticated) {
      toast.show(
        sessionExpired
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : "Đã đăng xuất tài khoản thành công.",
        "info",
      );
    }
  }

  function setAddresses(addressList: ShippingAddress[]) {
    if (currentUser.value) {
      currentUser.value = {
        ...currentUser.value,
        addresses: addressList,
        defaultAddress: addressList.find((a) => a.isDefault) ?? null,
      };
      activeStorage?.setItem(authStorageKey, JSON.stringify(currentUser.value));
    }
  }

  if (restoredSession) scheduleSessionExpiry(restoredSession.token);

  return {
    accessToken,
    currentUser,
    isAuthModalOpen,
    restoreSession,
    openAuthModal,
    closeAuthModal,
    updateProfile,
    updateDietPreferences,
    updateAvatar,
    updateAccountProfile,
    setAddresses,
    login,
    logout,
  };
});
