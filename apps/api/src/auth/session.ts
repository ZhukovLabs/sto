import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
/** Остаток срока, при котором токен продлевается при очередном запросе. */
export const RENEW_THRESHOLD_SECONDS = 6 * 24 * 60 * 60;

export interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(value: Buffer | string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

function sign(data: string, secret: string): string {
  return base64UrlEncode(createHmac('sha256', secret).update(data).digest());
}

export function createSessionToken(userId: string, secret: string, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000);
  const payload: SessionPayload = {
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_SECONDS,
  };
  const data = base64UrlEncode(JSON.stringify(payload));
  return `${data}.${sign(data, secret)}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): SessionPayload | null {
  const [data, signature] = token.split('.');
  if (data === undefined || signature === undefined) {
    return null;
  }
  const expected = Buffer.from(sign(data, secret));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }
  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(data).toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }
  if (
    typeof payload.sub !== 'string' ||
    typeof payload.exp !== 'number' ||
    payload.exp * 1000 <= now
  ) {
    return null;
  }
  return payload;
}

/** Остаток срока токена в секундах; null для мусорной строки. */
export function secondsLeft(token: string, now = Date.now()): number | null {
  const [data] = token.split('.');
  if (data === undefined) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(data).toString('utf8')) as Partial<SessionPayload>;
    if (typeof payload.exp !== 'number') {
      return null;
    }
    return payload.exp - Math.floor(now / 1000);
  } catch {
    return null;
  }
}
