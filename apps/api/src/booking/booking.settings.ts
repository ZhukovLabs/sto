export const BOOKING_STATUSES = ['booked', 'confirmed', 'taken', 'cancelled'] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  booked: 'Записан',
  confirmed: 'Подтверждена',
  taken: 'Заказ взят',
  cancelled: 'Отменена',
};

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === 'string' && (BOOKING_STATUSES as readonly string[]).includes(value);
}

/** Беларусь: фиксированное смещение +03:00, перехода на летнее время нет. */
const MINSK_OFFSET = '+03:00';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number];

export interface DayWindow {
  enabled: boolean;
  from: string;
  to: string;
}

export type ScheduleMap = Record<WeekdayKey, DayWindow>;

export interface ExceptionWindow {
  enabled: boolean;
  from?: string;
  to?: string;
  /** Заблокированные вручную слоты HH:MM внутри рабочего окна (только для включённых дней). */
  blockedTimes?: string[];
}

/** Ключ — дата в формате YYYY-MM-DD (минского времени). */
export type ExceptionsMap = Record<string, ExceptionWindow>;

export interface BookingSettingsData {
  slotStepMinutes: number;
  horizonDays: number;
  capacity: number;
  schedule: ScheduleMap;
  exceptions: ExceptionsMap;
}

const DEFAULT_WINDOW: DayWindow = { enabled: false, from: '09:00', to: '20:00' };

export const DEFAULT_SCHEDULE: ScheduleMap = {
  mon: { enabled: true, from: '09:00', to: '20:00' },
  tue: { enabled: true, from: '09:00', to: '20:00' },
  wed: { enabled: true, from: '09:00', to: '20:00' },
  thu: { enabled: true, from: '09:00', to: '20:00' },
  fri: { enabled: true, from: '09:00', to: '20:00' },
  sat: { enabled: true, from: '09:00', to: '20:00' },
  sun: DEFAULT_WINDOW,
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12) {
    return false;
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

/** Момент начала минских суток для даты YYYY-MM-DD. */
export function minskDayStart(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00${MINSK_OFFSET}`);
}

/** Ключ дня недели для даты YYYY-MM-DD (полночь UTC — только чтобы узнать день недели самой даты). */
export function weekdayKeyFor(dateIso: string): WeekdayKey {
  return WEEKDAYS[new Date(`${dateIso}T00:00:00Z`).getUTCDay()];
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export interface SlotWindow {
  fromMinutes: number;
  toMinutes: number;
}

/** Окно работы на дату: исключение по дате перекрывает недельное расписание. */
export function windowForDate(
  dateIso: string,
  settings: Pick<BookingSettingsData, 'schedule' | 'exceptions'>,
): { enabled: boolean; from: string; to: string } {
  const exception = settings.exceptions[dateIso];
  if (exception !== undefined) {
    return {
      enabled: exception.enabled,
      from: exception.from ?? '09:00',
      to: exception.to ?? '20:00',
    };
  }
  const day = settings.schedule[weekdayKeyFor(dateIso)];
  if (day === undefined) {
    return { enabled: false, from: '09:00', to: '20:00' };
  }
  return { enabled: day.enabled, from: day.from, to: day.to };
}

/** Начала слотов дня в минутах от полуночи. */
export function slotStarts(window: { from: string; to: string }, stepMinutes: number): number[] {
  const starts: number[] = [];
  const from = timeToMinutes(window.from);
  const to = timeToMinutes(window.to);
  const step = Math.max(15, stepMinutes);
  for (let start = from; start + step <= to; start += step) {
    starts.push(start);
  }
  return starts;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function timeToMinutesPublic(value: string): number {
  return timeToMinutes(value);
}

/** Момент слота: дата YYYY-MM-DD + минуты от полуночи минского времени. */
export function slotMoment(dateIso: string, minutesFromMidnight: number): Date {
  return new Date(minskDayStart(dateIso).getTime() + minutesFromMidnight * 60 * 1000);
}

/** Текущая дата YYYY-MM-DD по минскому времени. */
export function todayIsoMinsk(now: Date = new Date()): string {
  return new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Убирает исключения по прошедшим датам (< todayIso по Минску); сегодняшний день остаётся. */
export function pruneExceptions(exceptions: ExceptionsMap, todayIso: string): ExceptionsMap {
  const pruned: ExceptionsMap = {};
  for (const [date, window] of Object.entries(exceptions)) {
    if (isValidDate(date) && date < todayIso) {
      continue;
    }
    pruned[date] = window;
  }
  return pruned;
}

/** Заблокированные вручную слоты даты в минутах от полуночи. */
export function blockedMinutesFor(
  dateIso: string,
  settings: Pick<BookingSettingsData, 'exceptions'>,
): Set<number> {
  const exception = settings.exceptions[dateIso];
  if (exception?.enabled !== true || exception.blockedTimes === undefined) {
    return new Set();
  }
  return new Set(exception.blockedTimes.map(timeToMinutes));
}
