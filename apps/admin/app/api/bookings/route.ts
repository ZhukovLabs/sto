import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, apiListBookings } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const bookings = await apiListBookings(token);
    return NextResponse.json(bookings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить записи';
    return NextResponse.json({ message }, { status: 502 });
  }
}
