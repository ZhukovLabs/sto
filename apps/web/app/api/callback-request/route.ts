import { NextResponse, type NextRequest } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as { name?: string; phone?: string } | null;
  if (body === null || typeof body.name !== 'string' || typeof body.phone !== 'string') {
    return NextResponse.json({ message: 'Некорректная заявка' }, { status: 400 });
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(request.headers.get('idempotency-key') !== null
          ? { 'idempotency-key': request.headers.get('idempotency-key') as string }
          : {}),
      },
      body: JSON.stringify({ name: body.name, phone: body.phone }),
    });
  } catch {
    return NextResponse.json({ message: 'Сервис недоступен, попробуйте позже' }, { status: 502 });
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json(
      { message: payload.message ?? 'Не удалось отправить заявку' },
      { status: response.status },
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
