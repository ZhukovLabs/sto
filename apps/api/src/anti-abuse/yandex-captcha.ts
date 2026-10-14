/** Проверка токена Яндекс SmartCaptcha на сервере. */

import { Logger } from '@nestjs/common';

const logger = new Logger('YandexCaptcha');
const VALIDATE_URL = 'https://smartcaptcha.yandexcloud.net/validate';
const TIMEOUT_MS = 5000;

export async function verifyYandexCaptcha(
  serverKey: string,
  token: string,
  ip: string,
): Promise<boolean> {
  const url = new URL(VALIDATE_URL);
  url.searchParams.set('secret', serverKey);
  url.searchParams.set('token', token);
  url.searchParams.set('ip', ip);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (response.status !== 200) {
      logger.error(`validate недоступен (${response.status}) — пропускаем (fail-open)`);
      return true;
    }
    const body: unknown = await response.json();
    return (
      typeof body === 'object' && body !== null && (body as { status?: string }).status === 'ok'
    );
  } catch (error: unknown) {
    logger.error(`validate не ответил — пропускаем (fail-open): ${String(error)}`);
    return true;
  }
}

/** Настроен ли серверный ключ капчи. Без него требование капчи отключено. */
export function isCaptchaConfigured(): boolean {
  const serverKey = process.env.SMARTCAPTCHA_SERVER_KEY;
  return typeof serverKey === 'string' && serverKey.length > 0;
}

/**
 * Проверяет токен капчи. Вызывать только когда ключ настроен
 * и IP исчерпал доверие — иначе мусорные токены генерируют
 * безлимитный исходящий трафик на Яндекс.
 */
export async function verifyCaptchaToken(token: string, ip: string): Promise<boolean> {
  const serverKey = process.env.SMARTCAPTCHA_SERVER_KEY;
  if (!serverKey) {
    return false;
  }
  return verifyYandexCaptcha(serverKey, token, ip);
}
