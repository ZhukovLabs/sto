import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiReorderGroups } from '@/lib/api';

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
  if (
    typeof body !== 'object' ||
    body === null ||
    !Array.isArray((body as { ids?: unknown }).ids) ||
    (body as { ids: unknown[] }).ids.some((id) => typeof id !== 'string')
  ) {
    return NextResponse.json({ message: 'Ожидается список идентификаторов' }, { status: 400 });
  }
  try {
    await apiReorderGroups(token, (body as { ids: string[] }).ids);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось сохранить порядок групп';
    return NextResponse.json({ message }, { status });
  }
}
