import { postWithAntiAbuse } from '@/shared/lib/anti-abuse';
import type {
  BookingDateOption,
  BookingRequest,
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

interface ApiDateView {
  date: string;
  disabled: boolean;
}

interface ApiSlotView {
  time: string;
  available: boolean;
}

async function readError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  throw new Error(body.message ?? fallback);
}

/** Доступные дни для записи (с учётом режима работы и занятости). */
export async function getBookingDates(): Promise<BookingDateOption[]> {
  const response = await fetch('/api/booking/dates', { cache: 'no-store' });
  if (!response.ok) {
    await readError(response, 'Не удалось загрузить доступные дни');
  }
  const views = (await response.json()) as ApiDateView[];
  return views.map((view) => {
    const [year, month, day] = view.date.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return {
      iso: view.date,
      label: `${day} ${MONTHS[month - 1]}`,
      weekdayLabel: WEEKDAYS[weekday],
      disabled: view.disabled,
    };
  });
}

/** Слоты конкретного дня с признаком доступности. */
export async function getBookingSlots(iso: string): Promise<BookingSlot[]> {
  const response = await fetch(`/api/booking/slots?date=${encodeURIComponent(iso)}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    await readError(response, 'Не удалось загрузить свободное время');
  }
  const views = (await response.json()) as ApiSlotView[];
  return views.map((view) => ({ label: view.time, disabled: !view.available }));
}

export async function submitCallbackRequest(args: {
  request: CallbackRequest;
  idempotencyKey: string;
  captchaToken?: string | null;
}): Promise<void> {
  const response = await postWithAntiAbuse(
    '/api/callback-request',
    {
      name: args.request.name,
      phone: args.request.phone,
      ...(args.request.comment === undefined ? {} : { comment: args.request.comment }),
      ...(args.request.company === undefined ? {} : { company: args.request.company }),
    },
    args.idempotencyKey,
    args.captchaToken,
  );
  if (!response.ok) {
    await readError(response, 'Не удалось отправить заявку');
  }
}

export async function submitBookingRequest(args: {
  request: BookingRequest;
  captchaToken?: string | null;
}): Promise<void> {
  const idempotencyKey = args.request.idempotencyKey ?? crypto.randomUUID();
  const response = await postWithAntiAbuse(
    '/api/booking',
    {
      name: args.request.name,
      phone: args.request.phone,
      ...(args.request.car === undefined ? {} : { car: args.request.car }),
      ...(args.request.services === undefined ? {} : { services: args.request.services }),
      ...(args.request.comment === undefined ? {} : { comment: args.request.comment }),
      ...(args.request.company === undefined ? {} : { company: args.request.company }),
      date: args.request.date,
      time: args.request.time,
    },
    idempotencyKey,
    args.captchaToken,
  );
  if (!response.ok) {
    await readError(response, 'Не удалось создать запись');
  }
}
