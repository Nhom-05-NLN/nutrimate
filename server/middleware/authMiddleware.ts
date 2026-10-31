import { NextFunction, Request, Response } from 'express';
import { AuthClaims, verifyAuthToken } from '../services/jwtService.js';

export interface AuthLocals {
  auth: AuthClaims;
}

export function requireAuth(
  req: Request,
  res: Response<unknown, Partial<AuthLocals>>,
  next: NextFunction
): void {
  const cookieHeader = req.headers.cookie;
  const tokenCookie = cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('nutrimate_auth='));
  const token = tokenCookie?.slice('nutrimate_auth='.length);

  if (!token) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' });
    return;
  }

  try {
    const claims = verifyAuthToken(token);
    if (!claims) {
      res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
      return;
    }
    res.locals.auth = claims;
    next();
  } catch (error: unknown) {
    next(error);
  }
}

export function requireAdmin(
  req: Request,
  res: Response<unknown, Partial<AuthLocals>>,
  next: NextFunction
): void {
  requireAuth(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    if (res.headersSent) return;
    if (res.locals.auth?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
      return;
    }
    next();
  });
}
