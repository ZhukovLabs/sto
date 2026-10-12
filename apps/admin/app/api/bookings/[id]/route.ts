import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiDeleteBooking } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await params;
  try {
    await apiDeleteBooking(token, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось удалить запись';
    return NextResponse.json({ message }, { status });
  }
}
