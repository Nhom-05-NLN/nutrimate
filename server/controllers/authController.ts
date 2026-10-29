import { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { ApiResponse } from '../types/index.js';

export async function register(
  req: Request<object, ApiResponse<authService.RegisteredUser>, authService.RegisterUserInput>,
  res: Response<ApiResponse<authService.RegisteredUser>>
): Promise<void> {
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    res.status(400).json({ success: false, message: 'Dữ liệu đăng ký không hợp lệ.' });
    return;
  }

  try {
    const user = await authService.register(req.body);
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