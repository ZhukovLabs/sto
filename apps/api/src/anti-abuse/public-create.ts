import { assertCaptchaAllowed, isHoneypotFilled } from './anti-abuse';
import { verifyCaptchaToken } from './yandex-captcha';

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
  const captchaPassed = captchaToken ? await verifyCaptchaToken(captchaToken, ip) : false;
  assertCaptchaAllowed(ip, captchaPassed);
  return false;
}
