import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { isDbConnected } from '../db/index.js';
import * as authRepository from '../repositories/authRepository.js';
import { DuplicateEmailError } from '../repositories/authRepository.js';

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

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
}

export type AuthenticatedUser = RegisteredUser;

export class AuthServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);

  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(`scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`);
    });
  });
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

export async function register(input: RegisterUserInput): Promise<RegisteredUser> {
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
      role: 'customer',
    };
  } catch (err: unknown) {
    if (err instanceof DuplicateEmailError) {
      throw new AuthServiceError('Email này đã được đăng ký.', 409);
    }
    throw err;
  }
}

export async function login(input: LoginUserInput): Promise<AuthenticatedUser> {
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

  const user = await authRepository.findUserForLogin(identifier);
  if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AuthServiceError('Email, số điện thoại hoặc mật khẩu không chính xác.', 401);
  }

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export async function getAuthenticatedUser(id: string): Promise<AuthenticatedUser | null> {
  if (!isDbConnected()) {
    throw new AuthServiceError('Máy chủ cơ sở dữ liệu hiện không khả dụng.', 503);
  }

  const user = await authRepository.findUserById(id);
  if (!user) {
    return null;
  }

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}