import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiReorderTeam } from '@/lib/api';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  let body: { ids?: unknown };
  try {
    body = (await request.json()) as { ids?: unknown };
  } catch {
    return NextResponse.json({ message: 'Некорректный JSON' }, { status: 400 });
  }
  if (!Array.isArray(body.ids) || body.ids.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ message: 'ids: массив строк' }, { status: 400 });
  }
  try {
    await apiReorderTeam(token, body.ids as string[]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось сохранить порядок';
    return NextResponse.json({ message }, { status });
  }
}
