import { describe, expect, it } from 'vitest';
import { isBlocked, registerFailure, reset } from './rate-limiter';

describe('rate-limiter', () => {
  it('блокирует после пяти неудач в окне', () => {
    const key = 'user|ip';
    reset(key);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(isBlocked(key)).toBe(false);
      registerFailure(key);
    }
    expect(isBlocked(key)).toBe(true);
  });

  it('снимает блокировку сбросом после успеха', () => {
    const key = 'user|ip-2';
    reset(key);
    registerFailure(key);
    registerFailure(key);
    reset(key);
    expect(isBlocked(key)).toBe(false);
  });

  it('блокировка истекает по прошествии окна', () => {
    const key = 'user|ip-3';
    reset(key);
    const start = Date.now();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      registerFailure(key, start);
    }
    expect(isBlocked(key, start + 14 * 60 * 1000)).toBe(true);
    expect(isBlocked(key, start + 15 * 60 * 1000 + 1)).toBe(false);
  });
});
