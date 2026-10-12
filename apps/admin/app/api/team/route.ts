import { NextResponse, type NextRequest } from 'next/server';
import {
  ApiError,
  SESSION_COOKIE,
  apiCreateTeamMember,
  apiListTeam,
  type TeamMemberInput,
} from '@/lib/api';

function readInput(
  body: Record<string, unknown>,
): { ok: true; input: TeamMemberInput } | { ok: false; message: string } {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const spec = typeof body.spec === 'string' ? body.spec.trim() : '';
  if (name.length < 2 || name.length > 80) {
    return { ok: false, message: 'Имя: от 2 до 80 знаков' };
  }
  if (role.length < 2 || role.length > 120) {
    return { ok: false, message: 'Роль: от 2 до 120 знаков' };
  }
  if (spec.length < 2) {
    return { ok: false, message: 'Специализация обязательна' };
  }
  return {
    ok: true,
    input: {
      name,
      role,
      spec,
      photo:
        typeof body.photo === 'string' && body.photo.trim().length > 0 ? body.photo.trim() : null,
      photoAlt:
        typeof body.photoAlt === 'string' && body.photoAlt.trim().length > 0
          ? body.photoAlt.trim()
          : null,
    },
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const team = await apiListTeam(token);
    return NextResponse.json(team);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить команду';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Некорректный JSON' }, { status: 400 });
  }
  const parsed = readInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }
  try {
    const member = await apiCreateTeamMember(token, parsed.input);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось создать участника';
    return NextResponse.json({ message }, { status });
  }
}
