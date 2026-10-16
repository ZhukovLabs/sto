import { NextResponse, type NextRequest } from 'next/server';
import { REMEMBER_COOKIE, SESSION_COOKIE, apiLogout, sessionCookieOptions } from '@/lib/api';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token !== undefined) {
    try {
      // Отзываем сессию на бэкенде: иначе JWT работал бы до конца срока
      // даже после «выхода». Лучший эффект — cookie чистим в любом случае.
      await apiLogout(token);
    } catch {
      // Бэкенд недоступен — cookie всё равно чистим, токен умрёт по exp.
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(false), maxAge: 0 });
  response.cookies.set(REMEMBER_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
