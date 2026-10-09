import { NextResponse, type NextRequest } from 'next/server';
import { API_URL } from '@/shared/config/api';

const PROXIED_STATUSES = new Set([400, 409, 428, 429]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
  }
  const idempotencyKey = request.headers.get('idempotency-key');
  const captchaToken = request.headers.get('x-captcha-token');
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(idempotencyKey !== null ? { 'idempotency-key': idempotencyKey } : {}),
      ...(captchaToken !== null ? { 'x-captcha-token': captchaToken } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    return NextResponse.json(
      { message: payload.message ?? 'Не удалось создать запись' },
      { status: PROXIED_STATUSES.has(response.status) ? response.status : 502 },
    );
  }
  return NextResponse.json(payload, { status: 201 });
}
