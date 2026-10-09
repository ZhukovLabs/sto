import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiCreateMaster, apiListMasters } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const masters = await apiListMasters(token);
    return NextResponse.json(masters);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить мастеров';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  let body: { name?: unknown; telegramChatId?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; telegramChatId?: unknown };
  } catch {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const telegramChatId = typeof body.telegramChatId === 'string' ? body.telegramChatId.trim() : '';
  if (name.length < 2 || telegramChatId.length < 5) {
    return NextResponse.json(
      { message: 'Имя: от 2 символов, chat_id: от 5 цифр' },
      { status: 400 },
    );
  }
  try {
    const master = await apiCreateMaster(token, { name, telegramChatId });
    return NextResponse.json(master, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось добавить мастера';
    return NextResponse.json({ message }, { status });
  }
}
