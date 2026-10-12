import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  apiGetNotificationSettings,
  apiUpdateNotificationSettings,
  isNotificationChannel,
  type NotificationChannel,
} from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const settings = await apiGetNotificationSettings(token);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не получилось загрузить настройки';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    channelOrder?: unknown;
    enabled?: unknown;
  } | null;
  const validList = (value: unknown): value is NotificationChannel[] =>
    Array.isArray(value) &&
    value.every(isNotificationChannel) &&
    new Set(value).size === value.length;
  if (body === null || !validList(body.channelOrder) || !validList(body.enabled)) {
    return NextResponse.json(
      { message: 'channelOrder/enabled — списки каналов без повторов' },
      { status: 400 },
    );
  }
  if (body.enabled.length === 0) {
    return NextResponse.json({ message: 'Оставьте хотя бы один активный канал' }, { status: 400 });
  }
  try {
    const settings = await apiUpdateNotificationSettings(token, {
      channelOrder: body.channelOrder,
      enabled: body.enabled,
    });
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не получилось сохранить настройки';
    return NextResponse.json({ message }, { status: 502 });
  }
}
