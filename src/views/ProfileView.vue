<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ActivityLevel, CaloriePlanResponse, CalorieProfileInput, NutritionGoal } from '../types';
import {
  createUserAddress,
  deleteUserAddress,
  editUserAddress,
  fetchCaloriePlan,
  fetchProducts,
  fetchUserAddresses,
  saveCalorieProfile,
  setDefaultUserAddress,
  ShippingAddress,
  ShippingAddressInput,
} from '../services/api';
import { Product } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import {
  ChevronRight,
  ChevronDown,
  Camera,
  Edit3,
  ArrowRight,
  Save,
  Bot,
  Activity,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  X,
  UserRound,
  Target,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const toastStore = useToastStore();

const isEditing = ref(false);
const isEditingAccount = ref(false);
const profileSaving = ref(false);
const profileError = ref("");
const avatarError = ref("");
const avatarSaving = ref(false);
const avatarStatus = ref("");
const avatarInput = ref<HTMLInputElement | null>(null);

const profile = ref({
  heightCm: null as number | null,
  weightKg: null as number | null,
  age: null as number | null,
  gender: null as CalorieProfileInput['gender'] | null,
});

const accountForm = ref({
  name: authStore.currentUser?.name || '',
  email: authStore.currentUser?.email || '',
  phone: authStore.currentUser?.phone || '',
});

const addresses = ref<ShippingAddress[]>(authStore.currentUser?.addresses ?? []);
const addressLoading = ref(true);
const addressSaving = ref(false);
const addressError = ref('');
const showAddressForm = ref(false);
const editingAddressId = ref<number | null>(null);

function emptyAddressForm(): ShippingAddressInput {
  return {
    receiverName: authStore.currentUser?.name ?? '',
    receiverPhone: authStore.currentUser?.phone ?? '',
    houseNumber: '',
    street: '',
    hamlet: '',
    ward: '',
    province: '',
  };
}

const addressForm = ref<ShippingAddressInput>(emptyAddressForm());

watch(
  () => authStore.currentUser,
  (user) => {
    if (!user) return;
    accountForm.value.name = user.name;
    accountForm.value.email = user.email;
    accountForm.value.phone = user.phone;
    addresses.value = user.addresses ?? [];
  },
  { immediate: true },
);

const caloriePlanData = ref<CaloriePlanResponse | null>(null);
const caloriePlan = computed(() => caloriePlanData.value?.plan ?? null);
const bmi = computed(() => caloriePlanData.value?.profile.bmi ?? null);
const planLoading = ref(true);
const planSaving = ref(false);
const planError = ref('');
const selectedGoal = ref<NutritionGoal | null>(null);
const activityLevel = ref<ActivityLevel | null>(null);
const goalLabels: Record<NutritionGoal, string> = {
  lose_weight: 'Giảm cân',
  maintain_weight: 'Duy trì cân nặng',
  gain_weight: 'Tăng cân lành mạnh',
};
const goalOptions: { value: NutritionGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Giảm cân' },
  { value: 'maintain_weight', label: 'Duy trì cân nặng' },
  { value: 'gain_weight', label: 'Tăng cân lành mạnh' },
];
const profileGoalLabel = computed(() => {
  const savedGoal = caloriePlanData.value?.profile.nutritionGoal;
  const goal = savedGoal ?? selectedGoal.value;
  return goal ? goalLabels[goal] : 'Chưa thiết lập';
});
const activityOptions: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Ít vận động' },
  { value: 'light', label: 'Vận động nhẹ' },
  { value: 'moderate', label: 'Vận động vừa' },
  { value: 'high', label: 'Vận động nhiều' },
];
const bmiCategory = computed(() => {
  if (bmi.value === null) return 'Chưa đủ dữ liệu';
  if (bmi.value < 18.5) return 'Thiếu cân';
  if (bmi.value < 23) return 'Bình thường';
  if (bmi.value < 25) return 'Thừa cân';
  return 'Béo phì';
});
const availableDietPreferences = ['Low-Carb', 'Giàu Protein', 'Ít đường', 'Không bột ngọt', 'Keto chuẩn'];
const dietPreferences = ref<string[]>([
  ...(authStore.currentUser?.dietPreferences ?? []),
]);
watch(
  () => authStore.currentUser?.dietPreferences,
  (preferences) => {
    dietPreferences.value = [...(preferences ?? [])];
  },
  { immediate: true },
);
const dietPreferencesSaving = ref(false);
const currentDietLabel = computed(() => dietPreferences.value.join(' & ') || 'Chưa chọn');
const suggestedProduct = ref<Product | null>(null);
const recommendationLoading = ref(true);
const recommendationError = ref('');
let recommendationRequestId = 0;

