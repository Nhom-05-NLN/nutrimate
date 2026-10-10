<script setup lang="ts">
import { ref } from 'vue';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Bot,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Package,
  Plus,
} from 'lucide-vue-next';

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const urgentOrders = ref([
  {
    code: '#NM-98240',
    customer: 'Nguyễn Minh Anh',
    phone: '0912.***.892',
    mainProduct: 'Ức gà sấy giòn vị thảo mộc x3',
    total: 420000,
    payment: 'VietQR',
    status: 'Chờ xác nhận',
  },
  {
    code: '#NM-98239',
    customer: 'Trần Đức Hải',
    phone: '0988.***.114',
    mainProduct: 'Combo Giảm Cân 7 Ngày NutriBot',
    total: 890000,
    payment: 'VietQR',
    status: 'Đóng gói giữ mát',
  },
  {
    code: '#NM-98238',
    customer: 'Phạm Thu Trang',
    phone: '0903.***.455',
    mainProduct: 'Granola Yến Mạch Mật Ong 1000g',
    total: 310000,
    payment: 'COD',
    status: 'Chờ xác nhận',
  },
  {
    code: '#NM-98237',
    customer: 'Võ Quốc Tuấn',
    phone: '0934.***.726',
    mainProduct: 'Mì Nưa Konjac Low-Carb x10',
    total: 250000,
    payment: 'VietQR',
    status: 'Đang đóng gói',
  },
  {
    code: '#NM-98236',
    customer: 'Lê Thị Cẩm Nhung',
    phone: '0971.***.908',
    mainProduct: 'Bột Whey Isolate Tự Nhiên 900g',
    total: 1150000,
    payment: 'VietQR',
    status: 'Chờ xác nhận',
  },
]);
</script>

