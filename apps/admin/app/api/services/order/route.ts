import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiReorderServices } from '@/lib/api';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  const { groupId, ids } = (body ?? {}) as { groupId?: unknown; ids?: unknown };
  if (
    typeof groupId !== 'string' ||
    !Array.isArray(ids) ||
    ids.some((id) => typeof id !== 'string')
  ) {
    return NextResponse.json({ message: 'Ожидается группа и список услуг' }, { status: 400 });
  }
  try {
    await apiReorderServices(token, groupId, ids);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось сохранить порядок услуг';
    return NextResponse.json({ message }, { status });
  }
}