function normalizeRecommendationText(value: string): string {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function matchesDietPreference(product: Product, preference: string): boolean {
  const category = normalizeRecommendationText(`${product.category} ${product.categoryName}`);
  const details = normalizeRecommendationText([
    product.name,
    product.description,
    ...product.badges,
    ...product.ingredients,
  ].join(' '));
  const { carbs, protein, sugar } = product.nutrition;

  switch (preference) {
    case 'Low-Carb':
      return category.includes('low-carb') || category.includes('low carb') || carbs <= 10;
    case 'Giàu Protein':
      return category.includes('high-protein') || category.includes('giau dam') || protein >= 15;
    case 'Ít đường':
      return category.includes('sugar-free') || category.includes('khong duong') || sugar <= 5;
    case 'Không bột ngọt':
      return details.includes('khong bot ngot') || details.includes('msg-free');
    case 'Keto chuẩn':
      return details.includes('keto') && carbs <= 10;
    default:
      return false;
  }
}

async function loadSuggestedProduct() {
  const requestId = ++recommendationRequestId;
  recommendationLoading.value = true;
  recommendationError.value = '';
  try {
    let page = 1;
    let totalPages = 1;
    let match: Product | undefined;
    do {
      const result = await fetchProducts({ page, limit: 50, sort: 'sold_desc' });
      totalPages = result.totalPages;
      match = result.products.find((product) =>
        product.stock > 0 &&
        Number.isFinite(product.nutrition.calories) &&
        Number.isFinite(product.nutrition.protein) &&
        Number.isFinite(product.nutrition.carbs) &&
        Number.isFinite(product.nutrition.sugar) &&
        dietPreferences.value.every((preference) => matchesDietPreference(product, preference))
      );
      page += 1;
    } while (!match && page <= totalPages);

    if (requestId === recommendationRequestId) {
      suggestedProduct.value = match ?? null;
    }
  } catch (error: unknown) {
    if (requestId === recommendationRequestId) {
      recommendationError.value = error instanceof Error
        ? error.message
        : 'Không thể tải gợi ý sản phẩm.';
    }
  } finally {
    if (requestId === recommendationRequestId) {
      recommendationLoading.value = false;
    }
  }
}

watch(dietPreferences, () => {
  void loadSuggestedProduct();
}, { deep: true, immediate: true });

const suggestedProductDescription = computed(() => {
  const product = suggestedProduct.value;
  if (!product) return '';
  return `${formatNumber(product.nutrition.calories)} kcal • ${formatNumber(product.nutrition.protein)}g protein / ${product.nutrition.servingSize}`;
});

function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('vi-VN');
}

function applyCaloriePlan(data: CaloriePlanResponse) {
  caloriePlanData.value = data;
  profile.value.heightCm = data.profile.heightCm;
  profile.value.weightKg = data.profile.weightKg;
  profile.value.age = data.profile.age;
  profile.value.gender = data.profile.gender;
  selectedGoal.value = data.profile.nutritionGoal;
  activityLevel.value = data.profile.activityLevel;
}

async function loadCaloriePlan() {
  planLoading.value = true;
  planError.value = '';
  try {
    applyCaloriePlan(await fetchCaloriePlan());
  } catch (error: unknown) {
    planError.value = error instanceof Error ? error.message : 'Không thể tải hồ sơ Calories.';
  } finally {
    planLoading.value = false;
  }
}

async function saveCaloriePlan() {
  if (
    profile.value.heightCm === null || profile.value.weightKg === null ||
    profile.value.age === null || profile.value.gender === null
  ) {
    planError.value = 'Vui lòng nhập đầy đủ chiều cao, cân nặng, tuổi và giới tính.';
    return;
  }
  const payload: CalorieProfileInput = {
    heightCm: profile.value.heightCm,
    weightKg: profile.value.weightKg,
    age: profile.value.age,
    gender: profile.value.gender,
    activityLevel: activityLevel.value,
    nutritionGoal: selectedGoal.value,
  };

  planSaving.value = true;
  planError.value = '';
  try {
    applyCaloriePlan(await saveCalorieProfile(payload));
    isEditing.value = false;
    toastStore.show(
      caloriePlan.value
        ? 'Đã lưu hồ sơ và cập nhật lộ trình Calories.'
        : 'Đã lưu hồ sơ và cập nhật BMI. Chọn mức hoạt động và mục tiêu để tính lộ trình Calories.',
      'success',
    );
  } catch (error: unknown) {
    planError.value = error instanceof Error ? error.message : 'Không thể lưu lộ trình Calories.';
  } finally {
    planSaving.value = false;
  }
}

function cancelCalorieProfileEdit() {
  const data = caloriePlanData.value;
  if (data) {
    applyCaloriePlan(data);
  } else {
    profile.value = { heightCm: null, weightKg: null, age: null, gender: null };
    selectedGoal.value = null;
    activityLevel.value = null;
  }
  planError.value = '';
  isEditing.value = false;
}

function toggleCalorieProfileEditor() {
  if (isEditing.value) {
    cancelCalorieProfileEdit();
    return;
  }
  planError.value = '';
  isEditing.value = true;
}

onMounted(() => {
  void loadCaloriePlan();
  void loadAddresses();
});

async function togglePreference(pref: string) {
  if (dietPreferencesSaving.value) return;
  const updatedPreferences = dietPreferences.value.includes(pref)
    ? dietPreferences.value.filter((preference) => preference !== pref)
    : [...dietPreferences.value, pref];
  dietPreferencesSaving.value = true;
  try {
    await authStore.updateDietPreferences(updatedPreferences);
    dietPreferences.value = [...(authStore.currentUser?.dietPreferences ?? [])];
  } catch (error: unknown) {
    toastStore.show(
      error instanceof Error ? error.message : 'Không thể lưu chế độ ăn. Vui lòng thử lại.',
      'error',
    );
  } finally {
    dietPreferencesSaving.value = false;
  }
}

async function handleSave() {
  profileSaving.value = true;
  profileError.value = "";
  try {
    const savedUser = await authStore.updateAccountProfile(accountForm.value);
    accountForm.value.name = savedUser.name;
    accountForm.value.email = savedUser.email;
    accountForm.value.phone = savedUser.phone;
    isEditingAccount.value = false;
  } catch (error: unknown) {
    profileError.value = error instanceof Error
      ? error.message
      : "Không thể cập nhật thông tin cá nhân.";
  } finally {
    profileSaving.value = false;
  }
}

function cancelAccountEdit() {
  const user = authStore.currentUser;
  if (user) {
    accountForm.value.name = user.name;
    accountForm.value.email = user.email;
    accountForm.value.phone = user.phone;
  }
  profileError.value = "";
  isEditingAccount.value = false;
}

