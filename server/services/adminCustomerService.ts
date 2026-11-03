import * as adminCustomerRepository from '../repositories/adminCustomerRepository.js';
import { AdminCustomerInput, AdminCustomerListResult } from '../types/adminCustomer.js';
import { hashPassword } from '../utils/password.js';

const nutritionGoals = ['lose_weight', 'maintain_weight', 'gain_weight'] as const;
type NutritionGoal = (typeof nutritionGoals)[number];
const filterNutritionGoals = ['all', ...nutritionGoals, 'unset'] as const;
const bmiFilters = ['all', 'set', 'unset'] as const;
const orderFilters = ['all', 'has_orders', 'no_orders'] as const;

export class AdminCustomerError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'AdminCustomerError';
  }
}

export class AdminCustomerNotFoundError extends Error {
  constructor() {
    super('Không tìm thấy khách hàng.');
    this.name = 'AdminCustomerNotFoundError';
  }
}

export class AdminCustomerHasOrdersError extends Error {
  constructor(public readonly orderCount: number) {
    super(`Không thể xóa khách hàng vì tài khoản đang có ${orderCount} đơn hàng.`);
    this.name = 'AdminCustomerHasOrdersError';
  }
}

export class AdminCustomerDuplicateEmailError extends Error {
  constructor() {
    super('Email này đã được sử dụng bởi tài khoản khác.');
    this.name = 'AdminCustomerDuplicateEmailError';
  }
}

function parseCustomerId(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new AdminCustomerError('Mã khách hàng không hợp lệ.', 400);
  }
  return parsed;
}

function parsePage(value: unknown): number {
  if (value === undefined) return 1;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new AdminCustomerError('Trang khách hàng không hợp lệ.', 400);
  }
  return parsed;
}

function parseLimit(value: unknown): number {
  if (value === undefined) return 20;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    throw new AdminCustomerError('Số lượng khách hàng mỗi trang không hợp lệ.', 400);
  }
  return parsed;
}

function parseSearch(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 100) {
    throw new AdminCustomerError('Từ khóa tìm kiếm khách hàng không hợp lệ.', 400);
  }
  return value.trim();
}

function parseEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fieldName: string,
): T[number] {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new AdminCustomerError(`Bộ lọc ${fieldName} không hợp lệ.`, 400);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCustomerInput(value: unknown, requirePassword: boolean): AdminCustomerInput {
  if (!isRecord(value)) {
    throw new AdminCustomerError('Thông tin khách hàng không hợp lệ.', 400);
  }
  const body = value;
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!fullName || fullName.length > 150) {
    throw new AdminCustomerError('Họ tên khách hàng phải có từ 1 đến 150 ký tự.', 400);
  }
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AdminCustomerError('Email khách hàng không hợp lệ.', 400);
  }
  if (phone.length > 20) {
    throw new AdminCustomerError('Số điện thoại không được vượt quá 20 ký tự.', 400);
  }

  const password = body.password;
  if (requirePassword && (typeof password !== 'string' || password.length < 8 || password.length > 128)) {
    throw new AdminCustomerError('Mật khẩu ban đầu phải có từ 8 đến 128 ký tự.', 400);
  }
  if (!requirePassword && password !== undefined && password !== '') {
    throw new AdminCustomerError('Không hỗ trợ đổi mật khẩu tại biểu mẫu này.', 400);
  }

  const parseMeasurement = (input: unknown, fieldName: string, maximum: number): number | null => {
    if (input === undefined || input === null || input === '') return null;
    const parsed = Number(input);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > maximum) {
      throw new AdminCustomerError(`${fieldName} không hợp lệ.`, 400);
    }
    return parsed;
  };
  const heightCm = parseMeasurement(body.heightCm, 'Chiều cao', 300);
  const weightKg = parseMeasurement(body.weightKg, 'Cân nặng', 700);
  const goal = body.nutritionGoal;
  const isNutritionGoal = (candidate: unknown): candidate is NutritionGoal =>
    typeof candidate === 'string' && (nutritionGoals as readonly string[]).includes(candidate);
  if (goal !== null && goal !== undefined && !isNutritionGoal(goal)) {
    throw new AdminCustomerError('Mục tiêu dinh dưỡng không hợp lệ.', 400);
  }
  const passwordValue = typeof password === 'string' ? password : undefined;

  return {
    fullName,
    email,
    phone,
    ...(requirePassword && passwordValue ? { password: passwordValue } : {}),
    heightCm,
    weightKg,
    nutritionGoal: isNutritionGoal(goal) ? goal : null,
  };
}

export async function listCustomers(query: {
  search?: unknown;
  segment?: unknown;
  nutritionGoal?: unknown;
  bmiProfile?: unknown;
  orders?: unknown;
  includeAvatars?: unknown;
  page?: unknown;
  limit?: unknown;
}): Promise<AdminCustomerListResult> {
  const segment = query.segment ?? 'all';
  if (segment !== 'all' && segment !== 'frequent') {
    throw new AdminCustomerError('Bộ lọc tương tác NutriBot không hợp lệ.', 400);
  }
  const includeAvatars = query.includeAvatars === undefined
    ? true
    : query.includeAvatars === 'true' || query.includeAvatars === true
      ? true
      : query.includeAvatars === 'false' || query.includeAvatars === false
        ? false
        : null;
  if (includeAvatars === null) {
    throw new AdminCustomerError('Tham số ảnh đại diện không hợp lệ.', 400);
  }

  return adminCustomerRepository.listAdminCustomers({
    search: parseSearch(query.search),
    segment,
    nutritionGoal: parseEnum(query.nutritionGoal ?? 'all', filterNutritionGoals, 'mục tiêu dinh dưỡng'),
    bmiProfile: parseEnum(query.bmiProfile ?? 'all', bmiFilters, 'hồ sơ BMI'),
    orders: parseEnum(query.orders ?? 'all', orderFilters, 'đơn hàng'),
    includeAvatars,
    page: parsePage(query.page),
    limit: parseLimit(query.limit),
  });
}

function rethrowDuplicateEmail(error: unknown): never {
  if (
    typeof error === 'object' && error !== null && 'code' in error &&
    error.code === '23505' && 'constraint' in error && error.constraint === 'users_email_key'
  ) {
    throw new AdminCustomerDuplicateEmailError();
  }
  throw error;
}

export async function createCustomer(value: unknown): Promise<string> {
  const input = parseCustomerInput(value, true);
  if (!input.password) throw new AdminCustomerError('Vui lòng nhập mật khẩu ban đầu.', 400);
  const passwordHash = await hashPassword(input.password);
  try {
    return await adminCustomerRepository.createAdminCustomer(input, passwordHash);
  } catch (error: unknown) {
    return rethrowDuplicateEmail(error);
  }
}

export async function updateCustomer(idValue: unknown, value: unknown): Promise<void> {
  const id = parseCustomerId(idValue);
  const input = parseCustomerInput(value, false);
  try {
    const updated = await adminCustomerRepository.updateAdminCustomer(id, input);
    if (!updated) throw new AdminCustomerNotFoundError();
  } catch (error: unknown) {
    return rethrowDuplicateEmail(error);
  }
}

export async function deleteCustomer(idValue: unknown): Promise<void> {
  const id = parseCustomerId(idValue);
  const result = await adminCustomerRepository.deleteAdminCustomer(id);
  if (!result) throw new AdminCustomerNotFoundError();
  if (!result.deleted) throw new AdminCustomerHasOrdersError(result.orderCount);
}
