import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, apiGetSmsBalance } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const balance = await apiGetSmsBalance(token);
    return NextResponse.json(balance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось получить баланс';
    return NextResponse.json({ message }, { status: 502 });
  }
}
