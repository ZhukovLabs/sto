import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const valid = {
  DATABASE_URL: 'postgresql://sto:sto@localhost:5432/sto',
  PORT: '3002',
  CORS_ORIGINS: 'http://localhost:3000, http://localhost:3001',
};

describe('loadEnv', () => {
  it('парсит валидное окружение', () => {
    const env = loadEnv(valid);
    expect(env.PORT).toBe(3002);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000', 'http://localhost:3001']);
  });

  it('подставляет значения по умолчанию', () => {
    const env = loadEnv({ DATABASE_URL: valid.DATABASE_URL });
    expect(env.PORT).toBe(3002);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000', 'http://localhost:3001']);
  });

  it('отклоняет окружение без DATABASE_URL', () => {
    expect(() => loadEnv({})).toThrow();
  });
});
