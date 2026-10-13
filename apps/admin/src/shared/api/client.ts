import { readProxyError } from '@/lib/api';

async function ensureOk(response: Response, fallback: string): Promise<void> {
  if (!response.ok) {
    throw await readProxyError(response, fallback);
  }
}

/** Пустой (204) или не-JSON ответ не роняет парсер. */
async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204 || (response.headers.get('content-type') ?? '') === '') {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** GET через прокси админки: json-ответ или Error с текстом прокси. */
export async function apiGet<T>(url: string, fallback: string): Promise<T> {
  const response = await fetch(url);
  await ensureOk(response, fallback);
  return readJson<T>(response);
}

/** JSON-методы (POST/PATCH/PUT) через прокси админки: json-ответ или Error. */
export async function apiSend<T = unknown>(
  url: string,
  method: string,
  body: unknown,
  fallback: string,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  await ensureOk(response, fallback);
  return readJson<T>(response);
}

/** DELETE через прокси админки; 404 считается успехом (запись уже удалили). */
export async function apiDelete(url: string, fallback: string): Promise<void> {
  const response = await fetch(url, { method: 'DELETE' });
  if (response.status === 404) {
    return;
  }
  await ensureOk(response, fallback);
}
