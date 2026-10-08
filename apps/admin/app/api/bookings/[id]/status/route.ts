import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, apiUpdateBookingStatus, isBookingStatus } from '@/lib/api';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status;
  if (!isBookingStatus(status)) {
    return NextResponse.json({ message: 'Некорректный статус' }, { status: 400 });
  }
  const { id } = await context.params;
  try {
    const result = await apiUpdateBookingStatus(token, id, status);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить запись';
    return NextResponse.json({ message }, { status: 502 });
  }
}
