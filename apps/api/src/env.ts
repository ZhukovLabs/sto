import { z } from 'zod';

/** Дефолтные origin-ы (dev). Экспортированы для фолбэка CORS в main.ts. */
export const DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

const envSchema = z.object({
  DATABASE_URL: z.string().startsWith('postgresql://'),
  PORT: z.coerce.number().int().positive().default(3002),
  CORS_ORIGINS: z
    .string()
    .default(DEFAULT_CORS_ORIGINS.join(','))
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET должен быть не короче 32 символов'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(10).optional(),
  TELEGRAM_CHAT_ID: z.string().min(1).optional(),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  REVALIDATE_SECRET: z.string().min(32).optional(),
  UPLOADS_DIR: z.string().min(1).optional(),
  /** S3-хранилище медиа (SeaweedFS в docker-compose). Не задано - файлы остаются на диске. */
  S3_ENDPOINT: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().optional(),
  ),
  S3_BUCKET: z.string().min(1).default('sto-media'),
  S3_ACCESS_KEY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  S3_SECRET_KEY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  /** OpenAI-совместимый LLM для автоновостей из RSS. Бесплатный glm-4.5-flash (glm-4-flash устарел). */
  LLM_BASE_URL: z.string().url().default('https://api.z.ai/api/paas/v4'),
  LLM_API_KEY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(10).optional(),
  ),
  LLM_MODEL: z.string().min(1).default('glm-4.5-flash'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(source);
}
