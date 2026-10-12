import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiDeleteTeamMember, apiUpdateTeamMember } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Некорректный JSON' }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  for (const field of ['name', 'role', 'spec', 'photo', 'photoAlt'] as const) {
    if (body[field] !== undefined) {
      const value = body[field];
      if (value === null) {
        patch[field] = null;
      } else if (typeof value === 'string') {
        patch[field] = value.trim().length > 0 ? value.trim() : null;
      } else {
        return NextResponse.json({ message: `${field}: строка или null` }, { status: 400 });
      }
    }
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive: boolean' }, { status: 400 });
    }
    patch.isActive = body.isActive;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: 'Пустой набор изменений' }, { status: 400 });
  }
  try {
    const member = await apiUpdateTeamMember(token, id, patch);
    return NextResponse.json(member);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось сохранить участника';
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await params;
  try {
    await apiDeleteTeamMember(token, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось удалить участника';
    return NextResponse.json({ message }, { status });
  }
}
