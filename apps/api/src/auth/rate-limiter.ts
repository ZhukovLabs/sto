const ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function cleanup(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function isBlocked(key: string, now = Date.now()): boolean {
  cleanup(now);
  const bucket = buckets.get(key);
  return bucket !== undefined && bucket.count >= ATTEMPTS && bucket.resetAt > now;
}

export function registerFailure(key: string, now = Date.now()): void {
  cleanup(now);
  const bucket = buckets.get(key);
  if (bucket === undefined || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

export function reset(key: string): void {
  buckets.delete(key);
}
