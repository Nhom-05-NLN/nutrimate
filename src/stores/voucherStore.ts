import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Voucher, CreateVoucherPayload } from '../types';
import {
  fetchVouchers,
  createVoucherApi,
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

  return {
    vouchers,
    isLoading,
    error,
    activeVouchers,
    loadVouchers,
    addVoucher,
    toggleVoucher,
    removeVoucher,
    getVoucherByCode,
  };
});
