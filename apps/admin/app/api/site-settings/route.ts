import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiGetSiteSettings, apiUpdateSiteSettings } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const settings = await apiGetSiteSettings(token);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить настройки';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    phone?: unknown;
    address?: unknown;
    unp?: unknown;
    lat?: unknown;
    lon?: unknown;
  } | null;
  const patch: {
    phone?: string;
    address?: string;
    unp?: string;
    lat?: number | string;
    lon?: number | string;
  } = {};
  // Пустая строка у телефона/адреса/УНП — осознанный сброс, передаём как есть.
  for (const key of ['address', 'unp'] as const) {
    const value = body?.[key];
    if (typeof value === 'string') {
      patch[key] = value;
    }
  }
  if (typeof body?.phone === 'string') {
    patch.phone = body.phone;
  }
  for (const key of ['lat', 'lon'] as const) {
    const value = body?.[key];
    if (typeof value === 'number' || typeof value === 'string') {
      patch[key] = value;
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { message: 'Укажите телефон, адрес, УНП или координаты' },
      { status: 400 },
    );
  }
  try {
    await apiUpdateSiteSettings(token, patch);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось сохранить настройки';
    return NextResponse.json({ message }, { status });
  }
}