async function loadAddresses() {
  addressLoading.value = true;
  addressError.value = '';
  try {
    addresses.value = await fetchUserAddresses();
    authStore.setAddresses(addresses.value);
  } catch (error: unknown) {
    addressError.value = error instanceof Error ? error.message : 'Không thể tải địa chỉ nhận hàng.';
  } finally {
    addressLoading.value = false;
  }
}

function startAddingAddress() {
  editingAddressId.value = null;
  addressForm.value = emptyAddressForm();
  addressError.value = '';
  showAddressForm.value = true;
}

function startEditingAddress(address: ShippingAddress) {
  editingAddressId.value = address.addressId;
  addressForm.value = {
    receiverName: address.receiverName,
    receiverPhone: address.receiverPhone,
    houseNumber: address.houseNumber,
    street: address.street,
    hamlet: address.hamlet,
    ward: address.ward,
    province: address.province,
  };
  addressError.value = '';
  showAddressForm.value = true;
}

function cancelAddressForm() {
  showAddressForm.value = false;
  editingAddressId.value = null;
  addressForm.value = emptyAddressForm();
}

async function saveAddress() {
  addressSaving.value = true;
  addressError.value = '';
  const isEditingAddress = editingAddressId.value !== null;
  try {
    if (editingAddressId.value === null) {
      await createUserAddress(addressForm.value);
    } else {
      await editUserAddress(editingAddressId.value, addressForm.value);
    }
    cancelAddressForm();
    await loadAddresses();
    toastStore.show(
      isEditingAddress ? 'Đã cập nhật địa chỉ nhận hàng.' : 'Đã thêm địa chỉ nhận hàng.',
      'success',
    );
  } catch (error: unknown) {
    addressError.value = error instanceof Error ? error.message : 'Không thể lưu địa chỉ.';
  } finally {
    addressSaving.value = false;
  }
}

async function makeAddressDefault(address: ShippingAddress) {
  addressError.value = '';
  try {
    await setDefaultUserAddress(address.addressId);
    await loadAddresses();
    toastStore.show('Đã đặt làm địa chỉ mặc định.', 'success');
  } catch (error: unknown) {
    addressError.value = error instanceof Error ? error.message : 'Không thể đặt địa chỉ mặc định.';
  }
}

async function removeAddress(address: ShippingAddress) {
  if (!window.confirm(`Xóa địa chỉ "${address.address}"?`)) return;
  addressError.value = '';
  try {
    await deleteUserAddress(address.addressId);
    await loadAddresses();
    if (editingAddressId.value === address.addressId) cancelAddressForm();
    toastStore.show('Đã xóa địa chỉ nhận hàng.', 'success');
  } catch (error: unknown) {
    addressError.value = error instanceof Error ? error.message : 'Không thể xóa địa chỉ.';
  }
}

async function handleAvatarChange(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const file = input.files?.[0];
  input.value = "";
  avatarError.value = "";
  if (!file) return;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    avatarError.value = "Vui lòng chọn ảnh JPEG, PNG hoặc WebP.";
    return;
  }
  if (file.size > 5_000_000) {
    avatarError.value = "Ảnh gốc phải nhỏ hơn 5 MB.";
    return;
  }

  avatarSaving.value = true;
  avatarStatus.value = "Đang xử lý ảnh…";
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 384 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể xử lý ảnh đại diện.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result
          ? resolve(result)
          : reject(new Error("Không thể nén ảnh đại diện.")),
        "image/webp",
        0.72,
      );
    });
    if (blob.size > 750_000) {
      throw new Error("Ảnh sau khi xử lý vẫn quá lớn. Vui lòng chọn ảnh khác.");
    }

    const avatar = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Không thể đọc ảnh đã xử lý."));
          return;
        }
        resolve(reader.result);
      });
      reader.addEventListener("error", () => {
        reject(reader.error ?? new Error("Không thể đọc ảnh đã xử lý."));
      });
      reader.readAsDataURL(blob);
    });
    avatarStatus.value = "Đang lưu ảnh vào tài khoản…";
    await authStore.updateAvatar(avatar);
  } catch (error: unknown) {
    avatarError.value = error instanceof Error ? error.message : "Không thể cập nhật ảnh đại diện.";
  } finally {
    avatarSaving.value = false;
    avatarStatus.value = "";
  }
}
</script>

