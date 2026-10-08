import { NextResponse } from 'next/server';
import { REMEMBER_COOKIE, SESSION_COOKIE, sessionCookieOptions } from '@/lib/api';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(false), maxAge: 0 });
  response.cookies.set(REMEMBER_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
