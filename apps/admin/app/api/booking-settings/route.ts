import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, apiGetBookingSettings, apiUpdateBookingSettings } from '@/lib/api';

const TIME_PATTERN = /^\d{2}:\d{2}$/;
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type PatchResult = { ok: true; input: Record<string, unknown> } | { ok: false; message: string };

/** Структура PUT настроек записи: формула и окна времени проверяются до API,
 * чтобы автосейв не мог отправить невалидное состояние. */
function readSettingsInput(body: Record<string, unknown>): PatchResult {
  const { slotStepMinutes, horizonDays, capacity, onlineDisabled, schedule, exceptions } = body;
  if (
    !Number.isInteger(slotStepMinutes) ||
    (slotStepMinutes as number) < 10 ||
    (slotStepMinutes as number) > 240
  ) {
    return { ok: false, message: 'Шаг слота: целое число 10–240 минут' };
  }
  if (
    !Number.isInteger(horizonDays) ||
    (horizonDays as number) < 1 ||
    (horizonDays as number) > 60
  ) {
    return { ok: false, message: 'Горизонт записи: целое число 1–60 дней' };
  }
  if (!Number.isInteger(capacity) || (capacity as number) < 1 || (capacity as number) > 10) {
    return { ok: false, message: 'Одновременных записей: целое число 1–10' };
  }
  if (typeof onlineDisabled !== 'boolean') {
    return { ok: false, message: 'onlineDisabled должен быть boolean' };
  }
  if (typeof schedule !== 'object' || schedule === null) {
    return { ok: false, message: 'schedule обязателен' };
  }
  for (const [key, day] of Object.entries(schedule as Record<string, unknown>)) {
    if (!DAY_KEYS.includes(key as (typeof DAY_KEYS)[number])) {
      return { ok: false, message: `Неизвестный день недели: ${key}` };
    }
    if (typeof day !== 'object' || day === null) {
      return { ok: false, message: `День ${key}: некорректное окно` };
    }
    const { enabled, from, to } = day as Record<string, unknown>;
    if (typeof enabled !== 'boolean') {
      return { ok: false, message: `День ${key}: enabled должен быть boolean` };
    }
    if (
      enabled &&
      (typeof from !== 'string' ||
        typeof to !== 'string' ||
        !TIME_PATTERN.test(from) ||
        !TIME_PATTERN.test(to) ||
        from >= to)
    ) {
      return { ok: false, message: `День ${key}: часы вида 09:00, начало раньше конца` };
    }
  }
  if (typeof exceptions !== 'object' || exceptions === null) {
    return { ok: false, message: 'exceptions обязателен' };
  }
  for (const [date, exception] of Object.entries(exceptions as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { ok: false, message: `Исключение: дата вида ГГГГ-ММ-ДД (${date})` };
    }
    if (typeof exception !== 'object' || exception === null) {
      return { ok: false, message: `Исключение ${date}: некорректное окно` };
    }
    const { enabled, from, to, blockedTimes } = exception as Record<string, unknown>;
    if (typeof enabled !== 'boolean') {
      return { ok: false, message: `Исключение ${date}: enabled должен быть boolean` };
    }
    if (
      enabled &&
      (typeof from !== 'string' ||
        typeof to !== 'string' ||
        !TIME_PATTERN.test(from) ||
        !TIME_PATTERN.test(to) ||
        from >= to)
    ) {
      return { ok: false, message: `Исключение ${date}: часы вида 09:00, начало раньше конца` };
    }
    if (
      blockedTimes !== undefined &&
      (!Array.isArray(blockedTimes) ||
        blockedTimes.some((time) => typeof time !== 'string' || !TIME_PATTERN.test(time)))
    ) {
      return { ok: false, message: `Исключение ${date}: заблокированные слоты вида 09:00` };
    }
  }
  return {
    ok: true,
    input: { slotStepMinutes, horizonDays, capacity, onlineDisabled, schedule, exceptions },
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const settings = await apiGetBookingSettings(token);
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
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
  }
  const parsed = readSettingsInput(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }
  try {
    const settings = await apiUpdateBookingSettings(
      token,
      parsed.input as Parameters<typeof apiUpdateBookingSettings>[1],
    );
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить настройки';
    return NextResponse.json({ message }, { status: 502 });
  }
}
