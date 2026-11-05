import { Voucher, VoucherDiscountType, VoucherTargetType } from '../types/index.js';
import { INITIAL_VOUCHERS } from '../db/seedData.js';
import { isDbConnected, queryPostgres } from '../db/index.js';

let memoryVouchers: Voucher[] = [...INITIAL_VOUCHERS];

interface VoucherRow {
  voucher_id: number;
  id: string | null;
  code: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string | null;
  target_type: string;
  usage_limit: number;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

function mapRowToVoucher(row: VoucherRow): Voucher {
  return {
    id: row.id || `vouch-${row.voucher_id}`,
    code: row.code.toUpperCase(),
    title: row.title,
    description: row.description || undefined,
    discountType: row.discount_type as VoucherDiscountType,
    discountValue: parseFloat(row.discount_value),
    minOrderAmount: parseFloat(row.min_order_amount || '0'),
    maxDiscountAmount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : undefined,
    targetType: (row.target_type as VoucherTargetType) || 'all',
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    startDate: row.start_date || undefined,
    endDate: row.end_date || new Date(Date.now() + 365 * 86400000).toISOString(),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function getAllVouchers(): Promise<Voucher[]> {
  if (isDbConnected()) {
    try {
      const sql = `
        SELECT voucher_id, id, code, title, description, discount_type,
               discount_value, min_order_amount, max_discount_amount,
               target_type, usage_limit, used_count, start_date, end_date,
               is_active, created_at
        FROM vouchers
        ORDER BY created_at DESC
      `;
      const res = await queryPostgres<VoucherRow>(sql);
      if (res.rows.length > 0) {
        return res.rows.map(mapRowToVoucher);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voucher getAll error';
      console.warn('[VoucherRepository GetAll Fallback]:', msg);
    }
  }
  return memoryVouchers;
}

export async function getVoucherByCode(code: string): Promise<Voucher | null> {
  const normalized = code.trim().toUpperCase();
  if (isDbConnected()) {
    try {
      const sql = `
        SELECT voucher_id, id, code, title, description, discount_type,
               discount_value, min_order_amount, max_discount_amount,
               target_type, usage_limit, used_count, start_date, end_date,
               is_active, created_at
        FROM vouchers
        WHERE UPPER(code) = $1
        LIMIT 1
      `;
      const res = await queryPostgres<VoucherRow>(sql, [normalized]);
      const firstRow = res.rows[0];
      if (firstRow) {
        return mapRowToVoucher(firstRow);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voucher getByCode error';
      console.warn('[VoucherRepository GetByCode Fallback]:', msg);
    }
  }

  const found = memoryVouchers.find((v) => v.code.toUpperCase() === normalized);
  return found || null;
}

export async function getVoucherById(id: string): Promise<Voucher | null> {
  if (isDbConnected()) {
    try {
      const sql = `
        SELECT voucher_id, id, code, title, description, discount_type,
               discount_value, min_order_amount, max_discount_amount,
               target_type, usage_limit, used_count, start_date, end_date,
               is_active, created_at
        FROM vouchers
        WHERE id = $1 OR voucher_id::text = $1
        LIMIT 1
      `;
      const res = await queryPostgres<VoucherRow>(sql, [id]);
      const firstRow = res.rows[0];
      if (firstRow) {
        return mapRowToVoucher(firstRow);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voucher getById error';
      console.warn('[VoucherRepository GetById Fallback]:', msg);
    }
  }

  const found = memoryVouchers.find((v) => v.id === id);
  return found || null;
}

export async function createVoucher(voucher: Voucher): Promise<Voucher> {
  if (isDbConnected()) {
    try {
      const sql = `
        INSERT INTO vouchers (
          id, code, title, description, discount_type,
          discount_value, min_order_amount, max_discount_amount,
          target_type, usage_limit, used_count, end_date, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING voucher_id
      `;
      const values = [
        voucher.id,
        voucher.code.toUpperCase(),
        voucher.title,
        voucher.description || null,
        voucher.discountType,
        voucher.discountValue,
        voucher.minOrderAmount,
        voucher.maxDiscountAmount || null,
        voucher.targetType,
        voucher.usageLimit,
        voucher.usedCount,
        voucher.endDate,
        voucher.isActive,
      ];
      const res = await queryPostgres<{ voucher_id: number }>(sql, values);
      const inserted = res.rows[0];
      if (inserted) {
        voucher.id = voucher.id || `vouch-${inserted.voucher_id}`;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voucher create error';
      console.warn('[VoucherRepository Create Fallback]:', msg);
    }
  }

  memoryVouchers.unshift(voucher);
  return voucher;
}

export async function toggleVoucherActive(id: string): Promise<Voucher | null> {
  const current = await getVoucherById(id);
  if (!current) return null;

  const nextActive = !current.isActive;

  if (isDbConnected()) {
    try {
      const sql = `
        UPDATE vouchers
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 OR voucher_id::text = $2
      `;
      await queryPostgres(sql, [nextActive, id]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voucher toggle error';
      console.warn('[VoucherRepository Toggle Fallback]:', msg);
    }
  }

  current.isActive = nextActive;
  const idx = memoryVouchers.findIndex((v) => v.id === id);
  if (idx !== -1 && memoryVouchers[idx]) {
    memoryVouchers[idx].isActive = nextActive;
  }
  return current;
}

export async function incrementVoucherUsed(code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  if (isDbConnected()) {
    try {
      const sql = `
        UPDATE vouchers
        SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE UPPER(code) = $1
      `;
      await queryPostgres(sql, [normalized]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voucher increment error';
      console.warn('[VoucherRepository Increment Fallback]:', msg);
    }
  }

  const v = memoryVouchers.find((item) => item.code.toUpperCase() === normalized);
  if (v) {
    v.usedCount += 1;
  }
}

export async function decrementVoucherUsed(code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  if (isDbConnected()) {
    try {
      const sql = `
        UPDATE vouchers
        SET used_count = GREATEST(0, used_count - 1), updated_at = CURRENT_TIMESTAMP
        WHERE UPPER(code) = $1
      `;
      await queryPostgres(sql, [normalized]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voucher decrement error';
      console.warn('[VoucherRepository Decrement Fallback]:', msg);
    }
  }

  const v = memoryVouchers.find((item) => item.code.toUpperCase() === normalized);
  if (v && v.usedCount > 0) {
    v.usedCount -= 1;
  }
}

export async function deleteVoucher(id: string): Promise<boolean> {
  if (isDbConnected()) {
    try {
      const sql = `DELETE FROM vouchers WHERE id = $1 OR voucher_id::text = $1`;
      await queryPostgres(sql, [id]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voucher delete error';
      console.warn('[VoucherRepository Delete Fallback]:', msg);
    }
  }

  const initialLen = memoryVouchers.length;
  memoryVouchers = memoryVouchers.filter((v) => v.id !== id);
  return memoryVouchers.length < initialLen;
}
