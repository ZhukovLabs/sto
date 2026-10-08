import { BOOKING_SETTINGS } from './model/mocks';
import type {
  BookingDateOption,
  BookingRequest,
  BookingSettings,
  BookingSlot,
  CallbackRequest,
} from './model/types';

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** Имитация сетевой задержки, пока нет реального API. */
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const fromIso = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Настройки записи. Источник в будущем - админка; пока мок.
 */
export async function getBookingSettings(): Promise<BookingSettings> {
  return BOOKING_SETTINGS;
}

export function getBookingDates(settings: BookingSettings, now = new Date()): BookingDateOption[] {
  const dates: BookingDateOption[] = [];
  for (let offset = 0; offset < settings.horizonDays; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const iso = toIso(date);
    const override = settings.overrides[iso];
    const weekday = date.getDay();
    const isWorkday = settings.workDays.includes(weekday) && !override?.disabled;
    dates.push({
      iso,
      label: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
      weekdayLabel: WEEKDAYS[weekday],
      disabled: !isWorkday,
      note: override?.note,
    });
  }
  return dates;
}

export function getBookingSlots(
  settings: BookingSettings,
  iso: string,
  now = new Date(),
): BookingSlot[] {
  const override = settings.overrides[iso];
  const date = fromIso(iso);
  const isWorkday = settings.workDays.includes(date.getDay()) && !override?.disabled;
  if (!isWorkday) return [];

  const hours = override?.hours ?? settings.hours;
  const step = settings.slotStepMinutes;
  const slots: BookingSlot[] = [];
  for (let minutes = hours.from * 60; minutes + step <= hours.to * 60; minutes += step) {
    const hour = Math.floor(minutes / 60);
    const label = `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const isToday = iso === toIso(now);
    const tooLate = isToday && hour <= now.getHours();
    slots.push({ iso, label, disabled: tooLate });
  }
  return slots;
}

export async function submitCallbackRequest(args: {
  request: CallbackRequest;
  idempotencyKey: string;
}): Promise<void> {
  const response = await fetch('/api/callback-request', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': args.idempotencyKey },
    body: JSON.stringify({ name: args.request.name, phone: args.request.phone }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Не удалось отправить заявку');
  }
}

/** TODO: заменить на POST реального API, когда появится эндпоинт самозаписи. */
export async function submitBookingRequest(request: BookingRequest): Promise<void> {
  await delay();
  void request;
}
