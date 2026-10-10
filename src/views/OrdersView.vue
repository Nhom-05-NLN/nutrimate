<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '../stores/chatStore';
import { useToastStore } from '../stores/toastStore';
import {
  ChevronRight,
  Search,
  Truck,
  Phone,
  CheckCircle2,
  Clock,
  RotateCcw,
  Bot,
  FileText,
  Star,
  MapPin,
  MessageSquare,
} from 'lucide-vue-next';

const router = useRouter();
const chatStore = useChatStore();
const toastStore = useToastStore();

const activeTab = ref<'all' | 'pending' | 'shipping' | 'delivered' | 'cancelled'>('all');
const searchQuery = ref('');

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleReorder(orderCode: string) {
  toastStore.show('Đã thêm các món vào giỏ hàng!', 'success', `Sao chép từ đơn ${orderCode}`, 'Xem giỏ hàng', '/cart');
  router.push('/cart');
}
</script>

<template>
  <div class="py-6 space-y-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-medium text-[#7E8B73]">
      <RouterLink to="/" class="hover:text-[#2D3B1E]">Trang chủ</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <RouterLink to="/profile" class="hover:text-[#2D3B1E]">Tài khoản cá nhân</RouterLink>
      <ChevronRight class="w-3.5 h-3.5" />
      <span class="text-[#2D3B1E] font-bold">Đơn hàng của tôi</span>
    </nav>

    <!-- Header & Search -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
            Đơn hàng của tôi
          </h1>
          <span class="px-2.5 py-0.5 rounded-full bg-[#EBF1E6] text-xs font-bold text-[#4D6A34]">
            5 đơn hàng
          </span>
        </div>
        <p class="text-xs text-[#7A866E] mt-1">
          Theo dõi hành trình vận chuyển thực phẩm sạch và quản lý lịch sử đơn hàng dinh dưỡng của bạn.
        </p>
      </div>

      <div class="relative w-full sm:w-72">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A866E]" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Tìm kiếm theo mã đơn, tên món..."
          class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E3E8DC] text-xs text-[#2D3B1E] placeholder-[#8C9882] focus:border-[#4D6A34] outline-none shadow-2xs"
        />
      </div>
    </div>

    <!-- Status Filter Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        type="button"
        @click="activeTab = 'all'"
        class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0"
        :class="activeTab === 'all' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        Tất cả (5)
      </button>
      <button
        type="button"
        @click="activeTab = 'pending'"
        class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0"
        :class="activeTab === 'pending' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        Chờ xác nhận (1)
      </button>
      <button
        type="button"
        @click="activeTab = 'shipping'"
        class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
        :class="activeTab === 'shipping' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>Đang giao (1)</span>
      </button>
      <button
        type="button"
        @click="activeTab = 'delivered'"
        class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0"
        :class="activeTab === 'delivered' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        Đã giao (3)
      </button>
      <button
        type="button"
        @click="activeTab = 'cancelled'"
        class="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0"
        :class="activeTab === 'cancelled' ? 'bg-[#4D6A34] text-white shadow-xs' : 'bg-white text-[#576449] border border-[#E3E8DC] hover:bg-[#FAF9F5]'"
      >
        Đã hủy (0)
      </button>
    </div>

    <!-- 2 Columns Layout: Orders List & Tracking Widget -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Cột Trái: Danh sách đơn hàng -->
      <div class="lg:col-span-8 space-y-6">
        <!-- ĐƠN 1: ĐANG GIAO HÀNG (NM-98234) -->
        <div class="bg-white rounded-3xl border-2 border-[#4D6A34] p-6 shadow-sm space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F3EC] pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
                <Truck class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-heading text-sm font-black text-[#2D3B1E]">#NM-98234</h3>
                  <span class="px-2 py-0.5 rounded-full bg-[#FAF9F5] text-[10px] font-bold text-[#7A866E] border border-[#CCD7BC]">
                    Đơn trực tuyến
                  </span>
                </div>
                <span class="text-[11px] text-[#7A866E]">Đặt ngày 24/10/2024 lúc 10:15</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1E6] text-xs font-bold text-[#3B4E24]">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Đang giao hàng (Dự kiến đến hôm nay 16:30)</span>
            </div>
          </div>

          <!-- 3 Sản phẩm trong đơn -->
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-4 text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-14 h-14 rounded-2xl object-cover border border-[#E8ECE2]"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Granola Yến Mạch Hạt Dinh Dưỡng Siêu Hạt 500g</h4>
                  <div class="flex items-center gap-2 text-[11px] text-[#7A866E] mt-0.5">
                    <span>Số lượng: x1</span>
                    <span>•</span>
                    <span class="text-[#4D6A34] font-semibold">152 kcal</span>
                    <span>•</span>
                    <span>14g Đạm</span>
                  </div>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">185.000đ</span>
            </div>

            <div class="flex items-center justify-between gap-4 text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-14 h-14 rounded-2xl object-cover border border-[#E8ECE2]"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Ức Gà Sấy Giòn Vị Thảo Mộc Tự Nhiên 200g</h4>
                  <div class="flex items-center gap-2 text-[11px] text-[#7A866E] mt-0.5">
                    <span>Số lượng: x2</span>
                    <span>•</span>
                    <span class="text-[#4D6A34] font-semibold">145 kcal</span>
                    <span>•</span>
                    <span>32g Đạm</span>
                  </div>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">220.000đ</span>
            </div>

            <div class="flex items-center justify-between gap-4 text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-14 h-14 rounded-2xl object-cover border border-[#E8ECE2]"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Bơ Đậu Phộng Mịn Thuần Chay 350g</h4>
                  <div class="flex items-center gap-2 text-[11px] text-[#7A866E] mt-0.5">
                    <span>Số lượng: x1</span>
                    <span>•</span>
                    <span class="text-[#3B4E24] font-semibold">Keto & Vegan</span>
                  </div>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">90.000đ</span>
            </div>
          </div>

          <!-- Total & Actions -->
          <div class="pt-4 border-t border-[#F0F3EC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs text-[#7A866E]">Tổng tiền (3 món): </span>
              <span class="font-heading text-lg font-black text-[#2D3B1E]">495.000đ</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="chatStore.openChat()"
                class="px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] flex items-center gap-1.5 hover:bg-[#EBF1E6] transition-colors"
              >
                <Bot class="w-3.5 h-3.5" />
                <span>Hỏi NutriBot</span>
              </button>

              <button
                type="button"
                class="px-3.5 py-2 rounded-xl bg-white border border-[#E3E8DC] text-xs font-bold text-[#576449] hover:bg-[#FAF9F5] transition-colors"
              >
                Xem chi tiết
              </button>

              <button
                type="button"
                class="px-4 py-2 rounded-xl bg-[#4D6A34] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Truck class="w-3.5 h-3.5" />
                <span>Theo dõi đơn hàng</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ĐƠN 2: ĐÃ HOÀN TẤT (NM-97412) -->
        <div class="bg-white rounded-3xl border border-[#E3E8DC] p-6 shadow-2xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F3EC] pb-3">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">#NM-97412</h3>
                <span class="px-2 py-0.5 rounded-full bg-[#F0F3EC] text-[10px] text-[#7A866E]">Đã hoàn tất</span>
              </div>
              <span class="text-[11px] text-[#7A866E]">Đặt ngày 15/10/2024 lúc 09:20 • Đã nhận hàng 15/10/2024</span>
            </div>
            <span class="px-3 py-1 rounded-full bg-[#EBF1E6] text-[11px] font-bold text-[#4D6A34] self-start sm:self-auto">
              ✓ Đã giao thành công
            </span>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Bánh Mì Đen Lúa Mạch Nguyên Cám (Ổ 450g)</h4>
                  <span class="text-[11px] text-[#7A866E]">Số lượng: x1 • Carb chậm, giàu chất xơ hòa tan</span>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">85.000đ</span>
            </div>

            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Hạt Điều Rang Củi Không Muối Hữu Cơ 300g</h4>
                  <span class="text-[11px] text-[#7A866E]">Số lượng: x1 • Chất béo tốt Omega-3 & Magie</span>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">135.000đ</span>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs text-[#7A866E]">Tổng thanh toán: </span>
              <span class="font-heading text-base font-extrabold text-[#2D3B1E]">220.000đ</span>
            </div>

            <div class="flex items-center gap-2">
              <button class="px-3 py-1.5 rounded-xl border border-[#CCD7BC] text-xs font-semibold text-[#576449] hover:bg-[#FAF9F5]">
                Hóa đơn VAT & Macro
              </button>
              <button class="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#E8A020] hover:bg-[#F6F8F3]">
                ★ Đánh giá sản phẩm (+20 NutriPoints)
              </button>
              <button
                type="button"
                @click="handleReorder('#NM-97412')"
                class="px-3.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] hover:bg-[#EBF1E6] flex items-center gap-1"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>Mua lại đơn này</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ĐƠN 3: ĐÃ HOÀN TẤT (NM-95108) -->
        <div class="bg-white rounded-3xl border border-[#E3E8DC] p-6 shadow-2xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F3EC] pb-3">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">#NM-95108</h3>
                <span class="px-2 py-0.5 rounded-full bg-[#F0F3EC] text-[10px] text-[#7A866E]">Đã hoàn tất</span>
              </div>
              <span class="text-[11px] text-[#7A866E]">Đặt ngày 28/09/2024 lúc 15:40</span>
            </div>
            <span class="px-3 py-1 rounded-full bg-[#EBF1E6] text-[11px] font-bold text-[#4D6A34]">
              ✓ Đã giao thành công
            </span>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1622484216858-a5b4819779df?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Thanh Protein Bar Hạnh Nhân Socola Đen (Hộp 6 thanh)</h4>
                  <span class="text-[11px] text-[#7A866E]">Số lượng: x1 hộp • 20g Whey Isolate / thanh</span>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">245.000đ</span>
            </div>

            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=100&q=80"
                  alt="item"
                  class="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 class="font-bold text-[#2D3B1E]">Mì Konjac Shirataki Ăn Kiêng Không Tinh Bột 200g</h4>
                  <span class="text-[11px] text-[#7A866E]">Số lượng: x2 gói • 9 kcal / 100g</span>
                </div>
              </div>
              <span class="font-bold text-[#2D3B1E]">100.000đ</span>
            </div>
          </div>

          <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between">
            <div>
              <span class="text-xs text-[#7A866E]">Tổng thanh toán: </span>
              <span class="font-heading text-base font-extrabold text-[#2D3B1E]">345.000đ</span>
            </div>

            <div class="flex items-center gap-2">
              <button class="px-3.5 py-1.5 rounded-xl border border-[#CCD7BC] text-xs font-semibold text-[#576449] hover:bg-[#FAF9F5]">
                Xem đánh giá
              </button>
              <button
                type="button"
                @click="handleReorder('#NM-95108')"
                class="px-3.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#CCD7BC] text-xs font-bold text-[#4D6A34] hover:bg-[#EBF1E6] flex items-center gap-1"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>Mua lại đơn này</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cột Phải: Widget Theo Dõi Vận Chuyển Trực Tiếp #NM-98234 (Figma 06) -->
      <aside class="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#CCD7BC] shadow-sm space-y-6">
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-[#4D6A34] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Theo dõi vận chuyển trực tiếp
            </span>
            <span class="text-xs font-mono font-bold text-[#2D3B1E]">#NM-98234</span>
          </div>
          <p class="text-[11px] text-[#7A866E]">
            Đơn vị vận chuyển: <strong>Giao Siêu Tốc Giữ Mát 2H</strong>
          </p>
        </div>

        <!-- Thông tin tài xế -->
        <div class="p-3.5 rounded-2xl bg-[#F6F8F3] border border-[#E3E8DC] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#EBF1E6] text-[#4D6A34] font-bold text-xs flex items-center justify-center">
              TH
            </div>
            <div>
              <h4 class="font-heading text-xs font-bold text-[#2D3B1E]">Trần Văn Hùng</h4>
              <p class="text-[10px] text-[#7A866E]">Xe 59F1-882.34 • Thùng giữ mát 4°C</p>
            </div>
          </div>

          <a
            href="tel:0909123456"
            class="w-9 h-9 rounded-full bg-[#4D6A34] text-white flex items-center justify-center hover:bg-[#3B4E24] shadow-xs"
            title="Gọi tài xế"
          >
            <Phone class="w-4 h-4" />
          </a>
        </div>

        <!-- 4 Mốc Timeline Vận Chuyển (Figma 06 Style) -->
        <div class="space-y-4 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#CCD7BC]">
          <!-- Mốc 1 -->
          <div class="relative">
            <span class="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#4D6A34] text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </span>
            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-[#2D3B1E]">Order Confirmed</span>
                <span class="text-[10px] text-[#7A866E]">9:30 AM - Mar 15</span>
              </div>
              <p class="text-[11px] text-[#7A866E]">Đơn hàng được xác nhận và kiểm tra thông tin tự động.</p>
            </div>
          </div>

          <!-- Mốc 2 -->
          <div class="relative">
            <span class="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#4D6A34] text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </span>
            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-[#2D3B1E]">Prep & Freshness Check</span>
                <span class="text-[10px] text-[#7A866E]">10:05 AM - Mar 15</span>
              </div>
              <p class="text-[11px] text-[#7A866E]">Đóng thùng cách nhiệt sinh thái, kiểm tra nhiệt độ 4°C.</p>
            </div>
          </div>

          <!-- Mốc 3 (Hiện tại) -->
          <div class="relative">
            <span class="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#4D6A34] text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-[#EBF1E6]">
              🛵
            </span>
            <div class="p-3 bg-[#F6F8F3] rounded-2xl border border-[#CCD7BC]">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-[#3B4E24]">Out for Delivery</span>
                <span class="text-[10px] text-[#7A866E]">10:45 AM - Mar 15</span>
              </div>
              <p class="text-[11px] text-[#4E5C3E] mt-0.5">Tài xế đang di chuyển trên đường đến điểm giao.</p>
            </div>
          </div>

          <!-- Mốc 4 (Dự kiến) -->
          <div class="relative opacity-60">
            <span class="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#EBF1E6] text-[#7A866E] flex items-center justify-center text-[10px] font-bold">
              4
            </span>
            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-[#7A866E]">Delivery Complete</span>
                <span class="text-[10px] text-[#7A866E]">Est. 11:15 AM</span>
              </div>
              <p class="text-[11px] text-[#8C9484]">Giao tận tay và đồng kiểm tra chất lượng thực phẩm.</p>
            </div>
          </div>
        </div>

        <!-- Delivery Address -->
        <div class="pt-4 border-t border-[#F0F3EC] space-y-1 text-xs">
          <span class="font-bold text-[#2D3B1E] flex items-center gap-1.5">
            <MapPin class="w-3.5 h-3.5 text-[#4D6A34]" />
            Địa chỉ nhận hàng:
          </span>
          <p class="text-[#576449] pl-5">Số 45 Đường D2, P. 25, Q. Bình Thạnh, TP.HCM</p>
          <p class="text-[11px] text-[#7A866E] pl-5">Người nhận: Nguyễn Minh Anh (0912.345.678)</p>
        </div>

        <!-- Hotline & Chat Support -->
        <div class="pt-4 border-t border-[#F0F3EC] flex items-center justify-between text-xs text-[#576449]">
          <a href="tel:18008899" class="flex items-center gap-1 font-bold text-[#4D6A34] hover:underline">
            <Phone class="w-3.5 h-3.5" />
            1800-GREENS
          </a>
          <button
            type="button"
            @click="chatStore.openChat()"
            class="flex items-center gap-1 font-bold text-[#4D6A34] hover:underline"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            Live Chat
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
