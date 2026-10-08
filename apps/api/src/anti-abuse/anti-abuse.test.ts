import { describe, expect, it } from 'vitest';

import {
  assertCaptchaAllowed,
  isHoneypotFilled,
  needsCaptcha,
  registerCreation,
} from './anti-abuse';

describe('isHoneypotFilled', () => {
  it('заполненная строка = бот', () => {
    expect(isHoneypotFilled('seo spam')).toBe(true);
    expect(isHoneypotFilled('  ')).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
    expect(isHoneypotFilled(123)).toBe(false);
  });
});

describe('порог капчи', () => {
  it('до двух созданий капча не нужна', () => {
    const ip = '10.0.0.1';
    expect(needsCaptcha(ip)).toBe(false);
    registerCreation(ip);
    expect(needsCaptcha(ip)).toBe(false);
  });

  it('после двух созданий третья отправка требует капчу', () => {
    const ip = '10.0.0.2';
    registerCreation(ip);
    registerCreation(ip);
    expect(needsCaptcha(ip)).toBe(true);
  });

  it('окно 15 минут истекает — доверие восстанавливается', () => {
    const ip = '10.0.0.3';
    const now = Date.now();
    registerCreation(ip, now);
    registerCreation(ip, now);
    expect(needsCaptcha(ip, now + 16 * 60 * 1000)).toBe(false);
  });

  it('IP независимы друг от друга', () => {
    const first = '10.0.0.4';
    const second = '10.0.0.5';
    registerCreation(first);
    registerCreation(first);
    expect(needsCaptcha(first)).toBe(true);
    expect(needsCaptcha(second)).toBe(false);
  });
});

describe('assertCaptchaAllowed', () => {
  it('без порога пропускает без капчи', () => {
    expect(() => assertCaptchaAllowed('10.0.1.1', false)).not.toThrow();
  });

  it('при пороге и без капчи бросает 428', () => {
    const ip = '10.0.1.2';
    registerCreation(ip);
    registerCreation(ip);
    expect(() => assertCaptchaAllowed(ip, false)).toThrow(expect.objectContaining({ status: 428 }));
  });

  it('пройденная капча проходит даже при пороге', () => {
    const ip = '10.0.1.3';
    registerCreation(ip);
    registerCreation(ip);
    expect(() => assertCaptchaAllowed(ip, true)).not.toThrow();
  });
});
