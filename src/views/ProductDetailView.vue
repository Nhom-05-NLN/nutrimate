<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore, FIGMA_SEED_PRODUCTS } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { useToastStore } from '../stores/toastStore';
import { fetchProductById, fetchProductReviews, postProductReview, type ProductReview } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Product, ProductPortionOption } from '../types';
import ProductReviewModal from '../components/catalog/ProductReviewModal.vue';
import {
  ChevronRight,
  Star,
  ShieldCheck,
  Zap,
  RefreshCw,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ArrowLeft,
  AlertCircle,
  MessageSquare,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const cartStore = useCartStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const loadedProduct = ref<Product | null>(null);
const product = computed(() => loadedProduct.value);
const isLoading = ref<boolean>(true);
const errorMessage = ref<string | null>(null);

const quantity = ref<number | string>(1);
const availableStock = computed(() => Math.max(0, product.value?.stock ?? 0));

function normalizeQuantity() {
  const value = Number(quantity.value);
  quantity.value = Math.min(
    Math.max(1, Math.floor(Number.isFinite(value) ? value : 1)),
    Math.max(1, availableStock.value)
  );
}

function changeQuantity(amount: number) {
  normalizeQuantity();
  quantity.value = Math.min(Math.max(1, Number(quantity.value) + amount), Math.max(1, availableStock.value));
}
const selectedPortion = ref<string>('');
const activeTab = ref<'desc' | 'traceability' | 'reviews'>('desc');
const activeImageIndex = ref(0);

// Trạng thái modal đánh giá
const showReviewModal = ref(false);

const reviewsList = ref<ProductReview[]>([]);
const reviewsLoading = ref(false);
const reviewsError = ref('');
const reviewSubmitting = ref(false);

async function loadReviews(productId: string) {
  reviewsLoading.value = true;
  reviewsError.value = '';
  reviewsList.value = [];
  try {
    const reviews = await fetchProductReviews(productId);
    if (String(route.params.id) === productId) reviewsList.value = reviews;
  } catch (error) {
    if (String(route.params.id) === productId) {
      reviewsError.value = error instanceof Error ? error.message : 'Không thể tải đánh giá.';
    }
  } finally {
    if (String(route.params.id) === productId) reviewsLoading.value = false;
  }
}

function openReviewModal() {
  if (!authStore.currentUser) {
    toastStore.show('Vui lòng đăng nhập để viết đánh giá.', 'info');
    return;
  }
  showReviewModal.value = true;
}

// Danh sách hình ảnh động
const gallery = computed<string[]>(() => {
  if (product.value?.galleryImages && product.value.galleryImages.length > 0) {
    return product.value.galleryImages;
  }
  if (product.value?.image) {
    return [
      product.value.image,
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    ];
  }
  return ['https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80'];
});

// Danh sách quy cách sản phẩm
const portions = computed<ProductPortionOption[]>(() => {
  if (product.value?.portions && product.value.portions.length > 0) {
    return product.value.portions;
  }
  const basePrice = product.value?.price || 185000;
  const servingSize = product.value?.nutrition?.servingSize || '500g';

  return [
    { label: `Hũ ${servingSize}`, price: basePrice, weight: servingSize, inStock: true, savingBadge: 'Tiêu chuẩn' },
    { label: 'Hũ nhỏ 250g', price: Math.round((basePrice * 0.6) / 1000) * 1000, weight: '250g', inStock: true, savingBadge: 'Dùng thử' },
    { label: 'Túi refill 1kg', price: Math.round((basePrice * 1.8) / 1000) * 1000, weight: '1000g', inStock: true, savingBadge: 'Tiết kiệm 15%' },
  ];
});

// Giá tính toán theo phân loại đang chọn
const currentPrice = computed(() => {
  if (!product.value) return 0;
  const matched = portions.value.find((p) => p.label === selectedPortion.value);
  return matched ? matched.price : product.value.price;
});

// Tính phần trăm giảm giá
const discountPercent = computed(() => {
  if (!product.value?.originalPrice || product.value.originalPrice <= currentPrice.value) return 0;
  return Math.round(((product.value.originalPrice - currentPrice.value) / product.value.originalPrice) * 100);
});

// Sản phẩm liên quan: chỉ hiển thị các sản phẩm CÙNG DANH MỤC
const relatedProducts = computed<Product[]>(() => {
  const all = productStore.products.length > 0 ? productStore.products : FIGMA_SEED_PRODUCTS;
  if (!product.value) return [];

  return all
    .filter((p) => p.id !== product.value?.id && p.category === product.value?.category)
    .slice(0, 4);
});

// Điểm đánh giá hiển thị (được cập nhật động theo sản phẩm hoặc danh sách review)
const displayRating = computed(() => Number((product.value?.rating ?? 0).toFixed(1)));

const displayReviewCount = computed(() => product.value?.reviewCount ?? 0);

function formatNutritionGrams(value: number | undefined, isMilligrams = false): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  const grams = isMilligrams ? value / 1000 : value;
  return grams.toLocaleString('vi-VN', { maximumFractionDigits: 3 }) + ' g';
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Chuẩn hóa danh sách chuỗi
function normalizeTextList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
          .filter((item) => item.length > 0);
      }
    } catch {
    }
    return trimmed
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

