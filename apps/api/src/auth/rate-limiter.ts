export interface RateLimiter {
  isBlocked(key: string, now?: number): boolean;
  registerFailure(key: string, now?: number): void;
  reset(key: string): void;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;

export function createRateLimiter(attempts: number, windowMs = WINDOW_MS): RateLimiter {
  const buckets = new Map<string, Bucket>();

  function cleanup(now: number): void {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }

  return {
    isBlocked(key: string, now = Date.now()): boolean {
      cleanup(now);
      const bucket = buckets.get(key);
      return bucket !== undefined && bucket.count >= attempts && bucket.resetAt > now;
    },
    registerFailure(key: string, now = Date.now()): void {
      cleanup(now);
      const bucket = buckets.get(key);
      if (bucket === undefined || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return;
      }
      bucket.count += 1;
    },
    reset(key: string): void {
      buckets.delete(key);
    },
  };
}

/** Вход в панель: 5 попыток за 15 минут. */
export const loginRateLimiter = createRateLimiter(5);

/** Публичное создание заявок и записей: 3 за 15 минут с одного IP. */
export const publicCreateRateLimiter = createRateLimiter(3);
