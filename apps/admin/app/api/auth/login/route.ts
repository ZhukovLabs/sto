import { NextResponse } from 'next/server';
import {
  REMEMBER_COOKIE,
  REMEMBER_MAX_AGE,
  SESSION_COOKIE,
  apiLogin,
  sessionCookieOptions,
} from '@/lib/api';

export async function POST(request: Request): Promise<NextResponse> {
  let credentials: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    credentials = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      remember?: unknown;
    };
  } catch {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  const email = typeof credentials.email === 'string' ? credentials.email.trim() : '';
  const password = typeof credentials.password === 'string' ? credentials.password : '';
  const remember = credentials.remember === true;
  if (email === '' || password === '') {
    return NextResponse.json({ message: 'Введите email и пароль' }, { status: 400 });
  }

  try {
    const session = await apiLogin(email, password);
    const response = NextResponse.json({
      user: { email: session.user.email, name: session.user.name },
    });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(remember));
    if (remember) {
      response.cookies.set(REMEMBER_COOKIE, '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: REMEMBER_MAX_AGE,
      });
    }
    return response;
  } catch (error) {
    const status = error instanceof Object && 'status' in error ? Number(error.status) : 502;
    const message =
      error instanceof Object && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Сервис авторизации недоступен';
    return NextResponse.json({ message }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
