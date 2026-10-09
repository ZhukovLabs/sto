import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiDeleteMaster, apiUpdateMaster } from '@/lib/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await context.params;
  let body: { name?: unknown; isActive?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; isActive?: unknown };
  } catch {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  const patch: { name?: string; isActive?: boolean } = {};
  if (typeof body.name === 'string') {
    patch.name = body.name.trim();
  }
  if (typeof body.isActive === 'boolean') {
    patch.isActive = body.isActive;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: 'Нечего обновлять' }, { status: 400 });
  }
  try {
    const master = await apiUpdateMaster(token, id, patch);
    return NextResponse.json(master);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось обновить мастера';
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    await apiDeleteMaster(token, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось удалить мастера';
    return NextResponse.json({ message }, { status });
  }
}