const normalizedIngredients = computed<string[]>(() => {
  return normalizeTextList(product.value?.ingredients);
});

// Lấy thông tin sản phẩm từ API
async function loadProductDetail(productId: string) {
  isLoading.value = true;
  errorMessage.value = null;
  activeImageIndex.value = 0;
  loadedProduct.value = null;
  quantity.value = 1;

  try {
    const data = await fetchProductById(productId);
    loadedProduct.value = data;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Không thể tải sản phẩm từ cơ sở dữ liệu.';
  } finally {
    if (product.value) {
      selectedPortion.value = portions.value[0]?.label || 'Tiêu chuẩn';
    }
    isLoading.value = false;
  }
}

function handleAddToCart() {
  if (!product.value || availableStock.value <= 0) return false;
  normalizeQuantity();
  const productToAdd: Product = {
    ...product.value,
    price: currentPrice.value,
  };
  cartStore.addItem(
    route.query.source === 'ai' ? { ...productToAdd, isAiRecommended: true } : productToAdd,
    Number(quantity.value),
    selectedPortion.value,
  );
  toastStore.show('Đã thêm vào giỏ hàng', 'success', `${product.value.name} (${selectedPortion.value})`);
}

function handleBuyNow() {
  if (handleAddToCart() === false) return;
  router.push('/cart');
}

function goToProduct(targetId: string) {
  router.push(`/product/${targetId}`);
}

async function handleReviewSubmit(payload: { rating: number; content: string }) {
  if (!product.value || reviewSubmitting.value) return;
  const productId = String(route.params.id);
  reviewSubmitting.value = true;
  try {
    await postProductReview(productId, payload);
    showReviewModal.value = false;
    if (String(route.params.id) === productId) {
      await Promise.all([loadReviews(productId), fetchProductById(productId).then(detail => {
        if (String(route.params.id) === productId) loadedProduct.value = detail;
      })]);
    }
    toastStore.show('Đã lưu đánh giá của bạn!', 'success');
  } catch (error) {
    toastStore.show(error instanceof Error ? error.message : 'Không thể gửi đánh giá.', 'error');
  } finally {
    reviewSubmitting.value = false;
  }
}

