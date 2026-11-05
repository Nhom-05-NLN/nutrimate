import { createHmac, scrypt, timingSafeEqual } from 'node:crypto';
import { isDbConnected } from '../db/index.js';
import { config } from '../config.js';
import * as authRepository from '../repositories/authRepository.js';
import { DuplicateEmailError } from '../repositories/authRepository.js';
import { hashPassword } from '../utils/password.js';

export interface RegisterUserInput {
  fullName: unknown;
  email: unknown;
  phone: unknown;
  password: unknown;
  confirmPassword: unknown;
  acceptedTerms: unknown;
}

export interface LoginUserInput {
  identifier: unknown;
  password: unknown;
  rememberMe?: unknown;
}

export interface UpdateProfileInput {
  name: unknown;
  email: unknown;
  phone: unknown;
}

export interface UserAddressInput {
  receiverName: unknown;
  receiverPhone: unknown;
  houseNumber: unknown;
  street: unknown;
  hamlet?: unknown;
  ward: unknown;
  province: unknown;
}

export interface UpdateAvatarInput {
  avatarUrl: unknown;
}

export interface UpdateDietPreferencesInput {
  dietPreferences: unknown;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  avatarUrl?: string | null;
  dietPreferences: string[];
  defaultAddress?: authRepository.UserAddressRecord | null;
  addresses?: authRepository.UserAddressRecord[];
}

export interface AuthenticatedUser extends RegisteredUser {
  accessToken: string;
}

export class AuthServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [algorithm, saltHex, derivedKeyHex, ...extra] = passwordHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    !saltHex ||
    !/^[\da-f]{32}$/i.test(saltHex) ||
    !derivedKeyHex ||
    !/^[\da-f]{128}$/i.test(derivedKeyHex) ||
    extra.length > 0
  ) {
    return Promise.resolve(false);
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(derivedKeyHex, 'hex');

  return new Promise((resolve, reject) => {
    scrypt(password, salt, expectedKey.length, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(timingSafeEqual(expectedKey, derivedKey));
    });
  });
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AuthServiceError(`Vui lòng nhập ${fieldName}.`, 400);
  }
  return value.trim();
}

function createAccessToken(userId: number): string {
  const secret = config.chat.jwtSecret;
  if (secret.length < 32) {
    throw new AuthServiceError('Máy chủ chưa được cấu hình xác thực an toàn.', 503);
  }
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: String(userId), iat: now, exp: now + 3600 })).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export async function register(input: RegisterUserInput): Promise<AuthenticatedUser> {
  if (config.chat.jwtSecret.length < 32) {
    throw new AuthServiceError('Máy chủ chưa được cấu hình xác thực an toàn.', 503);
  }
  const fullName = requireString(input.fullName, 'họ và tên');
  const email = requireString(input.email, 'email').toLowerCase();
  const phone = requireString(input.phone, 'số điện thoại');

  if (fullName.length > 150) {
    throw new AuthServiceError('Họ và tên không được vượt quá 150 ký tự.', 400);
  }

  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthServiceError('Email không hợp lệ.', 400);
  }

  if (phone.length > 20) {
    throw new AuthServiceError('Số điện thoại không được vượt quá 20 ký tự.', 400);
  }

  if (typeof input.password !== 'string' || input.password.length < 8) {
    throw new AuthServiceError('Mật khẩu phải có ít nhất 8 ký tự.', 400);
  }

  if (input.password.length > 128) {
    throw new AuthServiceError('Mật khẩu không được vượt quá 128 ký tự.', 400);
  }

  if (input.confirmPassword !== input.password) {
    throw new AuthServiceError('Mật khẩu xác nhận không khớp.', 400);
  }

  if (input.acceptedTerms !== true) {
    throw new AuthServiceError('Vui lòng đồng ý với các điều khoản để đăng ký.', 400);
  }

  if (!isDbConnected()) {
    throw new AuthServiceError('Máy chủ cơ sở dữ liệu hiện không khả dụng.', 503);
  }

  try {
    const user = await authRepository.createUser({
      fullName,
      email,
      phone,
      passwordHash: await hashPassword(input.password),
    });

    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      accessToken: createAccessToken(user.id),
      role: 'customer',
      dietPreferences: [],
    };
  } catch (err: unknown) {
    if (err instanceof DuplicateEmailError) {
      throw new AuthServiceError('Email này đã được đăng ký.', 409);
    }
    throw err;
  }
}

