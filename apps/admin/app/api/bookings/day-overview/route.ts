import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiDayOverview } from '@/lib/api';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const date = request.nextUrl.searchParams.get('date');
  if (date === null || !DATE_PATTERN.test(date)) {
    return NextResponse.json({ message: 'Дата — YYYY-MM-DD' }, { status: 400 });
  }
  try {
    const overview = await apiDayOverview(token, date);
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить день';
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ message }, { status });
  }
}
