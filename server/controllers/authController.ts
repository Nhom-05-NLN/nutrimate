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
