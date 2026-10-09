import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Адаптивная защита от злоупотребления формой: пока с IP мало отправок —
 * заявки проходят свободно. После CAPTCHA_THRESHOLD отправок за окно каждая
 * следующая требует прохождения Яндекс SmartCaptcha.
 */

const TRACK_WINDOW_MS = 15 * 60 * 1000;

/** После стольких созданий за окно требуется капча. */
export const CAPTCHA_THRESHOLD = 2;

interface CreationBucket {
  count: number;
  resetAt: number;
}

const creationBuckets = new Map<string, CreationBucket>();

function cleanup(now: number): void {
  for (const [key, bucket] of creationBuckets) {
    if (bucket.resetAt <= now) {
      creationBuckets.delete(key);
    }
  }
}

/** Нужно ли для этого IP прикладывать токен капчи. */
export function needsCaptcha(ip: string, now = Date.now()): boolean {
  cleanup(now);
  const bucket = creationBuckets.get(ip);
  return bucket !== undefined && bucket.count >= CAPTCHA_THRESHOLD && bucket.resetAt > now;
}

/** Счётчик успешно созданных заявок/записей — двигает порог капчи. */
export function registerCreation(ip: string, now = Date.now()): void {
  cleanup(now);
  const bucket = creationBuckets.get(ip);
  if (bucket === undefined || bucket.resetAt <= now) {
    creationBuckets.set(ip, { count: 1, resetAt: now + TRACK_WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

/** Невидимое honeypot-поле заполнено — отправитель бот. */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Если IP исчерпал доверие и капча не пройдена — отказ 428.
 * Браузер покажет виджет SmartCaptcha и повторит отправку с токеном.
 */
export function assertCaptchaAllowed(ip: string, captchaPassed: boolean): void {
  if (captchaPassed || !needsCaptcha(ip)) {
    return;
  }
  throw new HttpException(
    { message: 'Подтвердите, что вы не робот' },
    HttpStatus.PRECONDITION_REQUIRED,
  );
}
