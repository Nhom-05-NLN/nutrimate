import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Voucher, CreateVoucherPayload, UpdateVoucherPayload } from '../types';
import {
  fetchVouchers,
  createVoucherApi,
  updateVoucherApi,
  toggleVoucherApi,
  deleteVoucherApi,
} from '../services/api';

export const useVoucherStore = defineStore('voucher', () => {
  const vouchers = ref<Voucher[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Voucher đang hoạt động và còn thời hạn
  const activeVouchers = computed(() => {
    const now = Date.now();
    return vouchers.value.filter((v) => {
      if (!v.isActive) return false;
      if (v.endDate && new Date(v.endDate).getTime() < now) return false;
      if (v.usageLimit > 0 && v.usedCount >= v.usageLimit) return false;
      return true;
    });
  });

  async function loadVouchers(force = false) {
    if (vouchers.value.length > 0 && !force) return;
    isLoading.value = true;
    error.value = null;
    try {
      vouchers.value = await fetchVouchers();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Không thể tải danh sách voucher';
      console.warn('[VoucherStore Load Error]:', error.value);
    } finally {
      isLoading.value = false;
    }
  }

  async function addVoucher(payload: CreateVoucherPayload): Promise<Voucher> {
    const newVoucher = await createVoucherApi(payload);
    vouchers.value.unshift(newVoucher);
    return newVoucher;
  }

  async function editVoucher(id: string, payload: UpdateVoucherPayload): Promise<Voucher> {
    const updated = await updateVoucherApi(id, payload);
    const idx = vouchers.value.findIndex((v) => v.id === id);
    if (idx !== -1) {
      vouchers.value[idx] = updated;
    }
    return updated;
  }

  async function toggleVoucher(id: string): Promise<Voucher> {
    const updated = await toggleVoucherApi(id);
    const idx = vouchers.value.findIndex((v) => v.id === id);
    if (idx !== -1) {
      vouchers.value[idx] = updated;
    }
    return updated;
  }

  async function removeVoucher(id: string): Promise<boolean> {
    const success = await deleteVoucherApi(id);
    if (success) {
      vouchers.value = vouchers.value.filter((v) => v.id !== id);
    }
    return success;
  }

  function getVoucherByCode(code: string): Voucher | undefined {
    const normalized = code.trim().toUpperCase();
    return vouchers.value.find((v) => v.code.toUpperCase() === normalized);
  }

  /**
   * Tính số tiền giảm giá thực tế của một voucher dựa trên giá trị đơn hàng
   */
  function calculateDiscount(voucher: Voucher, subtotal: number): number {
    if (subtotal < voucher.minOrderAmount) return 0;
    if (voucher.discountType === 'fixed') {
      return Math.min(voucher.discountValue, subtotal);
    }
    if (voucher.discountType === 'percent') {
      let discount = Math.round(subtotal * (voucher.discountValue / 100));
      if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0) {
        discount = Math.min(discount, voucher.maxDiscountAmount);
      }
      return discount;
    }
    return 0;
  }

  /**
   * Tìm voucher tối ưu nhất (giảm nhiều tiền nhất) cho một mức subtotal
   */
  function findBestVoucher(subtotal: number, isCustomerNew = true): Voucher | null {
    if (subtotal <= 0) return null;
    const candidates = activeVouchers.value.filter((v) => {
      if (subtotal < v.minOrderAmount) return false;
      if (v.targetType === 'first_order' && !isCustomerNew) return false;
      return true;
    });

    if (candidates.length === 0) return null;

    let bestVoucher: Voucher | null = null;
    let maxDiscount = 0;

    for (const v of candidates) {
      const discount = calculateDiscount(v, subtotal);
      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestVoucher = v;
      }
    }

    return bestVoucher;
  }

  return {
    vouchers,
    isLoading,
    error,
    activeVouchers,
    loadVouchers,
    addVoucher,
    editVoucher,
    toggleVoucher,
    removeVoucher,
    getVoucherByCode,
    calculateDiscount,
    findBestVoucher,
  };
});
