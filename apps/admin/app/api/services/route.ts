import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiCreateService, apiListServices } from '@/lib/api';
import { readServiceInput } from './validation';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const catalog = await apiListServices(token);
    return NextResponse.json(catalog);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить услуги';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  const parsed = readServiceInput(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }
  try {
    const service = await apiCreateService(
      token,
      parsed.input as Parameters<typeof apiCreateService>[1],
    );
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось создать услугу';
    return NextResponse.json({ message }, { status });
  }
}
