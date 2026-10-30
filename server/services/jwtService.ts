import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

export interface AuthClaims {
  sub: string;
  role: 'customer' | 'admin';
  iss: 'nutrimate';
  iat: number;
  exp: number;
}

const TOKEN_ISSUER = 'nutrimate';
const TOKEN_LIFETIME_SECONDS = 12 * 60 * 60;
const REMEMBERED_TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

function getSecret(): string {
  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET phải được cấu hình với ít nhất 32 ký tự.');
  }
  return config.jwtSecret;
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function createAuthToken(user: { id: string; role: AuthClaims['role'] }, rememberMe: boolean): {
  token: string;
  expiresInSeconds: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = rememberMe
    ? REMEMBERED_TOKEN_LIFETIME_SECONDS
    : TOKEN_LIFETIME_SECONDS;
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeJson({
    sub: user.id,
    role: user.role,
    iss: TOKEN_ISSUER,
    iat: now,
    exp: now + expiresInSeconds,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac('sha256', getSecret()).update(unsignedToken).digest('base64url');

  return { token: `${unsignedToken}.${signature}`, expiresInSeconds };
}

export function verifyAuthToken(token: string): AuthClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  try {
    const header: unknown = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    const payload: unknown = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const expectedSignature = createHmac('sha256', getSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    const suppliedSignature = Buffer.from(encodedSignature, 'base64url');

    if (
      typeof header !== 'object' ||
      header === null ||
      !('alg' in header) ||
      header.alg !== 'HS256' ||
      suppliedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(expectedSignature, suppliedSignature) ||
      typeof payload !== 'object' ||
      payload === null ||
      !('sub' in payload) ||
      typeof payload.sub !== 'string' ||
      !/^\d+$/.test(payload.sub) ||
      !('role' in payload) ||
      (payload.role !== 'customer' && payload.role !== 'admin') ||
      !('iss' in payload) ||
      payload.iss !== TOKEN_ISSUER ||
      !('iat' in payload) ||
      typeof payload.iat !== 'number' ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload as AuthClaims;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      throw error;
    }
    return null;
  }
}