onMounted(() => {
  if (productStore.products.length === 0) {
    productStore.loadProducts();
  }
  const id = String(route.params.id || 'prod-granola');
  loadProductDetail(id);
  loadReviews(id);
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      showReviewModal.value = false;
      loadProductDetail(String(newId));
      loadReviews(String(newId));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
);
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <nav aria-label="Breadcrumb" class="text-xs text-[#7A866E]">
      <ol class="flex flex-wrap items-center gap-2">
        <li><RouterLink to="/catalog" class="hover:text-[#4D6A34]">Sản phẩm</RouterLink></li>
        <li aria-hidden="true"><ChevronRight class="h-3.5 w-3.5" /></li>
        <li aria-current="page" class="font-semibold text-[#2D3B1E]">{{ product?.name || 'Chi tiết sản phẩm' }}</li>
      </ol>
    </nav>
    <!-- TRẠNG THÁI 1: LOADING SKELETON -->
    <div v-if="isLoading" class="animate-pulse space-y-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        <div class="lg:col-span-5 space-y-4">
          <div class="aspect-square bg-[#E8ECE2] rounded-3xl"></div>
          <div class="grid grid-cols-4 gap-3.5">
            <div v-for="i in 4" :key="i" class="aspect-square bg-[#E8ECE2] rounded-2xl"></div>
          </div>
        </div>
        <div class="lg:col-span-7 space-y-6">
          <div class="h-8 bg-[#E8ECE2] rounded-xl w-3/4"></div>
          <div class="h-5 bg-[#E8ECE2] rounded-lg w-1/3"></div>
          <div class="h-20 bg-[#E8ECE2] rounded-2xl w-full"></div>
          <div class="grid grid-cols-4 gap-3">
            <div v-for="i in 4" :key="i" class="h-20 bg-[#E8ECE2] rounded-2xl"></div>
          </div>
          <div class="h-14 bg-[#E8ECE2] rounded-2xl w-full"></div>
        </div>
      </div>
    </div>

    <!-- TRẠNG THÁI 2: LỖI / KHÔNG TÌM THẤY SẢN PHẨM -->
    <div
      v-else-if="errorMessage || !product"
      class="text-center py-20 px-4 bg-white rounded-3xl border border-[#E3E8DC] shadow-sm space-y-5"
    >
      <div class="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
        <AlertCircle class="w-8 h-8" />
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-black text-[#242424] font-heading">Không tìm thấy sản phẩm</h2>
        <p class="text-sm text-[#7A866E] max-w-md mx-auto">
          {{ errorMessage || 'Sản phẩm bạn đang tìm kiếm có thể đã bị xóa hoặc tạm ngưng kinh doanh.' }}
        </p>
      </div>
      <div class="pt-2">
        <button
          type="button"
          @click="router.push('/catalog')"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#4D6A34] text-white font-bold hover:bg-[#3B4E24] transition-colors cursor-pointer"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Quay lại Thực đơn</span>
        </button>
      </div>
    </div>

    <!-- TRẠNG THÁI 3: NỘI DUNG CHI TIẾT SẢN PHẨM HOÀN CHỈNH -->
    <div v-else class="space-y-12">
      <!-- Product Main Top Grid (2 Columns) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <!-- Cột Trái: Gallery Ảnh & Thumbnails -->
        <div class="lg:col-span-5 space-y-4">
          <!-- Ảnh Chính -->
          <div class="relative aspect-square w-full rounded-3xl overflow-hidden border border-[#E3E8DC] bg-white shadow-xs group">
            <img
              :src="gallery[activeImageIndex] || product.image"
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <!-- Thumbnails ảnh -->
          <div v-if="gallery.length > 1" class="grid grid-cols-4 gap-3.5">
            <button
              v-for="(img, idx) in gallery"
              :key="idx"
              type="button"
              @click="activeImageIndex = idx"
              class="aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer"
              :class="activeImageIndex === idx ? 'border-[#4D6A34] shadow-md scale-102 ring-2 ring-[#4D6A34]/20' : 'border-[#E3E8DC] opacity-75 hover:opacity-100'"
            >
              <img :src="img" :alt="`Thumb ${idx + 1}`" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Cột Phải: Thông Tin Mua Hàng & Giá -->
        <div class="lg:col-span-7 space-y-7">
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-[#4D6A34] bg-[#EBF7E5] px-3 py-1 rounded-full border border-[#CCD7BC]">
                {{ product.categoryName || 'Dinh dưỡng sạch' }}
              </span>
              <span class="text-xs text-[#7A866E] font-medium">Mã SKU: {{ product.code }}</span>
            </div>

            <h1 class="font-heading text-2xl sm:text-3xl lg:text-[32px] font-black text-[#242424] leading-snug">
              {{ product.name }}
            </h1>

            <div class="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#68725F]">
              <div
                class="flex items-center gap-1.5 font-bold text-[#E8A020] cursor-pointer hover:opacity-80 transition-opacity"
                @click="activeTab = 'reviews'"
              >
                <div class="flex text-[#E8A020]">
                  <Star
                    v-for="i in 5"
                    :key="i"
                    class="w-4 h-4"
                    :class="i <= Math.round(displayRating) ? 'fill-[#E8A020] text-[#E8A020]' : 'text-stone-300'"
                  />
                </div>
                <span class="text-[#242424] ml-1 font-bold">{{ displayRating }}</span>
                <span class="text-[#7A866E] font-medium underline">({{ displayReviewCount }} đánh giá)</span>
              </div>
              <span>•</span>
              <span class="font-bold text-[#242424]">Đã bán {{ product.soldCount || '0' }}</span>
              <span>•</span>
              <span class="text-[#4D6A34] font-bold flex items-center gap-1.5">
                <ShieldCheck class="w-4 h-4 text-[#4D6A34]" /> Cam kết chính hãng
              </span>
            </div>
          </div>

          <!-- Giá tiền & Khuyến mãi -->
          <div class="p-5 rounded-2xl bg-[#F6F8F3] border border-[#E8ECE2] space-y-2">
            <div class="flex flex-wrap items-baseline gap-4">
              <span class="font-heading text-3xl sm:text-4xl font-black text-[#242424]">
                {{ formatVnd(currentPrice) }}
              </span>
              <span
                v-if="product.originalPrice && product.originalPrice > currentPrice"
                class="text-base font-bold text-[#7A866E] line-through"
              >
                {{ formatVnd(product.originalPrice) }}
              </span>
              <span
                v-if="discountPercent > 0"
                class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-2xs"
              >
                -{{ discountPercent }}%
              </span>
            </div>
          </div>

          <!-- Tóm tắt dinh dưỡng nổi bật -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between text-sm">
              <span class="font-bold text-[#242424]">
                Tóm tắt dinh dưỡng nổi bật
              </span>
              <span class="text-xs text-[#7A866E]">
                Khẩu phần: <strong class="text-[#242424]">{{ product.nutrition?.servingSize || '100g' }}</strong>
              </span>
            </div>
            <div class="grid grid-cols-4 gap-3 text-center">
              <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] flex flex-col items-center justify-center shadow-2xs">
                <span class="text-xs text-[#7A866E] block font-medium">Năng lượng</span>
                <span class="font-heading text-xl font-black text-[#242424] mt-1">
                  {{ product.nutrition?.calories || 0 }} <span class="text-xs font-normal">kcal</span>
                </span>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] flex flex-col items-center justify-center shadow-2xs">
                <span class="text-xs text-[#7A866E] block font-medium">Chất đạm</span>
                <span class="font-heading text-xl font-black text-[#4D6A34] mt-1">
                  {{ product.nutrition?.protein || 0 }} <span class="text-xs font-normal">g</span>
                </span>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] flex flex-col items-center justify-center shadow-2xs">
                <span class="text-xs text-[#7A866E] block font-medium">Đường</span>
                <span class="font-heading text-xl font-black text-[#4D6A34] mt-1">
                  {{ product.nutrition?.sugar || 0 }} <span class="text-xs font-normal">g</span>
                </span>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] flex flex-col items-center justify-center shadow-2xs">
                <span class="text-xs text-[#7A866E] block font-medium">Tinh bột</span>
                <span class="font-heading text-xl font-black text-[#4D6A34] mt-1">
                  {{ product.nutrition?.carbs || 0 }} <span class="text-xs font-normal">g</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Phân loại & Trọng lượng -->
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="font-bold text-[#242424]">Phân loại & Trọng lượng</span>
              <span class="text-[#4D6A34] font-bold text-xs sm:text-sm">
                {{ portions.find((p) => p.label === selectedPortion)?.savingBadge || 'Chính hãng' }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <button
                v-for="p in portions"
                :key="p.label"
                type="button"
                @click="selectedPortion = p.label"
                class="py-4 px-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all relative cursor-pointer"
                :class="
                  selectedPortion === p.label
                    ? 'border-2 border-[#536124] bg-[#EAEFE3] shadow-xs'
                    : 'border border-[#E3E8DC] bg-white hover:border-[#CCD7BC]'
                "
              >
                <!-- Checkmark badge ở góc trên phải -->
                <div
                  v-if="selectedPortion === p.label"
                  class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#536124] text-white flex items-center justify-center border-2 border-white shadow-xs"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>

                <span class="font-heading text-base font-bold text-[#242424] text-center block">
                  {{ p.label }}
                </span>
                <span
                  class="text-sm font-bold text-center mt-1 block"
                  :class="selectedPortion === p.label ? 'text-[#4D6A34]' : 'text-[#7A866E]'"
                >
                  {{ formatVnd(p.price) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Bộ chọn số lượng & Trạng thái tồn kho -->
          <div class="flex items-center gap-6 pt-2">
            <div class="flex items-center border border-[#CCD7BC] rounded-2xl bg-white p-1 shadow-2xs">
              <button
                type="button"
                @click="changeQuantity(-1)"
                :disabled="availableStock <= 0 || Number(quantity) <= 1"
                aria-label="Giảm số lượng"
                class="w-9 h-9 rounded-xl flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                <Minus class="w-4 h-4 stroke-[2.5]" />
              </button>
              <input
                v-model="quantity"
                type="number"
                inputmode="numeric"
                min="1"
                :max="Math.max(1, availableStock)"
                step="1"
                :disabled="availableStock <= 0"
                aria-label="Số lượng sản phẩm"
                class="w-16 appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none bg-transparent text-center font-black text-base text-[#242424] outline-none disabled:opacity-50"
                @change="normalizeQuantity"
                @blur="normalizeQuantity"
              />
              <button
                type="button"
                @click="changeQuantity(1)"
                :disabled="availableStock <= 0 || Number(quantity) >= availableStock"
                aria-label="Tăng số lượng"
                class="w-9 h-9 rounded-xl flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                <Plus class="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <span class="text-sm font-semibold flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'"
              ></span>
              <span v-if="product.stock > 0" class="text-[#242424]">Còn hàng ({{ product.stock }} sản phẩm có sẵn)</span>
              <span v-else class="text-rose-600 font-bold">Tạm hết hàng</span>
            </span>
          </div>

          <!-- 2 Nút Mua hàng to -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              :disabled="product.stock <= 0"
              @click="handleAddToCart"
              class="py-4 px-6 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md transition-all min-h-[48px] cursor-pointer"
            >
              <ShoppingBag class="w-5 h-5 stroke-[2]" />
              <span>Thêm vào giỏ hàng</span>
            </button>

            <button
              type="button"
              :disabled="product.stock <= 0"
              @click="handleBuyNow"
              class="py-4 px-6 rounded-2xl bg-[#232722] hover:bg-black active:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md transition-all min-h-[48px] cursor-pointer"
            >
              <Zap class="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Mua ngay</span>
            </button>
          </div>

          <!-- 3 Cam kết dịch vụ -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E3E8DC] text-xs text-[#576449]">
            <div class="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#F0F3EC]">
              <Zap class="w-4 h-4 text-[#4D6A34] shrink-0" />
              <div>
                <span class="font-bold text-[#242424] block text-xs">Giao 2H Siêu Tốc</span>
                <span class="text-[11px] text-[#7A866E]">Nội thành nhanh chóng</span>
              </div>
            </div>
            <div class="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#F0F3EC]">
              <ShieldCheck class="w-4 h-4 text-[#4D6A34] shrink-0" />
              <div>
                <span class="font-bold text-[#242424] block text-xs">Hoàn tiền 200%</span>
                <span class="text-[11px] text-[#7A866E]">Nếu phát hiện hàng giả</span>
              </div>
            </div>
            <div class="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#F0F3EC]">
              <RefreshCw class="w-4 h-4 text-[#4D6A34] shrink-0" />
              <div>
                <span class="font-bold text-[#242424] block text-xs">Đổi trả 7 ngày</span>
                <span class="text-[11px] text-[#7A866E]">Miễn phí nếu lỗi nhà sản xuất</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Section & Nutrition Facts Table -->
      <div class="pt-10 border-t border-[#E3E8DC]">
        <!-- Tab Header Buttons -->
        <div class="flex items-center gap-8 border-b border-[#E3E8DC] mb-8 overflow-x-auto no-scrollbar">
          <button
            type="button"
            @click="activeTab = 'desc'"
            class="pb-3.5 text-base font-bold transition-all relative shrink-0 cursor-pointer"
            :class="activeTab === 'desc' ? 'text-[#242424] border-b-[3px] border-[#4D6A34]' : 'text-[#7A866E] hover:text-[#242424]'"
          >
            Mô tả sản phẩm
          </button>
          <button
            type="button"
            @click="activeTab = 'reviews'"
            class="pb-3.5 text-base font-bold transition-all relative shrink-0 cursor-pointer flex items-center gap-1.5"
            :class="activeTab === 'reviews' ? 'text-[#242424] border-b-[3px] border-[#4D6A34]' : 'text-[#7A866E] hover:text-[#242424]'"
          >
            <span>Đánh giá khách hàng</span>
            <span class="px-2 py-0.5 rounded-full text-xs bg-[#EBF7E5] text-[#4D6A34] font-bold">
              {{ displayReviewCount }}
            </span>
          </button>
        </div>

        <!-- Tab Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <!-- Cột Trái: Nội dung Tab -->
          <div class="lg:col-span-7 space-y-7">
            <!-- TAB 1: MÔ TẢ & HƯỚNG DẪN -->
            <div v-if="activeTab === 'desc'" class="space-y-6 text-sm sm:text-base text-[#4E5C3E] leading-relaxed">
              <div>
                <h3 class="font-heading text-xl font-bold text-[#242424] mb-2.5">
                  {{ product.name }}
                </h3>
                <p class="leading-relaxed">
                  {{ product.description || 'Sản phẩm dinh dưỡng sạch được kiểm định nghiêm ngặt từ nguồn nguyên liệu tự nhiên cao cấp, phù hợp cho lối sống lành mạnh và chế độ ăn cân bằng.' }}
                </p>
              </div>

              <!-- 3 Cách thưởng thức dinh dưỡng mỗi ngày -->
              <div class="space-y-3">
                <h4 class="font-heading text-base font-bold text-[#242424]">
                  Gợi ý sử dụng lành mạnh mỗi ngày:
                </h4>
                <ul class="space-y-2.5 text-xs sm:text-sm text-[#4E5C3E]">
                  <li class="flex items-start gap-2.5">
                    <span class="w-6 h-6 rounded-full bg-[#EBF7E5] text-[#4D6A34] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span><strong>Dùng trực tiếp:</strong> Thích hợp làm món ăn vặt giàu năng lượng sạch trong giờ làm việc hoặc trước khi tập luyện 30 phút.</span>
                  </li>
                  <li class="flex items-start gap-2.5">
                    <span class="w-6 h-6 rounded-full bg-[#EBF7E5] text-[#4D6A34] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span><strong>Kết hợp sữa chua hoặc sữa hạt:</strong> Dùng kèm sữa chua Hy Lạp hoặc sữa hạnh nhân không đường để tạo bữa sáng nhanh gọn, giàu đạm.</span>
                  </li>
                  <li class="flex items-start gap-2.5">
                    <span class="w-6 h-6 rounded-full bg-[#EBF7E5] text-[#4D6A34] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span><strong>Bảo quản:</strong> Để nơi khô ráo, thoáng mát, đậy kín nắp sau khi sử dụng để giữ nguyên độ tươi ngon và giòn rụm.</span>
                  </li>
                </ul>
              </div>

              <!-- Thành phần nguyên liệu chi tiết -->
              <div class="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC] text-xs sm:text-sm space-y-2">
                <span class="font-bold text-[#242424] block">Thành phần nguyên liệu chi tiết:</span>
                <div v-if="normalizedIngredients.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="(ing, idx) in normalizedIngredients"
                    :key="idx"
                    class="px-3.5 py-1.5 bg-white border border-[#CCD7BC] rounded-xl text-xs font-semibold text-[#4D6A34] shadow-2xs"
                  >
                    {{ ing }}
                  </span>
                </div>
                <p v-else class="text-[#576449]">Nguyên liệu thuần tự nhiên, đã qua kiểm định an toàn vệ sinh thực phẩm.</p>
              </div>
            </div>

            <!-- TAB 2: ĐÁNH GIÁ KHÁCH HÀNG -->
            <div v-else class="space-y-6 text-sm sm:text-base text-[#4E5C3E]">
              <!-- Rating Summary Banner -->
              <div class="p-6 rounded-xl bg-white border border-[#E3E8DC] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div class="text-center sm:text-left space-y-1">
                  <div class="flex items-baseline gap-2">
                    <span class="font-heading text-4xl font-black text-[#242424]">{{ displayRating }}</span>
                    <span class="text-base text-[#7A866E]">/ 5</span>
                  </div>
                  <div class="flex text-[#E8A020]">
                    <Star
                      v-for="i in 5"
                      :key="i"
                      class="w-4 h-4"
                      :class="i <= Math.round(displayRating) ? 'fill-[#E8A020] text-[#E8A020]' : 'text-stone-300'"
                    />
                  </div>
                  <span class="text-xs text-[#7A866E] block">Dựa trên {{ displayReviewCount }} lượt đánh giá thực tế</span>
                </div>

                <button
                  type="button"
                  @click="openReviewModal"
                  class="px-5 py-3 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare class="w-4 h-4" />
                  <span>Viết đánh giá</span>
                </button>
              </div>

              <p v-if="reviewsLoading" class="py-6 text-center text-sm text-[#7A866E]">Đang tải đánh giá...</p>
              <p v-else-if="reviewsError" role="alert" class="py-6 text-center text-sm text-rose-600">{{ reviewsError }}</p>
              <p v-else-if="!reviewsList.length" class="py-6 text-center text-sm text-[#7A866E]">Chưa có đánh giá nào</p>
              <!-- Danh sách nhận xét -->
              <div class="space-y-3.5">
                <div
                  v-for="rev in reviewsList"
                  :key="rev.id"
                  class="p-5 rounded-xl bg-white border border-[#E3E8DC] space-y-2.5 shadow-2xs"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-[#EBF7E5] text-[#4D6A34] font-black text-xs flex items-center justify-center">
                        {{ rev.author.charAt(0) }}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-sm text-[#242424]">{{ rev.author }}</span>
                        </div>
                        <span class="text-[11px] text-[#7A866E]">{{ new Date(rev.createdAt).toLocaleDateString('vi-VN') }}</span>
                      </div>
                    </div>

                    <div class="flex text-[#E8A020]">
                      <Star
                        v-for="i in 5"
                        :key="i"
                        class="w-3.5 h-3.5"
                        :class="i <= rev.rating ? 'fill-[#E8A020] text-[#E8A020]' : 'text-stone-300'"
                      />
                    </div>
                  </div>

                  <p class="text-xs sm:text-sm text-[#4E5C3E] leading-relaxed">
                    "{{ rev.content }}"
                  </p>

                </div>
              </div>
            </div>
          </div>

          <!-- Cột Phải: Bảng THÔNG TIN DINH DƯỠNG Chuẩn Khoa Học -->
          <div class="lg:col-span-5 bg-white p-7 rounded-3xl border border-[#E3E8DC] shadow-sm space-y-5">
            <div class="border-b-4 border-[#242424] pb-2.5">
              <h3 class="font-heading text-xl font-black text-[#242424] uppercase tracking-wider">
                Thông Tin Dinh Dưỡng
              </h3>
              <p class="text-xs text-[#7A866E]">Chuẩn kiểm định Viện Dinh Dưỡng</p>
            </div>

            <div class="flex justify-between text-sm py-1 border-b border-[#ECEFE7]">
              <span class="font-bold text-[#242424]">Khẩu phần khuyến nghị</span>
              <span class="font-normal text-[#242424]">{{ product.nutrition?.servingSize || '100g' }}</span>
            </div>

            <!-- Calo lớn -->
            <div class="flex items-center justify-between py-3 border-b-2 border-[#242424]">
              <div>
                <span class="text-sm font-bold text-[#242424] block uppercase">Năng Lượng / Calo</span>
                <span class="text-xs text-[#7A866E]">{{ product.nutrition?.servingSize || '100g' }}</span>
              </div>
              <span class="font-heading text-4xl font-black text-[#242424]">
                {{ product.nutrition?.calories || 0 }} <span class="text-base font-normal">kcal</span>
              </span>
            </div>

            <div class="space-y-2 text-sm text-[#242424]">
              <div class="flex justify-between gap-4 py-1 border-b border-[#F0F3EC]">
                <span class="font-bold">Tổng chất béo (Total Fat)</span>
                <span class="shrink-0 font-bold">{{ formatNutritionGrams(product.nutrition?.fat) }}</span>
              </div>
              <div class="flex justify-between gap-4 pl-4 text-[#7A866E] text-xs">
                <span>Chất béo bão hòa</span>
                <span class="shrink-0">{{ formatNutritionGrams(product.nutrition?.saturatedFat) }}</span>
              </div>
              <div class="flex justify-between gap-4 pl-4 text-[#7A866E] text-xs">
                <span>Chất béo chuyển hóa</span>
                <span class="shrink-0">{{ formatNutritionGrams(product.nutrition?.transFat) }}</span>
              </div>
              <div class="flex justify-between gap-4 py-1 border-b border-[#F0F3EC]">
                <span class="font-bold">Cholesterol</span>
                <span class="shrink-0 font-bold">{{ formatNutritionGrams(product.nutrition?.cholesterol, true) }}</span>
              </div>
              <div class="flex justify-between gap-4 py-1 border-b border-[#F0F3EC]">
                <span class="font-bold">Natri (Sodium)</span>
                <span class="shrink-0 font-bold">{{ formatNutritionGrams(product.nutrition?.sodium, true) }}</span>
              </div>
              <div class="flex justify-between gap-4 py-1 border-b border-[#F0F3EC]">
                <span class="font-bold">Tổng Carbohydrate</span>
                <span class="shrink-0 font-bold">{{ formatNutritionGrams(product.nutrition?.carbs) }}</span>
              </div>
              <div class="flex justify-between gap-4 pl-4 text-[#7A866E] text-xs">
                <span>Chất xơ tiêu hóa</span>
                <span class="shrink-0">{{ formatNutritionGrams(product.nutrition?.fiber) }}</span>
              </div>
              <div class="flex justify-between gap-4 pl-4 text-[#7A866E] text-xs">
                <span>Đường tổng</span>
                <span class="shrink-0">{{ formatNutritionGrams(product.nutrition?.sugar) }}</span>
              </div>
              <div class="flex justify-between gap-4 py-1 border-b border-[#F0F3EC]">
                <span class="font-bold">Chất đạm</span>
                <span class="shrink-0 font-bold">{{ formatNutritionGrams(product.nutrition?.protein) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section "Các sản phẩm liên quan" -->
      <div v-if="relatedProducts.length > 0" class="pt-10 border-t border-[#E3E8DC]">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h3 class="font-heading text-2xl font-black text-[#242424]">Các sản phẩm liên quan</h3>
          </div>
        </div>

        <!-- Grid thẻ sản phẩm tương tự trang Sản phẩm -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div
            v-for="rel in relatedProducts"
            :key="rel.id"
            class="group relative flex flex-col bg-white rounded-xl border border-[#E3E8DC] hover:border-[#4D6A34] hover:shadow-xl transition-all duration-200 overflow-hidden"
          >
            <!-- Product Image -->
            <div class="relative aspect-4/3 w-full bg-[#FAF9F5] overflow-hidden cursor-pointer" @click="goToProduct(rel.id)">
              <img
                :src="rel.image"
                :alt="rel.name"
                loading="lazy"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <!-- Content -->
            <div class="p-5 flex-1 flex flex-col justify-between space-y-3.5">
              <div class="flex items-center justify-between text-xs text-[#576449]">
                <span class="text-[11px] font-semibold truncate max-w-[130px]" :title="rel.categoryName">
                  {{ rel.categoryName }}
                </span>
                <div class="flex items-center gap-1 font-bold text-[#2D3B1E] shrink-0">
                  <Star class="w-3.5 h-3.5 fill-[#E8A020] text-[#E8A020]" />
                  <span>{{ rel.rating ?? 4.9 }}</span>
                  <span class="text-[#7A866E] font-medium text-[11px]">({{ rel.reviewCount ?? 0 }})</span>
                </div>
              </div>

              <h4
                @click="goToProduct(rel.id)"
                class="font-heading text-base font-bold text-[#242424] hover:text-[#4D6A34] transition-colors cursor-pointer line-clamp-2 leading-snug"
                :title="rel.name"
              >
                {{ rel.name }}
              </h4>

              <!-- 4 Trụ Cột Dinh Dưỡng -->
              <div class="grid grid-cols-4 gap-1 p-2 rounded-[8px] bg-[#F6F8F3] border border-[#E3E8DC] text-center">
                <div class="px-1">
                  <span class="text-[10px] text-[#7A866E] uppercase block font-semibold">Calo</span>
                  <span class="text-sm font-extrabold text-[#2D3B1E]">{{ rel.nutrition?.calories ?? 0 }}</span>
                </div>
                <div class="px-1 border-l border-[#E3E8DC]">
                  <span class="text-[10px] text-[#7A866E] uppercase block font-semibold">Đạm</span>
                  <span class="text-sm font-extrabold text-[#4D6A34]">{{ rel.nutrition?.protein ?? 0 }}g</span>
                </div>
                <div class="px-1 border-l border-[#E3E8DC]">
                  <span class="text-[10px] text-[#7A866E] uppercase block font-semibold">Carb</span>
                  <span class="text-sm font-extrabold text-[#2D3B1E]">{{ rel.nutrition?.carbs ?? 0 }}g</span>
                </div>
                <div class="px-1 border-l border-[#E3E8DC]">
                  <span class="text-[10px] text-[#7A866E] uppercase block font-semibold">Đường</span>
                  <span class="text-sm font-extrabold text-[#2D3B1E]">{{ rel.nutrition?.sugar ?? 0 }}g</span>
                </div>
              </div>

              <!-- Price & Nút Xem chi tiết -->
              <div class="pt-2.5 flex items-center justify-between border-t border-[#F0F3EC]">
                <span class="font-heading text-base sm:text-lg font-black text-[#242424]">
                  {{ formatVnd(rel.price) }}
                </span>

                <button
                  type="button"
                  @click="goToProduct(rel.id)"
                  class="px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white border border-[#CCD7BC] hover:border-[#4D6A34] text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem chi tiết</span>
                  <ChevronRight class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL VIẾT ĐÁNH GIÁ -->
    <ProductReviewModal
      v-model="showReviewModal"
      :submitting="reviewSubmitting"
      :author-name="authStore.currentUser?.name"
      :product-name="product?.name"
      @submit="handleReviewSubmit"
    />
  </div>
</template>