export async function login(
  input: LoginUserInput,
  expectedRole: "customer" | "admin",
): Promise<AuthenticatedUser> {
  if (config.chat.jwtSecret.length < 32) {
    throw new AuthServiceError('Máy chủ chưa được cấu hình xác thực an toàn.', 503);
  }
  const identifier = requireString(input.identifier, 'email hoặc số điện thoại');

  if (identifier.length > 255) {
    throw new AuthServiceError('Thông tin đăng nhập không hợp lệ.', 400);
  }

  if (typeof input.password !== 'string' || input.password.length === 0) {
    throw new AuthServiceError('Vui lòng nhập mật khẩu.', 400);
  }

  if (input.password.length > 128) {
    throw new AuthServiceError('Thông tin đăng nhập không hợp lệ.', 400);
  }

  if (!isDbConnected()) {
    throw new AuthServiceError('Máy chủ cơ sở dữ liệu hiện không khả dụng.', 503);
  }

  const user = await authRepository.findUserForLogin(identifier, expectedRole);
  if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AuthServiceError('Email, số điện thoại hoặc mật khẩu không chính xác.', 401);
  }

  if (user.role === 'customer') {
    await authRepository.createCustomerLoginNotification(user);
  }

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    accessToken: createAccessToken(user.id),
    role: user.role,
    avatarUrl: user.avatarUrl,
    dietPreferences: user.dietPreferences,
  };
}

export async function getAuthenticatedUser(id: string): Promise<RegisteredUser | null> {
  if (!isDbConnected()) {
    throw new AuthServiceError('Máy chủ cơ sở dữ liệu hiện không khả dụng.', 503);
  }

  const user = await authRepository.findUserById(id);
  if (!user) {
    return null;
  }

  const addresses = await authRepository.findUserAddresses(id);
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    dietPreferences: user.dietPreferences ?? [],
    defaultAddress: addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
    addresses,
  };
}

export async function updateAuthenticatedUserAvatar(
  id: string,
  input: UpdateAvatarInput,
): Promise<string | null> {
  if (!isDbConnected()) {
    throw new AuthServiceError("Máy chủ cơ sở dữ liệu hiện không khả dụng.", 503);
  }
  if (typeof input.avatarUrl !== "string") {
    throw new AuthServiceError("Ảnh đại diện không hợp lệ.", 400);
  }

  const avatarUrl = input.avatarUrl.trim();
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/]+={0,2})$/.exec(avatarUrl);
  if (!match?.[1] || avatarUrl.length > 1_100_000) {
    throw new AuthServiceError("Ảnh đại diện không hợp lệ hoặc vượt quá dung lượng cho phép.", 400);
  }

  const image = Buffer.from(match[1], "base64");
  if (
    image.length === 0 ||
    image.length > 750_000 ||
    image.toString("ascii", 0, 4) !== "RIFF" ||
    image.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new AuthServiceError("Ảnh đại diện WebP không hợp lệ.", 400);
  }

  const savedAvatarUrl = await authRepository.updateUserAvatar(id, avatarUrl);
  return savedAvatarUrl ?? null;
}

export async function updateAuthenticatedUserDietPreferences(
  id: string,
  input: UpdateDietPreferencesInput,
): Promise<string[] | null> {
  if (!isDbConnected()) {
    throw new AuthServiceError("Máy chủ cơ sở dữ liệu hiện không khả dụng.", 503);
  }
  if (!Array.isArray(input.dietPreferences)) {
    throw new AuthServiceError("Danh sách chế độ ăn không hợp lệ.", 400);
  }

  const preferences: string[] = [];
  for (const preference of input.dietPreferences) {
    if (typeof preference !== "string") {
      throw new AuthServiceError("Danh sách chế độ ăn không hợp lệ.", 400);
    }
    preferences.push(preference);
  }

  const allowedPreferences = new Set([
    "Low-Carb",
    "Giàu Protein",
    "Ít đường",
    "Không bột ngọt",
    "Keto chuẩn",
  ]);
  if (
    preferences.length > allowedPreferences.size ||
    preferences.some((preference) => !allowedPreferences.has(preference)) ||
    new Set(preferences).size !== preferences.length
  ) {
    throw new AuthServiceError("Danh sách chế độ ăn không hợp lệ.", 400);
  }

  return authRepository.updateUserDietPreferences(id, preferences);
}

