/**
 * Анти-абьюз формы: при 428 сервер требует прохождения Яндекс SmartCaptcha.
 */

export class AntiAbuseRequiredError extends Error {
  constructor() {
    super('Подтвердите, что вы не робот');
    this.name = 'AntiAbuseRequiredError';
  }
}

/**
 * POST с анти-абьюзом. При 428 выбрасывает AntiAbuseRequiredError —
 * диалог показывает капчу и повторяет отправку с captchaToken.
 */
export async function postWithAntiAbuse(
  url: string,
  body: unknown,
  idempotencyKey: string,
  captchaToken?: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'idempotency-key': idempotencyKey,
  };
  if (captchaToken) {
    headers['x-captcha-token'] = captchaToken;
  }
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (response.status === 428) {
    throw new AntiAbuseRequiredError();
  }
  return response;
}
