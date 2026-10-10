<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '../stores/cartStore';
import { useToastStore } from '../stores/toastStore';
import { Product } from '../types';
import {
  ChevronRight,
  Star,
  ShieldCheck,
  Zap,
  RefreshCw,
  ShoppingBag,
  Plus,
  Minus,
  Heart,
  Check,
  Sparkles,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const toastStore = useToastStore();

const isLiked = ref(false);
const quantity = ref(1);
const selectedPortion = ref('Hũ 500g');
const activeTab = ref<'desc' | 'traceability' | 'reviews'>('desc');
const activeImageIndex = ref(0);

const gallery = [
  'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
];

const portions = [
  { label: 'Hũ 500g', price: 185000, desc: 'Tiêu chuẩn' },
  { label: 'Hũ 250g', price: 105000, desc: 'Dùng thử' },
  { label: 'Túi refill 1000g', price: 330000, desc: 'Tiết kiệm 15%' },
];

const currentPrice = computed(() => {
  const p = portions.find((x) => x.label === selectedPortion.value);
  return p ? p.price : 185000;
});

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleAddToCart() {
  const prod: Product = {
    id: 'prod-granola',
    code: 'NM-GRN-01',
    name: `Granola Yến Mạch Hạt Dinh Dưỡng Siêu Hạt (${selectedPortion.value})`,
    category: 'snacks-nuts',
    categoryName: 'Hạt dinh dưỡng',
    price: currentPrice.value,
    image: gallery[0],
    description: 'Granola nướng mật ong tự nhiên không đường tinh luyện.',
    ingredients: ['Yến mạch Úc (45%)', 'Hạnh nhân Mỹ (15%)', 'Quả óc chó Chile (10%)', 'Hạt điều Bình Phước (10%)'],
    nutrition: {
      servingSize: '40g',
      calories: 152,
      protein: 14,
      carbs: 18,
      fat: 6,
      sugar: 3,
    },
    stock: 142,
    rating: 4.9,
    reviewCount: 128,
    badges: ['Top 1 Bán Chạy'],
    bestFor: 'Bữa sáng & Ăn xế',
  };

  cartStore.addItem(prod, quantity.value, selectedPortion.value);
}

function handleBuyNow() {
  handleAddToCart();
  router.push('/cart');
}

function addComboItem(name: string, price: number, kcal: number, protein: number) {
  cartStore.addItem(
    {
      id: `combo-${Date.now()}`,
      code: 'NM-CMB',
      name,
      category: 'snacks-nuts',
      categoryName: 'Món mua cùng',
      price,
      image: gallery[2],
      description: 'Món ăn kèm hoàn hảo cho bữa sáng lành mạnh.',
      ingredients: ['Thành phần organic'],
      nutrition: {
        servingSize: '1 phần',
        calories: kcal,
        protein,
        carbs: 10,
        fat: 5,
        sugar: 1,
      },
      stock: 50,
      rating: 4.9,
      reviewCount: 30,
      badges: ['Combo'],
      bestFor: 'Ăn kèm bữa phụ',
    },
    1,
    'Món ăn kèm'
  );
}
</script>

<template>
  <div class="max-w-[1316px] mx-auto px-4 sm:px-8 py-8 space-y-10">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#2D3B1E]">Trang chủ</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <RouterLink to="/catalog" class="hover:text-[#2D3B1E]">Thực phẩm</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="hover:text-[#2D3B1E]">Hạt dinh dưỡng</span>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="text-[#2D3B1E] font-bold truncate max-w-xs sm:max-w-md">Granola Yến Mạch Hạt Dinh Dưỡng Siêu Hạt 500g</span>
    </nav>

    <!-- Product Main Top Grid (2 Columns) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <!-- Cột Trái: Gallery Ảnh & Thumbnails -->
      <div class="lg:col-span-5 space-y-4">
        <!-- Ảnh Chính -->
        <div class="relative aspect-square w-full rounded-3xl overflow-hidden border border-[#E3E8DC] bg-white shadow-xs">
          <img
            :src="gallery[activeImageIndex]"
            alt="Granola Yến Mạch Hạt Dinh Dưỡng"
            class="w-full h-full object-cover"
          />

          <!-- Badges -->
          <div class="absolute top-4 left-4 flex flex-col gap-1.5">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF9F5]/90 backdrop-blur-xs text-[#2D3B1E] border border-[#CCD7BC]">
              ★ Bán chạy nhất #1
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF9F5]/90 backdrop-blur-xs text-[#2D3B1E] border border-[#CCD7BC]">
              🌱 100% Tự Nhiên
            </span>
          </div>

          <!-- Favorite -->
          <button
            type="button"
            @click="isLiked = !isLiked"
            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs border border-[#CCD7BC] flex items-center justify-center text-[#7A866E] hover:text-rose-500 transition-colors"
            aria-label="Yêu thích"
          >
            <Heart class="w-5 h-5" :class="{ 'fill-rose-500 text-rose-500': isLiked }" />
          </button>
        </div>

        <!-- Thumbnails 4 ảnh -->
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="(img, idx) in gallery"
            :key="idx"
            type="button"
            @click="activeImageIndex = idx"
            class="aspect-square rounded-2xl overflow-hidden border-2 transition-all"
            :class="activeImageIndex === idx ? 'border-[#4D6A34] shadow-xs' : 'border-[#E3E8DC] opacity-70 hover:opacity-100'"
          >
            <img :src="img" alt="thumb" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Cột Phải: Thông Tin Mua Hàng & Giá -->
      <div class="lg:col-span-7 space-y-6">
        <div>
          <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E] leading-snug">
            Granola Yến Mạch Hạt Dinh Dưỡng Siêu Hạt 500g - Vị Mật Ong & Vani Tự Nhiên
          </h1>

          <div class="flex flex-wrap items-center gap-4 text-xs font-medium text-[#7A866E] mt-3">
            <div class="flex items-center gap-1 font-bold text-[#E8A020]">
              <Star v-for="i in 5" :key="i" class="w-3.5 h-3.5 fill-[#E8A020]" />
              <span class="text-[#2D3B1E] ml-1">4.9</span>
              <span class="text-[#7A866E] font-normal">(128 đánh giá)</span>
            </div>
            <span>•</span>
            <span>Đã bán 2.4k</span>
            <span>•</span>
            <span class="text-[#4D6A34] font-semibold flex items-center gap-1">
              <ShieldCheck class="w-3.5 h-3.5" /> Cam kết chính hãng
            </span>
          </div>
        </div>

        <!-- Giá tiền -->
        <div class="flex items-baseline gap-3 p-4 rounded-2xl bg-[#F6F8F3] border border-[#E8ECE2]">
          <span class="font-heading text-3xl font-black text-[#2D3B1E]">
            {{ formatVnd(currentPrice) }}
          </span>
          <span class="text-xs font-medium text-[#7A866E] bg-[#EBF1E6] px-2.5 py-1 rounded-full border border-[#CCD7BC]">
            Đã bao gồm thuế VAT
          </span>
        </div>

        <!-- Tóm tắt dinh dưỡng nổi bật 4 ô (Figma Style) -->
        <div class="space-y-2">
          <span class="text-xs font-bold text-[#2D3B1E] block">
            Tóm tắt dinh dưỡng nổi bật (trên 100g)
          </span>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div class="p-3 rounded-2xl bg-white border border-[#E3E8DC]">
              <span class="text-[10px] text-[#7A866E] block font-medium">Năng lượng</span>
              <span class="font-heading text-base font-extrabold text-[#2D3B1E]">380 <span class="text-xs font-normal">kcal</span></span>
            </div>
            <div class="p-3 rounded-2xl bg-white border border-[#E3E8DC]">
              <span class="text-[10px] text-[#7A866E] block font-medium">Chất đạm</span>
              <span class="font-heading text-base font-extrabold text-[#4D6A34]">14 <span class="text-xs font-normal">g</span></span>
            </div>
            <div class="p-3 rounded-2xl bg-white border border-[#E3E8DC]">
              <span class="text-[10px] text-[#7A866E] block font-medium">Đường tự nhiên</span>
              <span class="font-heading text-base font-extrabold text-[#2D3B1E]">3 <span class="text-xs font-normal">g</span></span>
            </div>
            <div class="p-3 rounded-2xl bg-white border border-[#E3E8DC]">
              <span class="text-[10px] text-[#7A866E] block font-medium">Chất xơ</span>
              <span class="font-heading text-base font-extrabold text-[#2D3B1E]">8 <span class="text-xs font-normal">g</span></span>
            </div>
          </div>
        </div>

        <!-- Phân loại & Trọng lượng -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-[#2D3B1E]">Phân loại & Trọng lượng</span>
            <span class="text-[#4D6A34] font-semibold">Hũ 500g tiết kiệm 15%</span>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="p in portions"
              :key="p.label"
              type="button"
              @click="selectedPortion = p.label"
              class="p-3 rounded-2xl border text-left transition-all relative"
              :class="
                selectedPortion === p.label
                  ? 'border-[#4D6A34] bg-[#F6F8F3] shadow-xs'
                  : 'border-[#E3E8DC] bg-white hover:border-[#CCD7BC]'
              "
            >
              <div v-if="selectedPortion === p.label" class="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#4D6A34] text-white flex items-center justify-center">
                <Check class="w-2.5 h-2.5" />
              </div>
              <span class="text-xs font-bold text-[#2D3B1E] block">{{ p.label }}</span>
              <span class="text-xs font-semibold text-[#4D6A34] mt-0.5 block">{{ formatVnd(p.price) }}</span>
            </button>
          </div>
        </div>

        <!-- Số lượng & Kho -->
        <div class="flex items-center gap-6 pt-2">
          <div class="flex items-center border border-[#CCD7BC] rounded-2xl bg-white p-1">
            <button
              type="button"
              @click="quantity = Math.max(1, quantity - 1)"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5]"
            >
              <Minus class="w-3.5 h-3.5" />
            </button>
            <span class="w-10 text-center font-bold text-sm text-[#2D3B1E]">{{ quantity }}</span>
            <button
              type="button"
              @click="quantity++"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-[#576449] hover:bg-[#FAF9F5]"
            >
              <Plus class="w-3.5 h-3.5" />
            </button>
          </div>

          <span class="text-xs font-medium text-[#7A866E] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Còn hàng (142 sản phẩm có sẵn)
          </span>
        </div>

        <!-- 2 Nút Mua hàng to (Figma Style) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            @click="handleAddToCart"
            class="py-3.5 px-6 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] active:bg-[#2D3B1E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all min-h-[44px]"
          >
            <ShoppingBag class="w-4 h-4" />
            <span>Thêm vào giỏ hàng</span>
          </button>

          <button
            type="button"
            @click="handleBuyNow"
            class="py-3.5 px-6 rounded-2xl bg-[#232722] hover:bg-black active:bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all min-h-[44px]"
          >
            <Zap class="w-4 h-4 text-amber-400" />
            <span>Mua ngay</span>
          </button>
        </div>

        <!-- 3 Cam kết dịch vụ -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E3E8DC] text-[11px] text-[#576449]">
          <div class="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#F0F3EC]">
            <Zap class="w-4 h-4 text-[#4D6A34] shrink-0" />
            <div>
              <span class="font-bold text-[#2D3B1E] block">Giao 2H Siêu Tốc</span>
              <span>Tại TP.HCM & Hà Nội</span>
            </div>
          </div>
          <div class="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#F0F3EC]">
            <ShieldCheck class="w-4 h-4 text-[#4D6A34] shrink-0" />
            <div>
              <span class="font-bold text-[#2D3B1E] block">Hoàn tiền 200%</span>
              <span>Nếu phát hiện hàng giả</span>
            </div>
          </div>
          <div class="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#F0F3EC]">
            <RefreshCw class="w-4 h-4 text-[#4D6A34] shrink-0" />
            <div>
              <span class="font-bold text-[#2D3B1E] block">Đổi trả 7 ngày</span>
              <span>Miễn phí nếu lỗi NSX</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Section & Nutrition Facts Table -->
    <div class="pt-8 border-t border-[#E3E8DC]">
      <!-- Tab Header Buttons -->
      <div class="flex items-center gap-8 border-b border-[#E3E8DC] mb-8 overflow-x-auto no-scrollbar">
        <button
          type="button"
          @click="activeTab = 'desc'"
          class="pb-3 text-sm font-bold transition-all relative shrink-0"
          :class="activeTab === 'desc' ? 'text-[#2D3B1E] border-b-2 border-[#4D6A34]' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Mô tả sản phẩm & Hướng dẫn
        </button>
        <button
          type="button"
          @click="activeTab = 'traceability'"
          class="pb-3 text-sm font-bold transition-all relative shrink-0"
          :class="activeTab === 'traceability' ? 'text-[#2D3B1E] border-b-2 border-[#4D6A34]' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Nguồn gốc nguyên liệu (Traceability)
        </button>
        <button
          type="button"
          @click="activeTab = 'reviews'"
          class="pb-3 text-sm font-bold transition-all relative shrink-0"
          :class="activeTab === 'reviews' ? 'text-[#2D3B1E] border-b-2 border-[#4D6A34]' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
        >
          Đánh giá khách hàng (128)
        </button>
      </div>

      <!-- Tab Content Grid (Left Details + Right Nutrition Facts Box) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <!-- Cột Trái: Nội dung mô tả / nguồn gốc / đánh giá -->
        <div class="lg:col-span-7 space-y-6">
          <div v-if="activeTab === 'desc'" class="space-y-6 text-sm text-[#4E5C3E] leading-relaxed">
            <div>
              <h3 class="font-heading text-lg font-bold text-[#2D3B1E] mb-2">
                Khởi đầu ngày mới tràn đầy năng lượng thanh sạch
              </h3>
              <p>
                Granola NutriMate Yến Mạch Hạt Dinh Dưỡng Siêu Hạt được chế biến theo công thức độc quyền: nướng chậm ở nhiệt độ thấp giúp giữ trọn vẹn dưỡng chất, hàm lượng vitamin E, omega-3 và vi khoáng từ các loại hạt thượng hạng. Chúng tôi tuyệt đối không sử dụng đường tinh luyện hay dầu cọ, vị ngọt thanh tự nhiên đến từ mật ong hoa nhãn nguyên chất và quả mọng sấy lạnh.
              </p>
            </div>

            <!-- 3 Feature Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] space-y-1">
                <span class="text-xs font-bold text-[#2D3B1E] block">Yến mạch nguyên cám</span>
                <p class="text-xs text-[#7A866E]">Giàu chất xơ Beta-glucan hỗ trợ ổn định đường huyết.</p>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] space-y-1">
                <span class="text-xs font-bold text-[#2D3B1E] block">Tỷ lệ hạt tới 55%</span>
                <p class="text-xs text-[#7A866E]">Hạnh nhân Mỹ, óc chó Chile, hạt điều Bình Phước.</p>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] space-y-1">
                <span class="text-xs font-bold text-[#2D3B1E] block">Giàu chất béo tốt</span>
                <p class="text-xs text-[#7A866E]">Chất béo không bão hòa đơn và đa tốt cho tim mạch.</p>
              </div>
            </div>

            <!-- 3 Cách thưởng thức -->
            <div class="space-y-3">
              <h4 class="font-heading text-sm font-bold text-[#2D3B1E]">
                3 Cách thưởng thức dinh dưỡng mỗi ngày:
              </h4>
              <ul class="space-y-2 text-xs text-[#4E5C3E]">
                <li class="flex items-start gap-2">
                  <span class="w-5 h-5 rounded-full bg-[#EBF1E6] text-[#4D6A34] font-bold flex items-center justify-center shrink-0">1</span>
                  <span><strong>Ăn liền trực tiếp:</strong> Dùng ngay như một món snack bổ dưỡng trong giờ làm việc hoặc trước buổi tập gym 30 phút.</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="w-5 h-5 rounded-full bg-[#EBF1E6] text-[#4D6A34] font-bold flex items-center justify-center shrink-0">2</span>
                  <span><strong>Kết hợp Sữa chua Hy Lạp:</strong> Cho 40g Granola vào 1 hũ sữa chua Hy Lạp không đường, thêm một vài lát dâu tây hoặc chuối cho bữa sáng hoàn hảo 20g protein.</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="w-5 h-5 rounded-full bg-[#EBF1E6] text-[#4D6A34] font-bold flex items-center justify-center shrink-0">3</span>
                  <span><strong>Topping sinh tố & Smoothie Bowl:</strong> Rắc granola lên bề mặt smoothie bơ chuối để tăng cảm giác giòn rụm và kéo dài cảm giác no.</span>
                </li>
              </ul>
            </div>

            <!-- Thành phần -->
            <div class="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC] text-xs space-y-1">
              <span class="font-bold text-[#2D3B1E] block">Thành phần nguyên liệu chi tiết:</span>
              <p>Yến mạch Úc nguyên cám (45%), Hạnh nhân Mỹ (15%), Quả óc chó Chile (10%), Hạt điều Bình Phước (10%), Hạt bí xanh (10%), Nho khô vàng & Việt quất sấy lạnh (8%), Mật ong hoa nhãn nguyên chất, Bột vani tự nhiên Madagascar.</p>
            </div>
          </div>

          <div v-else-if="activeTab === 'traceability'" class="space-y-4 text-xs sm:text-sm text-[#4E5C3E]">
            <h3 class="font-heading text-base font-bold text-[#2D3B1E]">Truy xuất nguồn gốc nguyên liệu sạch 100%</h3>
            <p>Toàn bộ nguyên liệu đều được thu hoạch từ các nông trại đạt tiêu chuẩn Organic USDA và GlobalGAP:</p>
            <div class="space-y-2 text-xs">
              <p>• <strong>Yến mạch:</strong> Nhập khẩu chính ngạch từ Victoria, Úc.</p>
              <p>• <strong>Hạt điều:</strong> Thu hoạch organic tại thủ phủ điều Bù Đăng, Bình Phước.</p>
              <p>• <strong>Hạt óc chó & Hạnh nhân:</strong> Nhập khẩu từ vùng nông trại California, Mỹ.</p>
              <p>• <strong>Mật ong:</strong> Mật ong hoa nhãn nguyên chất Sông Mã, Sơn La.</p>
            </div>
          </div>

          <div v-else class="space-y-4 text-xs sm:text-sm text-[#4E5C3E]">
            <h3 class="font-heading text-base font-bold text-[#2D3B1E]">Đánh giá từ khách hàng đã mua (128)</h3>
            <div class="space-y-3">
              <div class="p-4 rounded-2xl bg-white border border-[#E3E8DC] space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[#2D3B1E]">Trần Tường Vy</span>
                  <div class="flex text-[#E8A020]">
                    <Star v-for="i in 5" :key="i" class="w-3.5 h-3.5 fill-[#E8A020]" />
                  </div>
                </div>
                <p class="text-xs">"Hạt rất giòn và thơm, vị ngọt thanh vừa phải, ăn với sữa chua Hy Lạp buổi sáng cực kỳ tiện lợi và no lâu!"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cột Phải: Bảng THÔNG TIN DINH DƯỠNG Chuẩn Khoa Học (Figma Style) -->
        <div class="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-sm space-y-4">
          <div class="border-b-4 border-[#2D3B1E] pb-2">
            <h3 class="font-heading text-lg font-black text-[#2D3B1E] uppercase tracking-wider">
              Thông Tin Dinh Dưỡng
            </h3>
            <p class="text-[11px] text-[#7A866E]">Chuẩn kiểm định Viện Dinh Dưỡng</p>
          </div>

          <div class="flex justify-between text-xs py-1 border-b border-[#ECEFE7]">
            <span class="font-bold text-[#2D3B1E]">Khẩu phần khuyến nghị (Serving size)</span>
            <span class="font-bold text-[#2D3B1E]">40g</span>
          </div>

          <div class="flex justify-between text-xs py-1 border-b-4 border-[#2D3B1E]">
            <span class="text-[#7A866E]">Khẩu phần mỗi hũ (~500g)</span>
            <span class="text-[#7A866E]">~12.5 lần dùng</span>
          </div>

          <!-- Calo lớn -->
          <div class="flex items-baseline justify-between py-2 border-b-2 border-[#2D3B1E]">
            <div>
              <span class="text-xs font-bold text-[#2D3B1E] block uppercase">Năng Lượng / Calo</span>
              <span class="text-[10px] text-[#7A866E]">Mỗi khẩu phần 40g</span>
            </div>
            <span class="font-heading text-3xl font-black text-[#2D3B1E]">152 <span class="text-sm font-normal">kcal</span></span>
          </div>

          <div class="text-[10px] text-right text-[#7A866E] font-bold">
            % GIÁ TRỊ HÀNG NGÀY (DV)*
          </div>

          <!-- Bảng thông số -->
          <div class="space-y-1.5 text-xs text-[#2D3B1E]">
            <div class="flex justify-between py-1 border-b border-[#F0F3EC]">
              <span><strong>Tổng chất béo (Total Fat)</strong> 6g</span>
              <span class="font-bold">8%</span>
            </div>
            <div class="flex justify-between pl-4 text-[#7A866E] text-[11px]">
              <span>Chất béo bão hòa 0.8g</span>
              <span>4%</span>
            </div>
            <div class="flex justify-between pl-4 text-[#7A866E] text-[11px]">
              <span>Chất béo chuyển hóa (Trans fat) 0g</span>
              <span>0%</span>
            </div>
            <div class="flex justify-between py-1 border-b border-[#F0F3EC]">
              <span><strong>Cholesterol</strong> 0mg</span>
              <span class="font-bold">0%</span>
            </div>
            <div class="flex justify-between py-1 border-b border-[#F0F3EC]">
              <span><strong>Natri (Sodium)</strong> 25mg</span>
              <span class="font-bold">1%</span>
            </div>
            <div class="flex justify-between py-1 border-b border-[#F0F3EC]">
              <span><strong>Tổng Carbohydrate</strong> 18g</span>
              <span class="font-bold">7%</span>
            </div>
            <div class="flex justify-between pl-4 text-[#7A866E] text-[11px]">
              <span>Chất xơ tiêu hóa (Fiber) 3.2g</span>
              <span>11%</span>
            </div>
            <div class="flex justify-between pl-4 text-[#7A866E] text-[11px]">
              <span>Đường tổng (Total Sugars) 1.2g</span>
              <span>-</span>
            </div>
            <div class="flex justify-between py-1 border-b-2 border-[#2D3B1E]">
              <span><strong>Chất đạm (Protein)</strong> 5.6g</span>
              <span class="font-bold">11%</span>
            </div>
          </div>

          <!-- Micronutrients -->
          <div class="grid grid-cols-2 gap-2 text-[11px] text-[#7A866E] pt-2">
            <div>Vitamin E: <strong>15%</strong></div>
            <div>Sắt (Iron): <strong>8%</strong></div>
            <div>Kẽm (Zinc): <strong>10%</strong></div>
            <div>Magiê (Magnesium): <strong>12%</strong></div>
          </div>

          <p class="text-[9px] text-[#8C9484] pt-2 border-t border-[#ECEFE7] leading-tight">
            * Phần trăm Giá trị Hàng ngày (% Daily Value - DV) dựa trên chế độ ăn 2.000 calo tiêu chuẩn mỗi ngày của người trưởng thành.
          </p>
        </div>
      </div>
    </div>

    <!-- Section "Thường được mua cùng" (Frequently bought together) -->
    <div class="pt-10 border-t border-[#E3E8DC]">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h3 class="font-heading text-xl font-extrabold text-[#2D3B1E]">Thường được mua cùng</h3>
          <p class="text-xs text-[#7A866E]">Kết hợp hoàn hảo cho thực đơn dinh dưỡng và bữa ăn lành mạnh</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <!-- Combo 1 -->
        <div class="p-5 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all space-y-3">
          <img
            src="https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80"
            alt="Sữa chua Hy Lạp"
            class="w-full h-40 object-cover rounded-2xl"
          />
          <div>
            <span class="text-[10px] text-[#7A866E]">Sản phẩm từ sữa lên men</span>
            <h4 class="font-heading text-sm font-bold text-[#2D3B1E]">Sữa Chua Hy Lạp Nguyên Bản 450g</h4>
            <span class="text-xs font-bold text-[#4D6A34] block mt-1">82.000đ</span>
          </div>
          <button
            type="button"
            @click="addComboItem('Sữa Chua Hy Lạp Nguyên Bản 450g', 82000, 110, 10)"
            class="w-full py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EBF1E6] text-[#4D6A34] text-xs font-bold border border-[#CCD7BC] transition-colors"
          >
            + Thêm vào combo (+82k)
          </button>
        </div>

        <!-- Combo 2 -->
        <div class="p-5 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all space-y-3">
          <img
            src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80"
            alt="Bơ đậu phộng"
            class="w-full h-40 object-cover rounded-2xl"
          />
          <div>
            <span class="text-[10px] text-[#7A866E]">Bơ hạt thuần khiết</span>
            <h4 class="font-heading text-sm font-bold text-[#2D3B1E]">Bơ Đậu Phộng Mịn Thuần Chay 350g</h4>
            <span class="text-xs font-bold text-[#4D6A34] block mt-1">90.000đ</span>
          </div>
          <button
            type="button"
            @click="addComboItem('Bơ Đậu Phộng Mịn Thuần Chay 350g', 90000, 190, 8)"
            class="w-full py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EBF1E6] text-[#4D6A34] text-xs font-bold border border-[#CCD7BC] transition-colors"
          >
            + Thêm vào combo (+90k)
          </button>
        </div>

        <!-- Combo 3 -->
        <div class="p-5 rounded-3xl bg-white border border-[#E3E8DC] hover:border-[#4D6A34] transition-all space-y-3">
          <img
            src="https://images.unsplash.com/photo-1622484216858-a5b4819779df?auto=format&fit=crop&w=400&q=80"
            alt="NutriBar"
            class="w-full h-40 object-cover rounded-2xl"
          />
          <div>
            <span class="text-[10px] text-[#7A866E]">Thanh năng lượng sạch</span>
            <h4 class="font-heading text-sm font-bold text-[#2D3B1E]">NutriBar Hạt & Socola Đen 60g</h4>
            <span class="text-xs font-bold text-[#4D6A34] block mt-1">45.000đ</span>
          </div>
          <button
            type="button"
            @click="addComboItem('NutriBar Hạt & Socola Đen 60g', 45000, 210, 20)"
            class="w-full py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-[#EBF1E6] text-[#4D6A34] text-xs font-bold border border-[#CCD7BC] transition-colors"
          >
            + Thêm vào combo (+45k)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
