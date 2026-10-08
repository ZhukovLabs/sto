import { NextResponse, type NextRequest } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    phone?: string;
    company?: string;
  } | null;
  if (body === null || typeof body.name !== 'string' || typeof body.phone !== 'string') {
    return NextResponse.json({ message: 'Некорректная заявка' }, { status: 400 });
  }
  const idempotencyKey = request.headers.get('idempotency-key');
  const captchaToken = request.headers.get('x-captcha-token');
  let response: Response;
  try {
    response = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(idempotencyKey !== null ? { 'idempotency-key': idempotencyKey } : {}),
        ...(captchaToken !== null ? { 'x-captcha-token': captchaToken } : {}),
      },
      body: JSON.stringify({ name: body.name, phone: body.phone, company: body.company }),
    });
  } catch {
    return NextResponse.json({ message: 'Сервис недоступен, попробуйте позже' }, { status: 502 });
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json(payload, { status: response.status });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
