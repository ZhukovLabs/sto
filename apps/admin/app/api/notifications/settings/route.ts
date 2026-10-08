import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  apiGetNotificationSettings,
  apiUpdateNotificationSettings,
  isNotificationChannel,
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
  const body = (await request.json().catch(() => null)) as { channelOrder?: unknown } | null;
  if (
    body === null ||
    !Array.isArray(body.channelOrder) ||
    body.channelOrder.length === 0 ||
    !body.channelOrder.every(isNotificationChannel) ||
    new Set(body.channelOrder).size !== body.channelOrder.length
  ) {
    return NextResponse.json(
      { message: 'channelOrder — непустой список каналов без повторов' },
      { status: 400 },
    );
  }
  try {
    const settings = await apiUpdateNotificationSettings(token, {
      channelOrder: body.channelOrder,
    });
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не получилось сохранить настройки';
    return NextResponse.json({ message }, { status: 502 });
  }
}
