import { Logger } from '@nestjs/common';
import { loadEnv } from './env';

const logger = new Logger('WebRevalidate');

export function notifyWebRevalidate(): void {
  let env;
  try {
    env = loadEnv();
  } catch {
    // Ревалидация — best effort: сломанный env не должен ронять уже применённую мутацию.
    logger.warn('Веб не перевалидирован: переменные окружения не прошли валидацию');
    return;
  }
  if (env.REVALIDATE_SECRET === undefined) {
    logger.warn('Веб не перевалидирован: REVALIDATE_SECRET не задан');
    return;
  }
  void fetch(`${env.WEB_URL}/api/revalidate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: env.REVALIDATE_SECRET }),
    signal: AbortSignal.timeout(5000),
  }).catch((error: unknown): void => {
    logger.warn(`Веб не перевалидирован: ${String(error)}`);
  });
}
