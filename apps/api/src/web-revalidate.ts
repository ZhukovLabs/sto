import { Logger } from '@nestjs/common';
import { loadEnv } from './env';

const logger = new Logger('WebRevalidate');

export function notifyWebRevalidate(): void {
  const env = loadEnv();
  if (env.REVALIDATE_SECRET === undefined) {
    return;
  }
  void fetch(`${env.WEB_URL}/api/revalidate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: env.REVALIDATE_SECRET }),
  }).catch((error: unknown): void => {
    logger.warn(`Веб не перевалидирован: ${String(error)}`);
  });
}
