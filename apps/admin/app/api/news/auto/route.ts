import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiAutoNews } from '@/lib/api';

export const maxDuration = 120;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const result = await apiAutoNews(token);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось собрать новость';
    return NextResponse.json({ message }, { status });
  }
}
