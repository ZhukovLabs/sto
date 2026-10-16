import { NextResponse, type NextRequest } from 'next/server';
import {
  REMEMBER_COOKIE,
  REMEMBER_MAX_AGE,
  SESSION_COOKIE,
  ApiError,
  apiLogin,
  sessionCookieOptions,
} from '@/lib/api';
import { isCaptchaConfigured, verifyCaptchaToken } from '@/lib/captcha';

/** Локальный троттл логина: 10 попыток за 15 минут с IP.
 * Второй слой после рейт-лимитера бэкенда (email|IP) — прикрывает BFF,
 * пока запрос не дошёл до API. Память живёт до перезапуска процесса. */
const LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginBuckets = new Map<string, { count: number; resetAt: number }>();

function isLoginBlocked(ip: string, now = Date.now()): boolean {
  const bucket = loginBuckets.get(ip);
  if (bucket === undefined || bucket.resetAt <= now) {
    loginBuckets.delete(ip);
    return false;
  }
  return bucket.count >= LOGIN_ATTEMPTS;
}

function registerLoginFailure(ip: string, now = Date.now()): void {
  const bucket = loginBuckets.get(ip);
  if (bucket === undefined || bucket.resetAt <= now) {
    loginBuckets.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

/** За реверс-прокси берём первый адрес из X-Forwarded-For. */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first !== undefined && first !== ''
    ? first
    : (request.headers.get('x-real-ip') ?? 'unknown');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  if (isLoginBlocked(ip)) {
    return NextResponse.json(
      { message: 'Слишком много попыток входа. Повторите через 15 минут' },
      { status: 429 },
    );
  }

  let credentials: {
    email?: unknown;
    password?: unknown;
    remember?: unknown;
    captchaToken?: unknown;
  };
  try {
    credentials = (await request.json()) as typeof credentials;
  } catch {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  const email = typeof credentials.email === 'string' ? credentials.email.trim() : '';
  const password = typeof credentials.password === 'string' ? credentials.password : '';
  const remember = credentials.remember === true;
  const captchaToken =
    typeof credentials.captchaToken === 'string' && credentials.captchaToken !== ''
      ? credentials.captchaToken
      : null;
  if (email === '' || password === '') {
    return NextResponse.json({ message: 'Введите email и пароль' }, { status: 400 });
  }

  // Капча обязательна, когда настроен серверный ключ. Без ключа (локальная
  // разработка) — пропускаем, в проде ключа нет — не пускаем вовсе.
  if (isCaptchaConfigured()) {
    if (captchaToken === null) {
      return NextResponse.json({ message: 'Подтвердите, что вы не робот' }, { status: 400 });
    }
    const captchaPassed = await verifyCaptchaToken(captchaToken, ip);
    if (!captchaPassed) {
      return NextResponse.json(
        { message: 'Капча не пройдена, попробуйте ещё раз' },
        { status: 400 },
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Смарт-капча не настроена: задайте SMARTCAPTCHA_SERVER_KEY' },
      { status: 500 },
    );
  }

  try {
    const session = await apiLogin(email, password);
    loginBuckets.delete(ip);
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
    const status = error instanceof ApiError ? error.status : 502;
    // Внутренние тексты 5xx бэкенда наружу не отдаём.
    const message =
      error instanceof ApiError && status < 500 ? error.message : 'Сервис авторизации недоступен';
    registerLoginFailure(ip);
    return NextResponse.json({ message }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