export async function updateAuthenticatedUser(
  id: string,
  input: UpdateProfileInput,
): Promise<RegisteredUser | null> {
  if (!isDbConnected()) {
    throw new AuthServiceError("Máy chủ cơ sở dữ liệu hiện không khả dụng.", 503);
  }

  const existingUser = await authRepository.findUserById(id);
  if (!existingUser) {
    return null;
  }

  const name = requireString(input.name, "họ và tên");
  const email = requireString(input.email, "email").toLowerCase();
  const phone = requireString(input.phone, "số điện thoại");

  if (name.length > 150) {
    throw new AuthServiceError("Họ và tên không được vượt quá 150 ký tự.", 400);
  }
  if (phone.length > 20) {
    throw new AuthServiceError("Số điện thoại không được vượt quá 20 ký tự.", 400);
  }
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthServiceError("Email không hợp lệ.", 400);
  }
  try {
    const user = await authRepository.updateUserProfile(id, {
      fullName: name,
      email,
      phone,
    });
    if (!user) {
      return null;
    }

    const addresses = await authRepository.findUserAddresses(id);
    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: existingUser.role,
      dietPreferences: existingUser.dietPreferences,
      defaultAddress: addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
      addresses,
    };
  } catch (err: unknown) {
    if (err instanceof DuplicateEmailError) {
      throw new AuthServiceError("Email này đã được đăng ký.", 409);
    }
    throw err;
  }
}

function validateUserAddress(input: UserAddressInput): authRepository.UserAddressInput {
  const receiverName = requireString(input.receiverName, "tên người nhận");
  const receiverPhone = requireString(input.receiverPhone, "số điện thoại nhận hàng");
  const houseNumber = requireString(input.houseNumber, "số nhà");
  const street = requireString(input.street, "đường");
  const hamlet = typeof input.hamlet === "string" ? input.hamlet.trim() : "";
  const ward = requireString(input.ward, "phường/xã");
  const province = requireString(input.province, "tỉnh/thành phố");

  if (receiverName.length > 100) {
    throw new AuthServiceError("Tên người nhận không được vượt quá 100 ký tự.", 400);
  }
  if (receiverPhone.length > 20) {
    throw new AuthServiceError("Số điện thoại không được vượt quá 20 ký tự.", 400);
  }
  if (houseNumber.length > 100 || street.length > 255 || hamlet.length > 150 || ward.length > 150 || province.length > 150) {
    throw new AuthServiceError("Một trong các thành phần địa chỉ vượt quá độ dài cho phép.", 400);
  }

  return { receiverName, receiverPhone, houseNumber, street, hamlet, ward, province };
}

function requireAddressId(value: string): number {
  const addressId = Number(value);
  if (!Number.isSafeInteger(addressId) || addressId < 1) {
    throw new AuthServiceError("Mã địa chỉ không hợp lệ.", 400);
  }
  return addressId;
}

export async function getUserAddresses(userId: string): Promise<authRepository.UserAddressRecord[]> {
  if (!isDbConnected()) {
    throw new AuthServiceError("Máy chủ cơ sở dữ liệu hiện không khả dụng.", 503);
  }
  return authRepository.findUserAddresses(userId);
}

export async function createUserAddress(
  userId: string,
  input: UserAddressInput,
): Promise<authRepository.UserAddressRecord> {
  if (!isDbConnected()) {
    throw new AuthServiceError("Máy chủ cơ sở dữ liệu hiện không khả dụng.", 503);
  }
  return authRepository.createUserAddress(userId, validateUserAddress(input));
}

export async function editUserAddress(
  userId: string,
  rawAddressId: string,
  input: UserAddressInput,
): Promise<authRepository.UserAddressRecord> {
  if (!isDbConnected()) {
    throw new AuthServiceError("Máy chủ cơ sở dữ liệu hiện không khả dụng.", 503);
  }
  const address = await authRepository.updateUserAddress(
    userId,
    requireAddressId(rawAddressId),
    validateUserAddress(input),
  );
  if (!address) throw new AuthServiceError("Không tìm thấy địa chỉ nhận hàng.", 404);
  return address;
}

export async function makeDefaultUserAddress(userId: string, rawAddressId: string): Promise<void> {
  if (!isDbConnected()) {
    throw new AuthServiceError("Máy chủ cơ sở dữ liệu hiện không khả dụng.", 503);
  }
  const updated = await authRepository.setDefaultUserAddress(userId, requireAddressId(rawAddressId));
  if (!updated) throw new AuthServiceError("Không tìm thấy địa chỉ nhận hàng.", 404);
}

export async function removeUserAddress(userId: string, rawAddressId: string): Promise<void> {
  if (!isDbConnected()) {
    throw new AuthServiceError("Máy chủ cơ sở dữ liệu hiện không khả dụng.", 503);
  }
  const deleted = await authRepository.deleteUserAddress(userId, requireAddressId(rawAddressId));
  if (!deleted) throw new AuthServiceError("Không tìm thấy địa chỉ nhận hàng.", 404);
}
