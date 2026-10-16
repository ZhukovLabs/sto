import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiDeleteFaqItem, apiUpdateFaqItem } from '@/lib/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: { question?: string; answer?: string; isActive?: boolean } = {};
  if (typeof body?.question === 'string') {
    const question = body.question.trim();
    if (question.length < 5 || question.length > 200) {
      return NextResponse.json({ message: 'Вопрос: от 5 до 200 знаков' }, { status: 400 });
    }
    patch.question = question;
  }
  if (typeof body?.answer === 'string') {
    const answer = body.answer.trim();
    if (answer.length < 5 || answer.length > 2000) {
      return NextResponse.json({ message: 'Ответ: от 5 до 2000 знаков' }, { status: 400 });
    }
    patch.answer = answer;
  }
  if (typeof body?.isActive === 'boolean') {
    patch.isActive = body.isActive;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: 'Нечего обновлять' }, { status: 400 });
  }
  try {
    const item = await apiUpdateFaqItem(token, id, patch);
    return NextResponse.json(item);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось обновить вопрос';
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
    await apiDeleteFaqItem(token, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось удалить вопрос';
    return NextResponse.json({ message }, { status });
  }
}
