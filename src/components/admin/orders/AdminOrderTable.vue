<script setup lang="ts">
import { ref } from 'vue';
import { Order, OrderStatus } from '../../../types';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronDown,
  AlertCircle,
} from 'lucide-vue-next';

const props = defineProps<{
  orders: Order[];
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'updateStatus', payload: { orderId: string; status: OrderStatus }): void;
  (e: 'viewDetail', order: Order): void;
}>();

const activeDropdownId = ref<string | null>(null);

function toggleDropdown(id: string) {
  if (activeDropdownId.value === id) {
    activeDropdownId.value = null;
  } else {
    activeDropdownId.value = id;
  }
}

function handleSelectStatus(orderId: string, status: OrderStatus) {
  emit('updateStatus', { orderId, status });
  activeDropdownId.value = null;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function isOrderPaid(order: Order): boolean {
  if (order.status === 'delivered') return true;
  return order.paymentStatus === 'paid';
}

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'delivered':
      return { text: 'Giao thành công', class: 'bg-[#EBF7E5] text-[#4D6A34] border-[#CCD7BC]', icon: CheckCircle2 };
    case 'shipping':
      return { text: 'Đang vận chuyển 2H', class: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Truck };
    case 'packing':
      return { text: 'Đang đóng gói', class: 'bg-sky-50 text-sky-800 border-sky-200', icon: Package };
    case 'confirmed':
      return { text: 'Đã duyệt đơn', class: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: CheckCircle2 };
    case 'cancelled':
      return { text: 'Đã hủy', class: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle };
    default:
      return { text: 'Chờ xác nhận', class: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock };
  }
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1060px] text-left text-xs">
      <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
        <tr>
          <th class="py-3.5 px-4 min-w-[150px] whitespace-nowrap">Mã đơn & Thời gian</th>
          <th class="py-3.5 px-4 min-w-[200px]">Khách hàng & SĐT</th>
          <th class="py-3.5 px-4 min-w-[240px]">Món ăn & Macros</th>
          <th class="py-3.5 px-4 min-w-[170px] whitespace-nowrap">Tổng tiền & Thanh toán</th>
          <th class="py-3.5 px-4 min-w-[150px] whitespace-nowrap">Vận chuyển</th>
          <th class="py-3.5 px-4 min-w-[160px] whitespace-nowrap">Trạng thái</th>
          <th class="py-3.5 px-4 min-w-[150px] text-right whitespace-nowrap">Cập nhật trạng thái</th>
        </tr>
      </thead>

      <tbody v-if="orders.length === 0" class="text-center">
        <tr>
          <td colspan="7" class="py-12 text-[#7A866E]">
            <div class="flex flex-col items-center justify-center space-y-2">
              <AlertCircle class="w-8 h-8 text-[#CCD7BC]" />
              <span class="text-xs font-semibold">Không tìm thấy đơn hàng nào khớp với bộ lọc.</span>
            </div>
          </td>
        </tr>
      </tbody>

      <tbody v-else class="divide-y divide-[#F0F3EC]">
        <tr
          v-for="order in orders"
          :key="order.id"
          class="hover:bg-[#FAF9F5] transition-colors"
        >
          <!-- Cột 1: Mã đơn & Thời gian -->
          <td class="py-4 px-4 whitespace-nowrap">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center shrink-0">
                <Package class="w-4 h-4" />
              </div>
              <div>
                <span class="font-heading font-black text-[#2D3B1E] text-sm block">#{{ order.orderCode }}</span>
                <span class="text-[11px] text-[#7A866E] flex items-center gap-1 mt-0.5">
                  <Clock class="w-3 h-3 text-[#8C9882]" />
                  <span>{{ formatDate(order.createdAt) }}</span>
                </span>
              </div>
            </div>
          </td>

          <!-- Cột 2: Khách hàng & SĐT -->
          <td class="py-4 px-4 min-w-[200px]">
            <span class="font-bold text-[#2D3B1E] text-sm block">{{ order.customer.name }}</span>
            <span class="text-xs text-[#7A866E] block mt-0.5">📞 {{ order.customer.phone }}</span>
            <span class="text-[11px] text-[#8C9882] line-clamp-1 block mt-0.5 max-w-[220px]" :title="order.customer.address">
              {{ order.customer.address }}
            </span>
          </td>

          <!-- Cột 3: Món ăn & Macros -->
          <td class="py-4 px-4 min-w-[240px]">
            <div class="space-y-1 max-w-[240px]">
              <span class="text-xs font-semibold text-[#2D3B1E] block line-clamp-2 leading-relaxed" :title="order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')">
                {{ order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ') }}
              </span>
              <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
                <span class="px-2 py-0.5 rounded-md bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34] whitespace-nowrap">
                  ⚡ {{ order.totalCalories }} kcal
                </span>
                <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                  {{ order.totalProtein }}g Đạm
                </span>
              </div>
            </div>
          </td>

          <!-- Cột 4: Tổng tiền & Thanh toán -->
          <td class="py-4 px-4 whitespace-nowrap">
            <span class="font-heading font-black text-[#2D3B1E] text-sm block">
              {{ formatVnd(order.totalAmount) }}
            </span>
            <div class="mt-1">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block whitespace-nowrap"
                :class="isOrderPaid(order) ? 'bg-[#EBF7E5] text-[#4D6A34] border border-[#CCD7BC]' : 'bg-amber-100 text-amber-800 border border-amber-200'"
              >
                {{ order.paymentMethod }} • {{ isOrderPaid(order) ? 'Đã thu' : 'Chưa thu' }}
              </span>
            </div>
            <div v-if="order.discountAmount" class="mt-1">
              <span class="px-2 py-0.5 rounded-md bg-purple-50 text-[10px] font-bold text-purple-700 inline-block whitespace-nowrap" :title="order.voucherCode">
                🏷️ -{{ formatVnd(order.discountAmount) }} <span v-if="order.voucherCode">({{ order.voucherCode }})</span>
              </span>
            </div>
          </td>

          <!-- Cột 5: Vận chuyển -->
          <td class="py-4 px-4 whitespace-nowrap">
            <div v-if="order.shippingMethod === 'express_2h'" class="space-y-1">
              <span class="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] inline-flex items-center gap-1 whitespace-nowrap">
                <AlertTriangle class="w-3 h-3 text-rose-600" />
                <span>GIAO GẤP 2H</span>
              </span>
              <span class="text-[11px] text-[#7A866E] block">Đóng gói chuyên dụng</span>
            </div>
            <div v-else class="space-y-0.5">
              <span class="font-medium text-[#2D3B1E] text-xs block whitespace-nowrap">Giao tiêu chuẩn</span>
              <span class="text-[11px] text-[#7A866E] block whitespace-nowrap">Cách nhiệt sinh thái</span>
            </div>
          </td>

          <!-- Cột 6: Trạng thái hiện tại -->
          <td class="py-4 px-4 whitespace-nowrap">
            <span
              class="px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 whitespace-nowrap"
              :class="getStatusBadge(order.status).class"
            >
              <component :is="getStatusBadge(order.status).icon" class="w-3.5 h-3.5 shrink-0" />
              <span>{{ getStatusBadge(order.status).text }}</span>
            </span>
          </td>

          <!-- Cột 7: Thao tác cập nhật trạng thái (CN_24) -->
          <td class="py-4 px-4 text-right whitespace-nowrap">
            <div class="relative inline-block text-left">
              <button
                type="button"
                @click="toggleDropdown(order.id)"
                class="px-3 py-1.5 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#4D6A34] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
              >
                <span>Đổi trạng thái</span>
                <ChevronDown class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': activeDropdownId === order.id }" />
              </button>

              <!-- Backdrop đóng dropdown khi click ngoài -->
              <div
                v-if="activeDropdownId === order.id"
                class="fixed inset-0 z-20 cursor-default"
                @click="activeDropdownId = null"
              ></div>

              <!-- Dropdown Menu Cập Nhật Trạng Thái (CN_24) -->
              <div
                v-if="activeDropdownId === order.id"
                class="absolute right-0 mt-1 w-52 rounded-2xl bg-white border border-[#E3E8DC] shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  @click="handleSelectStatus(order.id, 'confirmed')"
                  class="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-[#F6F8F3] text-indigo-700 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Duyệt đơn</span>
                </button>

                <button
                  type="button"
                  @click="handleSelectStatus(order.id, 'packing')"
                  class="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-[#F6F8F3] text-sky-700 flex items-center gap-2 cursor-pointer"
                >
                  <Package class="w-3.5 h-3.5" />
                  <span>Đang đóng gói</span>
                </button>

                <button
                  type="button"
                  @click="handleSelectStatus(order.id, 'shipping')"
                  class="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-[#F6F8F3] text-emerald-700 flex items-center gap-2 cursor-pointer"
                >
                  <Truck class="w-3.5 h-3.5" />
                  <span>Chuyển sang Giao hàng</span>
                </button>

                <button
                  type="button"
                  @click="handleSelectStatus(order.id, 'delivered')"
                  class="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-[#F6F8F3] text-[#4D6A34] flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Giao thành công</span>
                </button>

                <div class="my-1 border-t border-[#F0F3EC]"></div>

                <button
                  type="button"
                  @click="handleSelectStatus(order.id, 'cancelled')"
                  class="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                >
                  <XCircle class="w-3.5 h-3.5" />
                  <span>Hủy đơn hàng</span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
