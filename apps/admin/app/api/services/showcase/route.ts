import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiUpdateShowcase } from '@/lib/api';

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
  const { serviceIds } = (body ?? {}) as { serviceIds?: unknown };
  if (!Array.isArray(serviceIds) || serviceIds.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ message: 'Ожидается список услуг' }, { status: 400 });
  }
  try {
    await apiUpdateShowcase(token, serviceIds);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось сохранить витрину';
    return NextResponse.json({ message }, { status });
  }
}
