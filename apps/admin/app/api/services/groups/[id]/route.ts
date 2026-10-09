import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiDeleteGroup, apiUpdateGroup } from '@/lib/api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await params;
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
    const group = await apiUpdateGroup(token, id, body as Parameters<typeof apiUpdateGroup>[2]);
    return NextResponse.json(group);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось обновить группу';
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await params;
  try {
    await apiDeleteGroup(token, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось удалить группу';
    return NextResponse.json({ message }, { status });
  }
}
