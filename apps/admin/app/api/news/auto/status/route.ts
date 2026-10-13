import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiAutoNewsStatus } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const state = await apiAutoNewsStatus(token);
    return NextResponse.json(state);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось получить статус';
    return NextResponse.json({ message }, { status });
  }
}
