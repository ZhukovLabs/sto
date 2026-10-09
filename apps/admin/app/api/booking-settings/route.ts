import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, apiGetBookingSettings, apiUpdateBookingSettings } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const settings = await apiGetBookingSettings(token);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить настройки';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
  }
  try {
    const settings = await apiUpdateBookingSettings(token, body);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить настройки';
    return NextResponse.json({ message }, { status: 502 });
  }
}
