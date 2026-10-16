/** Проверка токена Яндекс SmartCaptcha на стороне BFF админки. */

const VALIDATE_URL = 'https://smartcaptcha.yandexcloud.net/validate';
const TIMEOUT_MS = 5000;

export function isCaptchaConfigured(): boolean {
  const serverKey = process.env.SMARTCAPTCHA_SERVER_KEY;
  return typeof serverKey === 'string' && serverKey.length > 0;
}

/**
 * Возвращает true, если токен прошёл проверку.
 * Сбой сети/доступности Яндекса считаем непройденным: логин — вход в панель,
 * fail-open здесь открыл бы панель ботам на время сбоя капчи.
 */
export async function verifyCaptchaToken(token: string, ip: string): Promise<boolean> {
  const serverKey = process.env.SMARTCAPTCHA_SERVER_KEY;
  if (serverKey === undefined || serverKey === '') {
    return false;
  }
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
      return false;
    }
    const body: unknown = await response.json();
    return (
      typeof body === 'object' && body !== null && (body as { status?: string }).status === 'ok'
    );
  } catch {
    return false;
  }
}