<template>
  <div class="profile-page max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#242424]">Trang chủ</RouterLink>
      <ChevronRight class="w-4 h-4" />
      <span class="text-[#242424] font-bold">Hồ sơ cá nhân</span>
    </nav>

    <!-- Top Profile Banner Card (Figma 07) -->
    <div class="p-7 sm:p-9 rounded-4xl bg-linear-to-r from-[#EBF7E5] via-[#F4F7EE] to-[#FAF9F5] border border-[#CCD7BC] shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <!-- Avatar với Icon Camera -->
          <div class="relative">
            <img
              :src="authStore.currentUser?.avatar"
              alt="Ảnh đại diện"
              class="w-22 h-22 sm:w-26 sm:h-26 rounded-3xl object-cover border-2 border-white shadow-md"
            />
            <input
              ref="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleAvatarChange"
            />
            <button
              type="button"
              @click="avatarInput?.click()"
              :disabled="avatarSaving"
              class="absolute -bottom-1 -right-1 p-2 rounded-xl bg-[#4D6A34] text-white hover:bg-[#3B4E24] shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              aria-label="Thay đổi ảnh đại diện"
              :title="avatarSaving ? 'Đang lưu ảnh đại diện…' : 'Thay đổi ảnh đại diện'"
            >
              <span v-if="avatarSaving" class="block w-4 h-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <Camera v-else class="w-4 h-4" />
            </button>
          </div>
          <p v-if="avatarError" role="alert" class="max-w-40 text-xs text-red-600">
            {{ avatarError }}
          </p>
          <p v-else-if="avatarStatus" role="status" class="max-w-40 text-xs text-[#576449]">
            {{ avatarStatus }}
          </p>

          <!-- Thông tin tổng quan (To, rõ, dễ đọc) -->
          <div class="min-w-0 space-y-2">
            <h1 class="break-words font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-[#242424]">
              {{ authStore.currentUser?.name || 'Tài khoản' }}
            </h1>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#576449] pt-1" aria-live="polite">
              <span>Chế độ ăn: <strong class="text-[#242424]">{{ currentDietLabel }}</strong></span>
              <span>Mục tiêu: <strong class="text-[#242424]">{{ profileGoalLabel }}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2 Columns Grid: BMI Analysis (Left) vs Personal Info & Macro Goals (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Cột Trái: Phân tích Thể Trạng & Chỉ Số BMI (Figma 07) -->
      <div class="lg:col-span-5 space-y-6">
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F3EC] pb-4">
            <div class="flex items-center gap-2.5">
              <Activity class="w-5 h-5 text-[#4D6A34]" />
              <h2 class="font-heading text-base font-bold text-[#242424]">
                Chỉ số sức khỏe
              </h2>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="isEditing" class="hidden rounded-full bg-[#EBF7E5] px-3 py-1.5 text-xs font-bold text-[#4D6A34] sm:inline-flex">
                Chế độ chỉnh sửa
              </span>
              <button
                v-else
                type="button"
                @click="isEditing = true; planError = ''"
                :disabled="planLoading || planSaving"
                :aria-expanded="isEditing"
                aria-controls="profile-measurement-form"
                class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#CCD7BC] bg-white px-3 py-2 text-xs font-bold text-[#4D6A34] transition-colors hover:bg-[#F6F8F3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Edit3 class="h-3.5 w-3.5" />
                {{ profile.heightCm === null ? 'Nhập chỉ số' : 'Chỉnh sửa' }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-4">
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Chiều cao</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">{{ profile.heightCm ?? '—' }} <span class="text-xs font-normal">cm</span></span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Cân nặng</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">{{ profile.weightKg ?? '—' }} <span class="text-xs font-normal">kg</span></span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Tuổi</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">{{ profile.age ?? '—' }}</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEFE7]">
              <span class="text-xs text-[#7A866E] block font-medium">Giới tính</span>
              <span class="font-heading text-base sm:text-lg font-black text-[#242424] mt-0.5 block">{{ profile.gender === 'female' ? 'Nữ' : profile.gender === 'male' ? 'Nam' : profile.gender === 'other' ? 'Khác' : '—' }}</span>
            </div>
          </div>

          <div v-if="isEditing" id="profile-measurement-form" class="grid grid-cols-1 gap-3 rounded-2xl border border-[#CCD7BC] bg-[#FAF9F5] p-4 sm:grid-cols-2">
            <label for="profile-height" class="text-xs font-bold text-[#576449]">Chiều cao (cm)
              <input id="profile-height" v-model.number="profile.heightCm" type="number" min="80" max="250" step="0.1" required :disabled="planSaving" class="mt-1 w-full rounded-xl border border-[#DEE5D4] bg-white px-3 py-2 text-sm disabled:opacity-60" />
            </label>
            <label for="profile-weight" class="text-xs font-bold text-[#576449]">Cân nặng (kg)
              <input id="profile-weight" v-model.number="profile.weightKg" type="number" min="20" max="400" step="0.1" required :disabled="planSaving" class="mt-1 w-full rounded-xl border border-[#DEE5D4] bg-white px-3 py-2 text-sm disabled:opacity-60" />
            </label>
            <label for="profile-age" class="text-xs font-bold text-[#576449]">Tuổi
              <input id="profile-age" v-model.number="profile.age" type="number" min="13" max="120" step="1" required :disabled="planSaving" class="mt-1 w-full rounded-xl border border-[#DEE5D4] bg-white px-3 py-2 text-sm disabled:opacity-60" />
            </label>
            <label for="profile-gender" class="text-xs font-bold text-[#576449]">Giới tính dùng cho công thức
              <span class="relative mt-1 block">
                <select id="profile-gender" v-model="profile.gender" required :disabled="planSaving" class="w-full appearance-none rounded-xl border border-[#DEE5D4] bg-white py-2 pl-3 pr-10 text-sm disabled:opacity-60">
                  <option :value="null" disabled>Chọn giới tính</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác / hệ số trung bình</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A866E]" aria-hidden="true" />
              </span>
            </label>
            <p v-if="planError" class="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">{{ planError }}</p>
            <div class="sm:col-span-2 flex justify-end gap-2">
              <button type="button" :disabled="planSaving" @click="cancelCalorieProfileEdit" class="rounded-xl border border-[#CCD7BC] bg-white px-4 py-2 text-sm font-semibold text-[#576449] disabled:opacity-60">
                Hủy
              </button>
              <button type="button" :disabled="planSaving || planLoading" @click="saveCaloriePlan" class="inline-flex items-center gap-2 rounded-xl bg-[#4D6A34] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Save class="h-4 w-4" />
                {{ planSaving ? 'Đang lưu…' : 'Lưu chỉ số' }}
              </button>
            </div>
          </div>

          <!-- Card Chỉ Số Khối Cơ Thể BMI -->
          <div class="p-5 sm:p-6 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] space-y-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="text-xs text-[#7A866E] uppercase font-bold block">Chỉ số khối cơ thể (BMI)</span>
                <span class="mt-1 block font-heading text-4xl font-black text-[#242424]">{{ bmi ?? '—' }} <span class="text-sm font-normal text-[#7A866E]">kg/m²</span></span>
              </div>
              <div class="text-right">
                <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#4D6A34] text-white text-xs font-bold shadow-2xs">
                  {{ bmi !== null ? `✓ ${bmiCategory}` : bmiCategory }}
                </span>
                <span class="text-xs text-[#4D6A34] block font-semibold mt-2">{{ caloriePlan ? 'Chỉ số tham khảo theo BMI' : 'Bổ sung hồ sơ để xem phân tích' }}</span>
              </div>
            </div>

            <!-- Thước Đo Phân Vùng Chuẩn WHO 4 Màu -->
            <div class="space-y-2.5 pt-1">
              <div class="flex justify-between text-xs text-[#7A866E]">
                <span>Thước đo phân vùng chuẩn WHO</span>
                <span class="font-bold text-[#4D6A34]">Điểm rơi: {{ bmi ?? '—' }}</span>
              </div>

              <!-- Thanh phân vùng -->
              <div class="h-3.5 w-full rounded-full bg-slate-200 overflow-hidden flex relative">
                <div class="w-[20%] bg-sky-300" title="Thiếu cân < 18.5"></div>
                <div class="w-[45%] bg-[#4D6A34]" title="Cân đối 18.5 - 22.9"></div>
                <div class="w-[20%] bg-amber-400" title="Thừa cân 23.0 - 24.9"></div>
                <div class="w-[15%] bg-rose-400" title="Béo phì >= 25.0"></div>
              </div>

              <div class="grid grid-cols-4 text-[10px] text-[#7A866E] text-center pt-1 font-medium">
                <div>Thiếu cân<br />&lt; 18.5</div>
                <div class="font-bold text-[#4D6A34]">Cân đối<br />18.5 - 22.9</div>
                <div>Thừa cân<br />23.0 - 24.9</div>
                <div>Béo phì<br />≥ 25.0</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Card Mục tiêu dinh dưỡng & Chế độ ăn uống -->
        <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-6">
          <div class="flex items-center gap-3 border-b border-[#F0F3EC] pb-4">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF7E5] text-[#4D6A34]">
              <Target class="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 class="font-heading text-base font-bold text-[#242424]">
              Mục tiêu dinh dưỡng & Chế độ ăn uống
            </h2>
          </div>

          <div id="profile-goals" tabindex="-1" class="space-y-2">
            <span class="text-xs font-bold text-[#242424] block">Mục tiêu thể chất</span>
            <div class="grid grid-cols-1 gap-1.5">
              <button
                v-for="goal in goalOptions"
                :key="goal.value"
                type="button"
                @click="selectedGoal = goal.value; planError = ''"
                class="flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer"
                :class="
                  selectedGoal === goal.value
                    ? 'bg-[#F1F6EC] text-[#3B4E24] border-[#A9BB91]'
                    : 'bg-white text-[#576449] border-[#E3E8DC] hover:bg-[#FAF9F5]'
                "
              >
                {{ goal.label }}
                <span v-if="selectedGoal === goal.value" class="text-[#4D6A34]" aria-hidden="true">✓</span>
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-[#242424]" for="profile-activity-level">Mức độ hoạt động</label>
            <span class="relative block">
              <select id="profile-activity-level" v-model="activityLevel" @change="planError = ''" class="w-full appearance-none rounded-xl border border-[#DEE5D4] bg-[#FAF9F5] py-2.5 pl-3 pr-10 text-sm text-[#242424]">
                <option :value="null" disabled>Chọn mức độ hoạt động</option>
                <option v-for="option in activityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A866E]" aria-hidden="true" />
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-[#E3E8DC] bg-[#FAF9F5] px-3 py-2.5">
              <span class="block text-[11px] font-medium text-[#7A866E]">⚡ BMR</span>
              <span class="mt-0.5 block font-heading text-lg font-black text-[#242424]">{{ formatNumber(caloriePlan?.bmrKcal) }} <span class="text-xs font-normal">kcal</span></span>
            </div>
            <div class="rounded-xl border border-[#E3E8DC] bg-[#FAF9F5] px-3 py-2.5">
              <span class="block text-[11px] font-medium text-[#7A866E]">🏃 TDEE</span>
              <span class="mt-0.5 block font-heading text-lg font-black text-[#4D6A34]">{{ formatNumber(caloriePlan?.tdeeKcal) }} <span class="text-xs font-normal">kcal</span></span>
            </div>
          </div>

          <div class="space-y-2 border-t border-[#F0F3EC] pt-3">
            <span class="block text-xs font-bold text-[#242424]">Ưu tiên dinh dưỡng</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="pref in availableDietPreferences"
                :key="pref"
                type="button"
                @click="togglePreference(pref)"
                :disabled="dietPreferencesSaving"
                class="flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
                :class="
                  dietPreferences.includes(pref)
                    ? 'bg-[#EBF7E5] text-[#3B4E24] border-[#CCD7BC] font-bold'
                    : 'bg-white text-[#7A866E] border-[#E3E8DC]'
                "
              >
                <span v-if="dietPreferences.includes(pref)">✓</span>
                <span>{{ pref }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-3 border-t border-[#F0F3EC] pt-3">
            <div class="flex items-center justify-between gap-2 rounded-2xl bg-[#F1F6EC] px-4 py-3">
              <div>
                <span class="block text-xs font-bold text-[#3B4E24]">Calories mục tiêu</span>
                <span v-if="caloriePlan" class="block text-[11px] text-[#7A866E]">
                  {{ caloriePlan.adjustmentKcal > 0 ? '+' : '' }}{{ formatNumber(caloriePlan.adjustmentKcal) }} kcal/ngày so với TDEE
                </span>
                <span v-if="caloriePlan?.minimumTargetApplied" class="block text-[11px] text-amber-700">
                  Đã áp dụng mức sàn 1.200 kcal/ngày
                </span>
                <span v-if="!caloriePlan" class="text-[11px] text-[#7A866E]">{{ planLoading ? 'Đang tính…' : 'Lưu hồ sơ để tính' }}</span>
              </div>
              <span v-if="caloriePlan" class="shrink-0 font-heading text-xl font-black text-[#4D6A34]">{{ formatNumber(caloriePlan.targetCalories) }} <span class="text-xs font-semibold">kcal/ngày</span></span>
              <span v-else class="shrink-0 text-xs text-[#7A866E]">— kcal/ngày</span>
            </div>

            <p v-if="planError && !isEditing" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">{{ planError }}</p>
            <button
              type="button"
              :disabled="planSaving || planLoading"
              @click="saveCaloriePlan"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4D6A34] py-3 text-sm font-bold text-white transition-colors hover:bg-[#3B4E24] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <Save class="w-4 h-4" />
              <span>{{ planSaving ? 'Đang lưu hồ sơ…' : 'Lưu hồ sơ và cập nhật lộ trình Calories' }}</span>
            </button>
          </div>
        </div>

          <!-- Lời khuyên từ NutriBot AI -->
          <div class="p-5 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] space-y-2.5">
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="font-bold text-[#242424] flex items-center gap-2">
                <Bot class="w-4.5 h-4.5 text-[#4D6A34]" />
                Lời khuyên từ NutriBot AI
              </span>
              <span class="text-xs text-[#7A866E]">Cá nhân hoá</span>
            </div>
            <p v-if="caloriePlan" class="text-xs sm:text-sm text-[#4E5C3E] leading-relaxed">
              Theo hồ sơ hiện tại, mục tiêu của bạn là <strong>{{ goalLabels[caloriePlan.nutritionGoal] }}</strong> với mức năng lượng tham khảo <strong>{{ formatNumber(caloriePlan.targetCalories) }} kcal/ngày</strong>.
              Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.
            </p>
            <p v-else class="text-xs sm:text-sm text-[#4E5C3E] leading-relaxed">{{ planLoading ? 'Đang tải lộ trình Calories…' : 'Chưa có lộ trình. Hãy cập nhật số đo và mục tiêu.' }}</p>
          </div>

        <!-- Sản phẩm gợi ý từ danh mục đang bán -->
        <div class="p-5 rounded-3xl bg-white border border-[#E3E8DC] shadow-2xs flex items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <img
              v-if="suggestedProduct"
              :src="suggestedProduct.image"
              :alt="suggestedProduct.name"
              class="w-16 h-16 rounded-2xl object-cover"
            />
            <div>
              <span class="text-xs font-bold text-[#7A866E] uppercase block">Sản phẩm gợi ý</span>
              <h4 class="font-heading text-sm font-bold text-[#242424]">
                {{ recommendationLoading ? 'Đang tìm sản phẩm phù hợp…' : suggestedProduct?.name ?? 'Chưa có sản phẩm phù hợp' }}
              </h4>
              <span v-if="suggestedProduct" class="text-xs text-[#4D6A34] font-semibold">
                {{ suggestedProductDescription }}
              </span>
              <span v-else-if="recommendationError" class="text-xs text-rose-700">
                {{ recommendationError }}
              </span>
              <span v-else-if="!recommendationLoading" class="text-xs text-[#7A866E]">
                {{ dietPreferences.length ? 'Chưa tìm thấy sản phẩm còn hàng khớp tất cả ưu tiên dinh dưỡng đã chọn.' : 'Hiện chưa có sản phẩm còn hàng.' }}
              </span>
            </div>
          </div>
          <RouterLink
            :to="suggestedProduct ? { name: 'product-detail', params: { id: suggestedProduct.id } } : '/catalog'"
            class="w-11 h-11 rounded-2xl bg-[#EBF7E5] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white flex items-center justify-center transition-colors shrink-0"
            :aria-label="suggestedProduct ? 'Xem sản phẩm gợi ý' : 'Xem danh mục sản phẩm'"
          >
            <ArrowRight class="w-5 h-5" />
          </RouterLink>
        </div>
      </div>

      <!-- Cột Phải: Thông Tin Cá Nhân & Mục Tiêu Macro (Figma 07) -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Card 1: Thông tin cá nhân & liên hệ -->
        <form
          class="relative overflow-hidden bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-6"
          @submit.prevent="handleSave"
        >
          <div class="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#4D6A34] via-[#A6BB87] to-[#EBF7E5]" />
          <div class="flex items-center justify-between gap-4 border-b border-[#F0F3EC] pb-5">
            <div class="flex items-center gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF7E5] text-[#4D6A34]">
                <UserRound class="h-5 w-5" />
              </span>
              <div>
                <h2 class="font-heading text-base font-bold text-[#242424]">
                  Thông tin cá nhân & Liên hệ
                </h2>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span v-if="isEditingAccount" class="hidden rounded-full bg-[#EBF7E5] px-3 py-1.5 text-xs font-bold text-[#4D6A34] sm:inline-flex">
                Chế độ chỉnh sửa
              </span>
              <button
                v-else
                type="button"
                @click="isEditingAccount = true; profileError = ''"
                class="inline-flex items-center gap-2 rounded-xl border border-[#CCD7BC] bg-white px-4 py-2.5 text-sm font-bold text-[#4D6A34] shadow-xs transition-all hover:border-[#4D6A34] hover:bg-[#F6F8F3]"
              >
                <Pencil class="h-4 w-4" />
                Chỉnh sửa
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <label class="block space-y-1.5">
              <span class="block text-sm font-semibold text-[#576449]">Họ và tên</span>
              <input
                type="text"
                v-model="accountForm.name"
                maxlength="150"
                required
                :disabled="!isEditingAccount || profileSaving"
                class="w-full rounded-xl border px-3.5 py-3 text-sm text-[#242424] outline-none transition"
                :class="isEditingAccount ? 'border-[#CCD7BC] bg-white focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/10' : 'border-[#E8ECE3] bg-[#FAFBF8] disabled:cursor-default disabled:opacity-100'"
              />
            </label>
            <label class="block space-y-1.5">
              <span class="block text-sm font-semibold text-[#576449]">Email</span>
              <input
                type="email"
                v-model="accountForm.email"
                maxlength="255"
                required
                :disabled="!isEditingAccount || profileSaving"
                class="w-full rounded-xl border px-3.5 py-3 text-sm text-[#242424] outline-none transition"
                :class="isEditingAccount ? 'border-[#CCD7BC] bg-white focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/10' : 'border-[#E8ECE3] bg-[#FAFBF8] disabled:cursor-default disabled:opacity-100'"
              />
            </label>
            <label class="block space-y-1.5 sm:col-span-2 sm:max-w-[calc(50%-0.625rem)]">
              <span class="block text-sm font-semibold text-[#576449]">Số điện thoại đăng ký</span>
              <input
                type="tel"
                v-model="accountForm.phone"
                maxlength="20"
                autocomplete="tel"
                required
                :disabled="!isEditingAccount || profileSaving"
                class="w-full rounded-xl border px-3.5 py-3 text-sm text-[#242424] outline-none transition"
                :class="isEditingAccount ? 'border-[#CCD7BC] bg-white focus:border-[#4D6A34] focus:ring-2 focus:ring-[#4D6A34]/10' : 'border-[#E8ECE3] bg-[#FAFBF8] disabled:cursor-default disabled:opacity-100'"
              />
            </label>
          </div>
          <p v-if="profileError" role="alert" class="text-sm font-medium text-red-600">
            {{ profileError }}
          </p>
          <div v-if="isEditingAccount" class="flex justify-end gap-2 border-t border-[#F0F3EC] pt-4">
            <button
              type="button"
              :disabled="profileSaving"
              @click="cancelAccountEdit"
              class="px-5 py-3 rounded-2xl border border-[#CCD7BC] bg-white text-[#576449] text-sm font-bold transition-colors hover:bg-[#FAF9F5] disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="profileSaving"
              class="px-7 py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save class="w-4 h-4" />
              <span>{{ profileSaving ? 'Đang lưu…' : 'Lưu thay đổi' }}</span>
            </button>
          </div>
        </form>

        <section class="rounded-3xl border border-[#E3E8DC] bg-white p-6 shadow-2xs space-y-6">
          <div class="flex flex-col gap-3 border-b border-[#F0F3EC] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF7E5] text-[#4D6A34]">
                <MapPin class="h-5 w-5" />
              </span>
              <h2 class="font-heading text-base font-bold text-[#242424]">Địa chỉ nhận hàng</h2>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="!showAddressForm"
                type="button"
                @click="startAddingAddress"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4D6A34] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:-translate-y-0.5 hover:bg-[#3B4E24] hover:shadow-sm"
              >
                <Plus class="h-4 w-4" />
                Thêm địa chỉ
              </button>
              <button
                v-else
                type="button"
                @click="cancelAddressForm"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-[#CCD7BC] bg-white px-4 py-2.5 text-sm font-bold text-[#576449] transition-colors hover:bg-[#FAF9F5]"
              >
                <X class="h-4 w-4" />
                Đóng biểu mẫu
              </button>
            </div>
          </div>

          <p v-if="addressError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ addressError }}
          </p>

          <div v-if="addressLoading" class="py-5 text-center text-sm text-[#7A866E]">
            Đang tải danh sách địa chỉ…
          </div>
          <div v-else-if="addresses.length === 0" class="rounded-2xl border border-dashed border-[#CCD7BC] bg-[#FAFBF8] p-8 text-center">
            <MapPin class="mx-auto h-8 w-8 text-[#7A866E]" />
            <p class="mt-2 text-sm font-semibold text-[#576449]">Bạn chưa lưu địa chỉ nhận hàng nào.</p>
            <p class="mt-1 text-xs text-[#7A866E]">Thêm địa chỉ để thuận tiện khi đặt hàng.</p>
          </div>
          <div v-else class="space-y-3">
            <article
              v-for="address in addresses"
              :key="address.addressId"
              class="group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm sm:p-5"
              :class="address.isDefault ? 'border-[#9CAD83] bg-linear-to-br from-[#F6F8F3] to-white shadow-xs' : 'border-[#E8ECE3] bg-white hover:border-[#CCD7BC]'"
            >
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0 space-y-2">
                  <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <span class="font-bold text-[#242424]">{{ address.receiverName }}</span>
                    <span class="text-sm font-medium text-[#7A866E]">{{ address.receiverPhone }}</span>
                    <span v-if="address.isDefault" class="inline-flex items-center gap-1 rounded-full bg-[#E7F1DE] px-2.5 py-1 text-[11px] font-bold text-[#4D6A34]">
                      <MapPin class="h-3 w-3" />
                      Mặc định
                    </span>
                  </div>
                  <p class="break-words text-sm leading-6 text-[#576449]">{{ address.address }}</p>
                </div>
                <div class="flex shrink-0 flex-wrap gap-2">
                  <button
                    v-if="!address.isDefault"
                    type="button"
                    @click="makeAddressDefault(address)"
                    class="rounded-lg border border-[#CCD7BC] px-3 py-2 text-xs font-semibold text-[#4D6A34] hover:bg-[#EBF7E5]"
                  >
                    Đặt mặc định
                  </button>
                  <button
                    type="button"
                    @click="startEditingAddress(address)"
                    class="inline-flex items-center gap-1 rounded-lg border border-[#CCD7BC] px-3 py-2 text-xs font-semibold text-[#576449] hover:bg-[#FAF9F5]"
                  >
                    <Pencil class="h-3.5 w-3.5" /> Sửa
                  </button>
                  <button
                    type="button"
                    @click="removeAddress(address)"
                    class="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 class="h-3.5 w-3.5" /> Xóa
                  </button>
                </div>
              </div>
            </article>
          </div>

          <form
            v-if="showAddressForm"
            class="space-y-5 rounded-2xl border border-[#D8E1CE] bg-linear-to-br from-[#F8FAF5] to-[#F3F6EE] p-5 sm:p-6"
            @submit.prevent="saveAddress"
          >
            <div class="flex items-center gap-3 border-b border-[#E5EBDD] pb-4">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#4D6A34] shadow-xs">
                <Pencil v-if="editingAddressId !== null" class="h-4 w-4" />
                <Plus v-else class="h-4 w-4" />
              </span>
              <h3 class="font-bold text-[#242424]">
                {{ editingAddressId === null ? 'Thêm địa chỉ nhận hàng' : 'Cập nhật địa chỉ' }}
              </h3>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="address-receiver-name" class="mb-1.5 block text-xs font-bold text-[#576449]">Tên người nhận</label>
                <input id="address-receiver-name" v-model="addressForm.receiverName" required maxlength="100" placeholder="Ví dụ: Nguyễn Văn An" class="w-full rounded-xl border border-[#DEE5D4] bg-white px-4 py-3 text-sm outline-none focus:border-[#4D6A34]" />
              </div>
              <div>
                <label for="address-receiver-phone" class="mb-1.5 block text-xs font-bold text-[#576449]">Số điện thoại</label>
                <input id="address-receiver-phone" v-model="addressForm.receiverPhone" required maxlength="20" type="tel" placeholder="Ví dụ: 0912 345 678" class="w-full rounded-xl border border-[#DEE5D4] bg-white px-4 py-3 text-sm outline-none focus:border-[#4D6A34]" />
              </div>
              <div>
                <label for="address-house-number" class="mb-1.5 block text-xs font-bold text-[#576449]">Số nhà / căn hộ</label>
                <input id="address-house-number" v-model="addressForm.houseNumber" required maxlength="100" placeholder="Ví dụ: 12A, căn hộ 05.01" class="w-full rounded-xl border border-[#DEE5D4] bg-white px-4 py-3 text-sm outline-none focus:border-[#4D6A34]" />
              </div>
              <div>
                <label for="address-street" class="mb-1.5 block text-xs font-bold text-[#576449]">Đường</label>
                <input id="address-street" v-model="addressForm.street" required maxlength="255" placeholder="Tên đường" class="w-full rounded-xl border border-[#DEE5D4] bg-white px-4 py-3 text-sm outline-none focus:border-[#4D6A34]" />
              </div>
              <div>
                <label for="address-hamlet" class="mb-1.5 block text-xs font-bold text-[#576449]">Ấp / thôn / khu phố <span class="font-normal">(nếu có)</span></label>
                <input id="address-hamlet" v-model="addressForm.hamlet" maxlength="150" placeholder="Ví dụ: Khu phố 1" class="w-full rounded-xl border border-[#DEE5D4] bg-white px-4 py-3 text-sm outline-none focus:border-[#4D6A34]" />
              </div>
              <div>
                <label for="address-ward" class="mb-1.5 block text-xs font-bold text-[#576449]">Phường / xã</label>
                <input id="address-ward" v-model="addressForm.ward" required maxlength="150" placeholder="Ví dụ: Phường Bến Nghé" class="w-full rounded-xl border border-[#DEE5D4] bg-white px-4 py-3 text-sm outline-none focus:border-[#4D6A34]" />
              </div>
              <div class="sm:col-span-2">
                <label for="address-province" class="mb-1.5 block text-xs font-bold text-[#576449]">Tỉnh / thành phố</label>
                <input id="address-province" v-model="addressForm.province" required maxlength="150" placeholder="Ví dụ: TP. Hồ Chí Minh" class="w-full rounded-xl border border-[#DEE5D4] bg-white px-4 py-3 text-sm outline-none focus:border-[#4D6A34]" />
              </div>
            </div>
            <div class="flex flex-wrap justify-end gap-2">
              <button type="button" @click="cancelAddressForm" class="rounded-xl border border-[#CCD7BC] bg-white px-4 py-2.5 text-sm font-semibold text-[#576449]">
                Hủy
              </button>
              <button type="submit" :disabled="addressSaving" class="inline-flex items-center gap-2 rounded-xl bg-[#4D6A34] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Save class="h-4 w-4" />
                {{ addressSaving ? 'Đang lưu…' : 'Lưu địa chỉ' }}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page :deep(button:not(:disabled)) {
  transition: filter 140ms ease;
}

.profile-page :deep(button:not(:disabled):hover) {
  filter: brightness(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .profile-page :deep(button) {
    transition: none;
  }
}
</style>
