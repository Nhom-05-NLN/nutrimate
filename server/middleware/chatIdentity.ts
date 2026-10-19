import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { config } from '../config.js';
import { queryPostgres } from '../db/index.js';
import { ChatError, type ChatOwner } from '../types/chat.js';

export function verifyCustomerJwt(token: string, secret: string): number {
  try {
    if (secret.length < 32 || token.length > 8192) throw new Error();
    const [header, payload, signature, extra] = token.split('.');
    if (!header || !payload || !signature || extra !== undefined) throw new Error();
    const metadata = JSON.parse(Buffer.from(header, 'base64url').toString()) as { alg?: unknown; crit?: unknown };
    if (metadata.alg !== 'HS256' || metadata.crit !== undefined) throw new Error();
    const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error();
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { sub?: unknown; exp?: unknown; nbf?: unknown };
    const now = Date.now() / 1000;
    if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp <= now) throw new Error();
    if (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || !Number.isFinite(claims.nbf) || claims.nbf > now)) throw new Error();
    if (typeof claims.sub !== 'string' || !/^[1-9]\d*$/.test(claims.sub)) throw new Error();
    const userId = Number(claims.sub);
    if (!Number.isSafeInteger(userId) || userId > 2147483647) throw new Error();
    return userId;
  } catch { throw new ChatError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'); }
}

// The authentication module issues JWTs. This adapter verifies them; it never creates logins.
export function createChatIdentity(findCustomer = async (id: number): Promise<string | undefined> => {
  const result = await queryPostgres<{ role: string }>('SELECT role FROM users WHERE id = $1', [id]);
  return result.rows[0]?.role;
}) {
 return async function resolveChatOwner(req: Request, res: Response, allowNewGuest = false): Promise<ChatOwner> {
  const authorization = req.get('authorization');
  if (authorization !== undefined) {
    if (!authorization.startsWith('Bearer ')) throw new ChatError(401, 'Cần token đăng nhập hợp lệ.');
    const userId = verifyCustomerJwt(authorization.slice(7), config.chat.jwtSecret);
    const role = await findCustomer(userId);
    if (!role) throw new ChatError(401, 'Tài khoản không còn tồn tại.');
    if (role !== 'customer') throw new ChatError(403, 'Chức năng này dành cho Customer.');
    return { userId, guestHash: null };
  }
  let guestToken = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('nutrimate_guest='))?.slice(16);
  if (!guestToken || !/^[a-f0-9]{64}$/.test(guestToken)) {
    if (!allowNewGuest) throw new ChatError(401, 'Hãy tạo phiên chat Guest hoặc đăng nhập trước.');
    guestToken = randomBytes(32).toString('hex');
    res.cookie('nutrimate_guest', guestToken, {
      httpOnly: true, sameSite: 'strict', secure: config.isProduction, path: '/api/chat', maxAge: 7 * 86400000,
    });
  }
  return { userId: null, guestHash: createHash('sha256').update(guestToken).digest('hex') };
 };
}
export const resolveChatOwner = createChatIdentity();
