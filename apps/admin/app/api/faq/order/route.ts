import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiReorderFaq } from '@/lib/api';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  if (
    body === null ||
    !Array.isArray(body.ids) ||
    body.ids.some((id) => typeof id !== 'string') ||
    body.ids.length === 0
  ) {
    return NextResponse.json(
      { message: 'ids должен быть непустым массивом строк' },
      { status: 400 },
    );
  }
  try {
    await apiReorderFaq(token, body.ids);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось сохранить порядок';
    return NextResponse.json({ message }, { status });
  }
}