<template>
  <div class="space-y-8">
    <!-- Top 4 KPIs Cards (Figma 10) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- 1. Doanh thu -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Doanh thu tháng này</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <DollarSign class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          184.500.000đ
        </div>
        <div class="flex items-center gap-1.5 text-xs text-[#4D6A34] font-bold">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>+18.4%</span>
          <span class="text-[#7A866E] font-normal">so với tháng trước</span>
        </div>
      </div>

      <!-- 2. Tổng đơn hàng -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Tổng đơn hàng</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <ShoppingCart class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          1.248 <span class="text-xs font-normal text-[#7A866E]">đơn</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>94% hoàn thành đúng hạn</span>
          <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">14 chờ duyệt</span>
        </div>
      </div>

      <!-- 3. Khách hàng hoạt động -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Khách hàng hoạt động</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          3.820 <span class="text-xs font-normal text-[#7A866E]">khách</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="text-[#4D6A34] font-bold">+340 mới</span>
          <span>68% theo dõi dinh dưỡng BMI</span>
        </div>
      </div>

      <!-- 4. Tương tác NutriBot AI -->
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span class="font-bold">Tương tác NutriBot AI</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">
          14.590 <span class="text-xs font-normal text-[#7A866E]">lượt</span>
        </div>
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Chuyển đổi mua hàng từ gợi ý:</span>
          <span class="font-bold text-[#4D6A34]">31.8%</span>
        </div>
      </div>
    </div>

    <!-- Middle Grid: Chart Doanh Thu & Biểu Đồ Phân Bổ Danh Mục (Figma 10) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- Cột Trái: Biến động doanh thu tuần qua -->
      <div class="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F3EC] pb-4">
          <div>
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">
              Biến động doanh thu & Số lượng đơn hàng (Tuần qua)
            </h3>
            <p class="text-xs text-[#7A866E]">Theo dõi hiệu suất thực phẩm sạch và thực đơn khuyến nghị</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-[#7A866E]">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-[#4D6A34]"></span> Thực phẩm tự chọn</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-[#A3B88C]"></span> Combo qua AI gợi ý</span>
          </div>
        </div>

        <!-- Bar chart mockup -->
        <div class="h-56 flex items-end justify-between gap-3 pt-6 px-4">
          <div v-for="day in [
            { label: 'Thứ 2', val: 60, valAi: 20 },
            { label: 'Thứ 3', val: 70, valAi: 25 },
            { label: 'Thứ 4', val: 65, valAi: 20 },
            { label: 'Thứ 5', val: 80, valAi: 30 },
            { label: 'Thứ 6', val: 95, valAi: 40, isPeak: true },
            { label: 'Thứ 7', val: 75, valAi: 30 },
            { label: 'Chủ nhật', val: 85, valAi: 35 },
          ]" :key="day.label" class="flex-1 flex flex-col items-center gap-2">
            <span v-if="day.isPeak" class="px-2 py-0.5 rounded-md bg-[#2D3B1E] text-white text-[9px] font-bold">
              Đỉnh: 32.4 tr
            </span>
            <div class="w-full max-w-[40px] h-40 bg-[#F0F4EA] rounded-xl overflow-hidden flex flex-col justify-end p-0.5 gap-0.5">
              <div class="w-full bg-[#A3B88C] rounded-sm" :style="{ height: `${day.valAi}%` }"></div>
              <div class="w-full bg-[#4D6A34] rounded-sm" :style="{ height: `${day.val}%` }"></div>
            </div>
            <span class="text-[11px] font-semibold" :class="day.isPeak ? 'text-[#4D6A34] font-bold' : 'text-[#7A866E]'">
              {{ day.label }}
            </span>
          </div>
        </div>

        <div class="pt-3 border-t border-[#F0F3EC] flex items-center justify-between text-xs text-[#7A866E]">
          <span class="flex items-center gap-1.5 text-[#2D3B1E]">
            <CheckCircle2 class="w-4 h-4 text-[#4D6A34]" />
            Doanh số đỉnh Thứ 6: <strong>32.400.000 VNĐ</strong> (tăng 22% so với trung bình ngày thường).
          </span>
          <a href="#" class="text-[#4D6A34] font-bold hover:underline">Xem chi tiết lịch sử tuần &gt;</a>
        </div>
      </div>

      <!-- Cột Phải: Tỷ lệ phân bổ danh mục -->
      <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">Tỷ lệ phân bổ danh mục</h3>
            <span class="text-[10px] font-bold text-[#7A866E] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E3E8DC]">Tháng 10</span>
          </div>
          <p class="text-xs text-[#7A866E] mt-2">Thị phần tiêu thụ theo từng chế độ ăn kiêng lành mạnh</p>

          <!-- Distribution Stack Bar -->
          <div class="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex mt-4">
            <div class="w-[38%] bg-[#4D6A34]" title="High-Protein 38%"></div>
            <div class="w-[28%] bg-[#7F9C5B]" title="Bánh kiêng & Granola 28%"></div>
            <div class="w-[20%] bg-[#A8C28E]" title="Low-Carb Konjac 20%"></div>
            <div class="w-[14%] bg-[#D4E2C4]" title="Khác 14%"></div>
          </div>

          <div class="space-y-3 pt-5 text-xs">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#4D6A34]"></span> High-Protein & Ức gà</span>
              <div class="space-x-1.5"><span class="font-bold text-[#2D3B1E]">38%</span> <span class="text-[10px] text-[#4D6A34] font-bold">+24%</span></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#7F9C5B]"></span> Bánh ăn kiêng & Granola</span>
              <div class="space-x-1.5"><span class="font-bold text-[#2D3B1E]">28%</span> <span class="text-[10px] text-[#4D6A34] font-bold">+12%</span></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#A8C28E]"></span> Low-Carb Konjac</span>
              <div class="space-x-1.5"><span class="font-bold text-[#2D3B1E]">20%</span> <span class="text-[10px] text-[#4D6A34] font-bold">+8%</span></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#D4E2C4]"></span> Khác & Hạt dinh dưỡng</span>
              <div class="space-x-1.5"><span class="font-bold text-[#2D3B1E]">14%</span> <span class="text-[10px] text-[#4D6A34] font-bold">+5%</span></div>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] text-[11px] text-[#3B4E24] leading-relaxed">
          💡 <strong>Nhóm High-Protein</strong> tăng trưởng mạnh nhất (+24%), đặc biệt các đơn tư vấn từ NutriBot cho đối tượng tập gym & giảm mỡ.
        </div>
      </div>
    </div>

    <!-- Bottom Grid: Đơn hàng mới cần xử lý gấp & Cảnh báo tồn kho (Figma 10) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Cột Trái: Bảng Đơn hàng mới cần xử lý gấp -->
      <div class="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">Đơn hàng mới cần xử lý gấp</h3>
              <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">5 đơn chờ</span>
            </div>
            <p class="text-xs text-[#7A866E] mt-0.5">Yêu cầu bảo quản nhiệt độ mát & xác nhận nhanh trong 15 phút</p>
          </div>
          <RouterLink to="/admin/orders" class="text-xs font-bold text-[#4D6A34] hover:underline">
            Xem tất cả đơn &gt;
          </RouterLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
              <tr>
                <th class="py-3 px-3">Mã đơn</th>
                <th class="py-3 px-3">Khách hàng</th>
                <th class="py-3 px-3">Sản phẩm chính</th>
                <th class="py-3 px-3">Tổng tiền</th>
                <th class="py-3 px-3">Thanh toán</th>
                <th class="py-3 px-3">Trạng thái</th>
                <th class="py-3 px-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F0F3EC]">
              <tr v-for="order in urgentOrders" :key="order.code" class="hover:bg-[#FAF9F5]">
                <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">{{ order.code }}</td>
                <td class="py-3.5 px-3">
                  <div class="font-bold text-[#2D3B1E]">{{ order.customer }}</div>
                  <span class="text-[10px] text-[#7A866E]">{{ order.phone }}</span>
                </td>
                <td class="py-3.5 px-3 max-w-[160px] truncate">{{ order.mainProduct }}</td>
                <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">{{ formatVnd(order.total) }}</td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold" :class="order.payment === 'VietQR' ? 'bg-[#EBF1E6] text-[#4D6A34]' : 'bg-slate-100 text-slate-700'">
                    {{ order.payment }}
                  </span>
                </td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="order.status.includes('Chờ') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'">
                    {{ order.status }}
                  </span>
                </td>
                <td class="py-3.5 px-3 text-right">
                  <button class="px-2.5 py-1 rounded-xl bg-[#4D6A34] text-white text-[10px] font-bold hover:bg-[#3B4E24]">
                    Duyệt nhanh
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cột Phải: Cảnh báo tồn kho & Hạn bảo quản -->
      <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-4">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-amber-600" />
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">Cảnh báo tồn kho</h3>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">2 mục</span>
        </div>
        <p class="text-xs text-[#7A866E]">Kiểm soát định lượng thực phẩm sạch & hạn bảo quản</p>

        <!-- Warning Item 1 -->
        <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC] space-y-2">
          <div class="flex justify-between items-start text-xs">
            <div>
              <h4 class="font-bold text-[#2D3B1E]">Hạt Granola Yến Mạch túi 1000g</h4>
              <span class="text-[10px] text-[#7A866E]">SKU: GRA-OAT-1000</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">Còn 15 gói</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-rose-500 rounded-full" style="width: 25%"></div>
          </div>
          <span class="text-[10px] text-[#7A866E] block">Mức an toàn tối thiểu: 50 gói • <strong class="text-rose-600">Sắp hết hàng</strong></span>
        </div>

        <!-- Warning Item 2 -->
        <div class="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E3E8DC] space-y-2">
          <div class="flex justify-between items-start text-xs">
            <div>
              <h4 class="font-bold text-[#2D3B1E]">Ức gà sấy giòn vị thảo mộc</h4>
              <span class="text-[10px] text-[#7A866E]">SKU: CHK-HERB-200</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">Còn 28 hộp</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-amber-500 rounded-full" style="width: 35%"></div>
          </div>
          <span class="text-[10px] text-[#7A866E] block">Mức an toàn: 80 hộp • <strong class="text-amber-700">Cần chuẩn bị lô sấy mới</strong></span>
        </div>

        <button
          type="button"
          class="w-full py-3 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Plus class="w-4 h-4" />
          <span>Nhập thêm hàng vào kho</span>
        </button>
      </div>
    </div>
  </div>
</template>
