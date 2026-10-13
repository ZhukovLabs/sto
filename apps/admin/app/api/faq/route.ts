import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiCreateFaqItem, apiListFaq } from '@/lib/api';

function readInput(
  body: Record<string, unknown>,
): { ok: true; input: { question: string; answer: string } } | { ok: false; message: string } {
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  if (question.length < 5 || question.length > 200) {
    return { ok: false, message: 'Вопрос: от 5 до 200 знаков' };
  }
  if (answer.length < 5 || answer.length > 2000) {
    return { ok: false, message: 'Ответ: от 5 до 2000 знаков' };
  }
  return { ok: true, input: { question, answer } };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const items = await apiListFaq(token);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить FAQ';
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
    const item = await apiCreateFaqItem(token, parsed.input);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось создать вопрос';
    return NextResponse.json({ message }, { status });
  }
}
