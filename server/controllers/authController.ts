import { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { createAuthToken } from '../services/jwtService.js';
import { AuthLocals } from '../middleware/authMiddleware.js';
import { ApiResponse } from '../types/index.js';

const AUTH_COOKIE_NAME = 'nutrimate_auth';
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function hasObjectBody(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

function setAuthCookie(
  res: Response,
  user: authService.AuthenticatedUser,
  rememberMe: boolean
): void {
  const { token, expiresInSeconds } = createAuthToken(user, rememberMe);
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...AUTH_COOKIE_OPTIONS,
    ...(rememberMe ? { maxAge: expiresInSeconds * 1000 } : {}),
  });
}

export async function register(
  req: Request<object, ApiResponse<authService.AuthenticatedUser>, authService.RegisterUserInput>,
  res: Response<ApiResponse<authService.AuthenticatedUser>>
): Promise<void> {
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    res.status(400).json({ success: false, message: 'Dữ liệu đăng ký không hợp lệ.' });
    return;
  }

  try {
    const user = await authService.register(req.body);
    setAuthCookie(res, user, true);
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công.',
      data: user,
    });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : 'Unknown registration error';
    console.error('[AuthController] Không thể đăng ký tài khoản:', message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký tài khoản.' });
  }
}

export async function me(
  _req: Request,
  res: Response<ApiResponse<authService.RegisteredUser>, AuthLocals>
): Promise<void> {
  try {
    const user = await authService.getAuthenticatedUser(res.locals.auth.sub);
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ success: false, message: 'Phiên đăng nhập không còn hợp lệ.' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : 'Unknown session error';
    console.error('[AuthController] Không thể xác minh phiên đăng nhập:', message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xác minh phiên đăng nhập.' });
  }
}

export async function updateMe(
  req: Request<object, ApiResponse<authService.RegisteredUser>, authService.UpdateProfileInput>,
  res: Response<ApiResponse<authService.RegisteredUser>, AuthLocals>
): Promise<void> {
  if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
    res.status(400).json({ success: false, message: "Thông tin cá nhân không hợp lệ." });
    return;
  }

  try {
    const user = await authService.updateAuthenticatedUser(res.locals.auth.sub, req.body);
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ success: false, message: "Phiên đăng nhập không còn hợp lệ." });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công.",
      data: user,
    });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown profile update error";
    console.error("[AuthController] Không thể cập nhật thông tin cá nhân:", message);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi cập nhật thông tin cá nhân." });
  }
}

export async function listAddresses(
  _req: Request,
  res: Response<ApiResponse<authService.RegisteredUser["addresses"]>, AuthLocals>
): Promise<void> {
  try {
    const addresses = await authService.getUserAddresses(res.locals.auth.sub);
    res.status(200).json({ success: true, data: addresses });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown address list error";
    console.error("[AuthController] Không thể tải địa chỉ:", message);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi tải địa chỉ." });
  }
}

export async function createAddress(
  req: Request<object, ApiResponse<Awaited<ReturnType<typeof authService.createUserAddress>>>, authService.UserAddressInput>,
  res: Response<ApiResponse<Awaited<ReturnType<typeof authService.createUserAddress>>>, AuthLocals>
): Promise<void> {
  if (!hasObjectBody(req.body)) {
    res.status(400).json({ success: false, message: "Thông tin địa chỉ không hợp lệ." });
    return;
  }

  try {
    const address = await authService.createUserAddress(res.locals.auth.sub, req.body);
    res.status(201).json({ success: true, message: "Đã thêm địa chỉ nhận hàng.", data: address });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown address creation error";
    console.error("[AuthController] Không thể thêm địa chỉ:", message);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi thêm địa chỉ." });
  }
}

export async function editAddress(
  req: Request<{ addressId: string }, ApiResponse<Awaited<ReturnType<typeof authService.editUserAddress>>>, authService.UserAddressInput>,
  res: Response<ApiResponse<Awaited<ReturnType<typeof authService.editUserAddress>>>, AuthLocals>
): Promise<void> {
  if (!hasObjectBody(req.body)) {
    res.status(400).json({ success: false, message: "Thông tin địa chỉ không hợp lệ." });
    return;
  }

  try {
    const address = await authService.editUserAddress(
      res.locals.auth.sub,
      req.params.addressId,
      req.body,
    );
    res.status(200).json({ success: true, message: "Đã cập nhật địa chỉ.", data: address });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown address update error";
    console.error("[AuthController] Không thể cập nhật địa chỉ:", message);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi cập nhật địa chỉ." });
  }
}

export async function setDefaultAddress(
  req: Request<{ addressId: string }>,
  res: Response<ApiResponse<never>, AuthLocals>
): Promise<void> {
  try {
    await authService.makeDefaultUserAddress(res.locals.auth.sub, req.params.addressId);
    res.status(200).json({ success: true, message: "Đã đặt làm địa chỉ mặc định." });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown default address error";
    console.error("[AuthController] Không thể đặt địa chỉ mặc định:", message);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi đặt địa chỉ mặc định." });
  }
}

export async function deleteAddress(
  req: Request<{ addressId: string }>,
  res: Response<ApiResponse<never>, AuthLocals>
): Promise<void> {
  try {
    await authService.removeUserAddress(res.locals.auth.sub, req.params.addressId);
    res.status(200).json({ success: true, message: "Đã xóa địa chỉ." });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown address delete error";
    console.error("[AuthController] Không thể xóa địa chỉ:", message);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi xóa địa chỉ." });
  }
}

export async function updateAvatar(
  req: Request<object, ApiResponse<{ avatarUrl: string }>, authService.UpdateAvatarInput>,
  res: Response<ApiResponse<{ avatarUrl: string }>, AuthLocals>
): Promise<void> {
  if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
    res.status(400).json({ success: false, message: "Ảnh đại diện không hợp lệ." });
    return;
  }

  try {
    const avatarUrl = await authService.updateAuthenticatedUserAvatar(
      res.locals.auth.sub,
      req.body,
    );
    if (avatarUrl === null) {
      clearAuthCookie(res);
      res.status(401).json({ success: false, message: "Phiên đăng nhập không còn hợp lệ." });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Cập nhật ảnh đại diện thành công.",
      data: { avatarUrl },
    });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown avatar update error";
    console.error("[AuthController] Không thể cập nhật ảnh đại diện:", message);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi cập nhật ảnh đại diện." });
  }
}

export function logout(_req: Request, res: Response<ApiResponse<never>>): void {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Đã đăng xuất thành công.' });
}

function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
}

export async function login(
  req: Request<object, ApiResponse<authService.AuthenticatedUser>, authService.LoginUserInput>,
  res: Response<ApiResponse<authService.AuthenticatedUser>>
): Promise<void> {
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    res.status(400).json({ success: false, message: 'Dữ liệu đăng nhập không hợp lệ.' });
    return;
  }

  try {
    const user = await authService.login(req.body);
    const rememberMe = req.body.rememberMe !== false;
    setAuthCookie(res, user, rememberMe);
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: user,
    });
  } catch (err: unknown) {
    if (err instanceof authService.AuthServiceError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : 'Unknown login error';
    console.error('[AuthController] Không thể đăng nhập:', message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập.' });
  }
}
