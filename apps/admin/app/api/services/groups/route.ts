import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiCreateGroup } from '@/lib/api';

export async function POST(request: NextRequest): Promise<NextResponse> {
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
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  try {
    const group = await apiCreateGroup(token, body as Parameters<typeof apiCreateGroup>[1]);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось создать группу';
    return NextResponse.json({ message }, { status });
  }
}
