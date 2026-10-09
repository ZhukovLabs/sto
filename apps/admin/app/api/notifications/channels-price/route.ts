import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, apiGetChannelsPrice } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const price = await apiGetChannelsPrice(token);
    return NextResponse.json(price);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не получилось получить цены';
    return NextResponse.json({ message }, { status: 502 });
  }
}
