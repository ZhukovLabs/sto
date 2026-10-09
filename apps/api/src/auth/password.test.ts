import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('хеширует и проверяет верный пароль', async () => {
    const hash = await hashPassword('Промакс-2026!');
    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword('Промакс-2026!', hash)).resolves.toBe(true);
  });

  it('отклоняет неверный пароль', async () => {
    const hash = await hashPassword('правильный-пароль');
    await expect(verifyPassword('неправильный', hash)).resolves.toBe(false);
  });

  it('создаёт уникальные соли для одинаковых паролей', async () => {
    const first = await hashPassword('одинаковый');
    const second = await hashPassword('одинаковый');
    expect(first).not.toBe(second);
  });

  it('отклоняет повреждённый хеш', async () => {
    await expect(verifyPassword('пароль', 'мусор')).resolves.toBe(false);
    await expect(verifyPassword('пароль', 'bcrypt$abc$def')).resolves.toBe(false);
  });
});
