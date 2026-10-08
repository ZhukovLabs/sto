import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limiter';

describe('rate-limiter', () => {
  it('блокирует после заданного числа неудач в окне', () => {
    const limiter = createRateLimiter(5);
    const key = 'user|ip';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(limiter.isBlocked(key)).toBe(false);
      limiter.registerFailure(key);
    }
    expect(limiter.isBlocked(key)).toBe(true);
  });

  it('снимает блокировку сбросом после успеха', () => {
    const limiter = createRateLimiter(5);
    const key = 'user|ip-2';
    limiter.registerFailure(key);
    limiter.registerFailure(key);
    limiter.reset(key);
    expect(limiter.isBlocked(key)).toBe(false);
  });

  it('блокировка истекает по прошествии окна', () => {
    const limiter = createRateLimiter(5);
    const key = 'user|ip-3';
    const start = Date.now();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.registerFailure(key, start);
    }
    expect(limiter.isBlocked(key, start + 14 * 60 * 1000)).toBe(true);
    expect(limiter.isBlocked(key, start + 15 * 60 * 1000 + 1)).toBe(false);
  });

  it('лимитеры независимы друг от друга', () => {
    const login = createRateLimiter(5);
    const create = createRateLimiter(3);
    const key = 'same|key';
    for (let attempt = 0; attempt < 3; attempt += 1) {
      login.registerFailure(key);
      create.registerFailure(key);
    }
    expect(create.isBlocked(key)).toBe(true);
    expect(login.isBlocked(key)).toBe(false);
  });
});
