import { describe, expect, it } from 'vitest';
import { createSessionToken, secondsLeft, verifySessionToken } from './session';

const SECRET = '0123456789abcdef0123456789abcdef';

describe('session', () => {
  it('создаёт и проверяет токен', () => {
    const now = Date.now();
    const token = createSessionToken('user-1', SECRET, now);
    const payload = verifySessionToken(token, SECRET, now + 1000);
    expect(payload?.sub).toBe('user-1');
  });

  it('отклоняет токен с изменённой подписью', () => {
    const token = createSessionToken('user-1', SECRET);
    const tampered = `${token.slice(0, -2)}xy`;
    expect(verifySessionToken(tampered, SECRET)).toBeNull();
  });

  it('отклоняет токен, подписанный другим секретом', () => {
    const token = createSessionToken('user-1', 'другой-секрет-другой-секрет-1234567890');
    expect(verifySessionToken(token, SECRET)).toBeNull();
  });

  it('отклоняет истёкший токен', () => {
    const now = Date.now();
    const token = createSessionToken('user-1', SECRET, now - 8 * 24 * 60 * 60 * 1000);
    expect(verifySessionToken(token, SECRET, now)).toBeNull();
  });

  it('отбрасывает мусорные строки', () => {
    expect(verifySessionToken('мусор', SECRET)).toBeNull();
    expect(verifySessionToken('a.b.c', SECRET)).toBeNull();
  });

  it('считает остаток срока без проверки подписи', () => {
    const now = Date.now();
    const token = createSessionToken('user-1', SECRET, now);
    const left = secondsLeft(token, now + 60_000);
    expect(left).toBeGreaterThan(6 * 24 * 60 * 60);
    expect(secondsLeft('мусор', now)).toBeNull();
  });
});
