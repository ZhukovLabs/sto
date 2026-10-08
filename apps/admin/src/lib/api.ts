const API_URL = process.env.API_URL ?? 'http://localhost:3002';

export const SESSION_COOKIE = 'admin_session';
/** Маркер персистентной сессии («Запомнить меня»). */
export const REMEMBER_COOKIE = 'admin_remember';

export const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

export function sessionCookieOptions(persistent: boolean): {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number | undefined;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: persistent ? REMEMBER_MAX_AGE : undefined,
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `API недоступен (${response.status})`;
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message !== undefined && !Array.isArray(body.message)) {
      message = body.message;
    }
  } catch {
    // оставляем дефолтное сообщение
  }
  return new ApiError(response.status, message);
}

/** Читает ошибку прокси-роута панели и превращает в Error с сообщением API. */
export async function readProxyError(response: Response, fallback: string): Promise<Error> {
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  return new Error(body.message ?? fallback);
}

export interface LoginSuccess {
  token: string;
  expiresAt: number;
  user: { id: string; email: string; name: string; role: string };
}

export async function apiLogin(email: string, password: string): Promise<LoginSuccess> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as LoginSuccess;
}

export async function apiMe(token: string): Promise<LoginSuccess['user'] | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as LoginSuccess['user'];
}

export async function apiRefresh(token: string): Promise<{ token: string } | null> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as { token: string };
}

export const REQUEST_STATUSES = ['new', 'called', 'taken', 'cancelled'] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Новая',
  called: 'Перезвонили',
  taken: 'Заказ взят',
  cancelled: 'Отменена',
};

export function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === 'string' && (REQUEST_STATUSES as readonly string[]).includes(value);
}

export interface RequestRow {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
}

export async function apiListRequests(token: string): Promise<RequestRow[]> {
  const response = await fetch(`${API_URL}/requests`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as RequestRow[];
}

export async function apiCountNewRequests(token: string): Promise<number> {
  const response = await fetch(`${API_URL}/requests/count-new`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  const body = (await response.json()) as { count: number };
  return body.count;
}

export async function apiUpdateRequestStatus(
  token: string,
  id: string,
  status: RequestStatus,
): Promise<{ status: RequestStatus }> {
  const response = await fetch(`${API_URL}/requests/${id}/status`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { status: RequestStatus };
}

export interface MasterRow {
  id: string;
  name: string;
  telegramChatId: string;
  isActive: boolean;
  createdAt: string;
}

export async function apiListMasters(token: string): Promise<MasterRow[]> {
  const response = await fetch(`${API_URL}/masters`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as MasterRow[];
}

export async function apiCreateMaster(
  token: string,
  master: { name: string; telegramChatId: string },
): Promise<{ id: string }> {
  const response = await fetch(`${API_URL}/masters`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(master),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { id: string };
}

export async function apiUpdateMaster(
  token: string,
  id: string,
  patch: { name?: string; isActive?: boolean },
): Promise<{ id: string }> {
  const response = await fetch(`${API_URL}/masters/${id}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { id: string };
}

export async function apiDeleteMaster(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/masters/${id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 404) {
    throw await parseError(response);
  }
}

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

export interface BookingRow {
  id: string;
  name: string;
  phone: string;
  car: string | null;
  services: string[];
  comment: string | null;
  scheduledAt: string;
  status: string;
  createdAt: string;
}

export async function apiListBookings(token: string): Promise<BookingRow[]> {
  const response = await fetch(`${API_URL}/bookings`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as BookingRow[];
}

export async function apiCountUnconfirmedBookings(token: string): Promise<number> {
  const response = await fetch(`${API_URL}/bookings/count-unconfirmed`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  const body = (await response.json()) as { count: number };
  return body.count;
}

export async function apiUpdateBookingStatus(
  token: string,
  id: string,
  status: BookingStatus,
): Promise<{ status: BookingStatus }> {
  const response = await fetch(`${API_URL}/bookings/${id}/status`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { status: BookingStatus };
}

export interface DayWindow {
  enabled: boolean;
  from: string;
  to: string;
}

export type ScheduleMap = Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', DayWindow>;

export interface ExceptionWindow {
  enabled: boolean;
  from?: string;
  to?: string;
}

export type ExceptionsMap = Record<string, ExceptionWindow>;

export interface BookingSettings {
  slotStepMinutes: number;
  horizonDays: number;
  capacity: number;
  schedule: ScheduleMap;
  exceptions: ExceptionsMap;
}

export async function apiGetBookingSettings(token: string): Promise<BookingSettings> {
  const response = await fetch(`${API_URL}/booking-settings`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as BookingSettings;
}

export async function apiUpdateBookingSettings(
  token: string,
  patch: Partial<Omit<BookingSettings, 'schedule' | 'exceptions'>> & {
    schedule?: ScheduleMap;
    exceptions?: ExceptionsMap;
  },
): Promise<BookingSettings> {
  const response = await fetch(`${API_URL}/booking-settings`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as BookingSettings;
}

// --- Уведомления ---

export const NOTIFICATION_CHANNELS = ['telegram', 'viber', 'sms'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export function isNotificationChannel(value: unknown): value is NotificationChannel {
  return typeof value === 'string' && (NOTIFICATION_CHANNELS as readonly string[]).includes(value);
}

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  telegram: 'Telegram-личка',
  viber: 'Viber',
  sms: 'SMS',
};

export interface NotificationSettings {
  channelOrder: NotificationChannel[];
}

export interface SmsBalance {
  available: boolean;
  balance?: string;
  error?: string;
}

export interface ChannelsPrice {
  telegram: string | null;
  viber: string | null;
  sms: string | null;
}

export async function apiGetNotificationSettings(token: string): Promise<NotificationSettings> {
  const response = await fetch(`${API_URL}/notifications/settings`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as NotificationSettings;
}

export async function apiUpdateNotificationSettings(
  token: string,
  patch: NotificationSettings,
): Promise<NotificationSettings> {
  const response = await fetch(`${API_URL}/notifications/settings`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as NotificationSettings;
}

export async function apiGetSmsBalance(token: string): Promise<SmsBalance> {
  const response = await fetch(`${API_URL}/notifications/balance`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as SmsBalance;
}

export async function apiGetChannelsPrice(token: string): Promise<ChannelsPrice> {
  const response = await fetch(`${API_URL}/notifications/channels-price`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as ChannelsPrice;
}

export interface PaidBudget {
  limit: number;
  used: number;
  exhausted: boolean;
  day: string;
}

export async function apiGetPaidBudget(token: string): Promise<PaidBudget> {
  const response = await fetch(`${API_URL}/notifications/budget`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as PaidBudget;
}
