import { NextResponse, type NextRequest } from 'next/server';
import { REMEMBER_COOKIE, SESSION_COOKIE, apiRefresh, sessionCookieOptions } from './src/lib/api';

const PUBLIC_PATHS = ['/login'];

function decodeSessionExp(token: string): number | null {
  const [data] = token.split('.');
  if (data === undefined) {
    return null;
  }
  try {
    const json = JSON.parse(
      Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as { exp?: unknown };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  if (token === undefined || token === '') {
    if (isPublic) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Скользящее продление: когда до конца сессии меньше шести дней.
  const exp = decodeSessionExp(token);
  if (exp !== null && exp - Math.floor(Date.now() / 1000) < 6 * 24 * 60 * 60) {
    const refreshed = await apiRefresh(token).catch(() => null);
    if (refreshed !== null) {
      const persistent = request.cookies.has(REMEMBER_COOKIE);
      const next = NextResponse.next();
      next.cookies.set(SESSION_COOKIE, refreshed.token, sessionCookieOptions(persistent));
      return next;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
