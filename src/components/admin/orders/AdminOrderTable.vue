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
  Eye,
  ChevronDown,
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

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'delivered':
      return { text: 'Giao thành công', class: 'bg-[#EBF7E5] text-[#4D6A34] border-[#CCD7BC]' };
    case 'shipping':
      return { text: 'Đang vận chuyển 2H', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'packing':
      return { text: 'Đang đóng gói 4°C', class: 'bg-sky-50 text-sky-800 border-sky-200' };
    case 'confirmed':
      return { text: 'Đã duyệt đơn', class: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    case 'cancelled':
      return { text: 'Đã hủy', class: 'bg-rose-50 text-rose-800 border-rose-200' };
    default:
      return { text: 'Chờ xác nhận', class: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs">
      <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
        <tr>
          <th class="py-3.5 px-4">Mã đơn & Thời gian</th>
          <th class="py-3.5 px-4">Khách hàng & SĐT</th>
          <th class="py-3.5 px-4">Món ăn & Macros</th>
          <th class="py-3.5 px-4">Tổng tiền & Thanh toán</th>
          <th class="py-3.5 px-4">Vận chuyển</th>
          <th class="py-3.5 px-4">Trạng thái</th>
          <th class="py-3.5 px-4 text-right">Cập nhật trạng thái</th>
        </tr>
      </thead>

      <tbody v-if="orders.length === 0" class="text-center">
        <tr>
          <td colspan="7" class="py-12 text-[#7A866E]">
            Không có đơn hàng nào khớp với bộ lọc.
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
          <td class="py-4 px-4">
            <span class="font-heading font-black text-[#2D3B1E] block text-sm">#{{ order.orderCode }}</span>
            <span class="text-[11px] text-[#7A866E] flex items-center gap-1 mt-0.5">
              <Clock class="w-3 h-3" />
              <span>{{ formatDate(order.createdAt) }}</span>
            </span>
          </td>

          <!-- Cột 2: Khách hàng & SĐT -->
          <td class="py-4 px-4">
            <span class="font-bold text-[#2D3B1E] block text-sm">{{ order.customer.name }}</span>
            <span class="text-[11px] text-[#7A866E] block">📞 {{ order.customer.phone }}</span>
            <span class="text-[10px] text-[#8C9882] truncate max-w-xs block" :title="order.customer.address">
              {{ order.customer.address }}
            </span>
          </td>

          <!-- Cột 3: Món ăn & Macros -->
          <td class="py-4 px-4 max-w-xs">
            <div class="space-y-0.5">
              <span class="text-[#2D3B1E] font-medium block truncate" :title="order.items.map(i => i.productName).join(', ')">
                {{ order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ') }}
              </span>
              <div class="flex items-center gap-1.5 pt-0.5">
                <span class="px-2 py-0.5 rounded-md bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">
                  ⚡ {{ order.totalCalories }} kcal
                </span>
                <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-800">
                  {{ order.totalProtein }}g Đạm
                </span>
              </div>
            </div>
          </td>

          <!-- Cột 4: Tổng tiền & Thanh toán -->
          <td class="py-4 px-4">
            <span class="font-heading font-black text-[#2D3B1E] block text-sm">
              {{ formatVnd(order.totalAmount) }}
            </span>
            <div class="mt-0.5">
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block"
                :class="order.paymentStatus === 'paid' ? 'bg-[#EBF7E5] text-[#4D6A34]' : 'bg-amber-100 text-amber-800'"
              >
                {{ order.paymentMethod }} • {{ order.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
              </span>
            </div>
          </td>

          <!-- Cột 5: Vận chuyển -->
          <td class="py-4 px-4 text-[11px]">
            <div v-if="order.shippingMethod === 'express_2h'" class="space-y-1">
              <span class="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] inline-flex items-center gap-1">
                <AlertTriangle class="w-3 h-3 text-rose-600" />
                <span>GIAO GẤP 2H</span>
              </span>
              <span class="text-[10px] text-[#7A866E] block">Thùng giữ lạnh 4°C</span>
            </div>
            <div v-else>
              <span class="font-medium text-[#2D3B1E] block">Giao tiêu chuẩn</span>
              <span class="text-[10px] text-[#7A866E]">Cách nhiệt sinh thái</span>
            </div>
          </td>

          <!-- Cột 6: Trạng thái hiện tại -->
          <td class="py-4 px-4">
            <span
              class="px-3 py-1 rounded-full text-xs font-bold border inline-block"
              :class="getStatusBadge(order.status).class"
            >
              {{ getStatusBadge(order.status).text }}
            </span>
          </td>

          <!-- Cột 7: Thao tác cập nhật trạng thái (CN_24) -->
          <td class="py-4 px-4 text-right">
            <div class="relative inline-block text-left">
              <button
                type="button"
                @click="toggleDropdown(order.id)"
                class="px-3 py-1.5 rounded-xl border border-[#CCD7BC] bg-[#FAF9F5] hover:bg-[#EBF7E5] text-[#4D6A34] text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <span>Đổi trạng thái</span>
                <ChevronDown class="w-3.5 h-3.5" />
              </button>

              <!-- Dropdown Menu Cập Nhật Trạng Thái (CN_24) -->
              <div
                v-if="activeDropdownId === order.id"
                class="absolute right-0 mt-1 w-48 rounded-2xl bg-white border border-[#E3E8DC] shadow-xl z-30 py-1.5 animate-in fade-in duration-100"
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
                  <span>Đang đóng gói 4°C</span>
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
