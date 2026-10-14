import { assertCaptchaAllowed, isHoneypotFilled, needsCaptcha } from './anti-abuse';
import { isCaptchaConfigured, verifyCaptchaToken } from './yandex-captcha';

/**
 * Единый сценарий защиты публичного создания (заявка/запись):
 * honeypot-бот молча получает «успех», живой клиент — проверку капчи.
 * Возвращает true, если отправителя нужно тихо проигнорировать.
 */
export async function isBotSubmission(
  company: string | undefined,
  captchaToken: string | undefined,
  ip: string,
): Promise<boolean> {
  if (isHoneypotFilled(company)) {
    return true;
  }
  // Ключ капчи не настроен: требование капчи отключено целиком,
  // защиту держит рейт-лимитер. Иначе после порога IP ловил бы вечный 428.
  if (!isCaptchaConfigured()) {
    return false;
  }
  // Верифицируем токен только когда IP исчерпал доверие:
  // запросы до порога не должны порождать исходящие вызовы Яндекса
  // (иначе флуд мусорными токенами — outbound-DoS на чужой сервис).
  if (!needsCaptcha(ip)) {
    return false;
  }
  const captchaPassed =
    typeof captchaToken === 'string' && captchaToken.length > 0
      ? await verifyCaptchaToken(captchaToken, ip)
      : false;
  assertCaptchaAllowed(ip, captchaPassed);
  return false;
}
