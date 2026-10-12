import {
  BOOKING_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  type BookingStatus,
  type RequestStatus,
} from '@/lib/api';
import type { BadgeVariant } from '@sto/ui';

export interface InboxRow {
  kind: 'callback' | 'booking';
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
  scheduledAt: string | null;
  car: string | null;
  services: string[];
  comment: string | null;
}

export function prettyPhone(phone: string): string {
  const match = phone.match(/^(\+?375)(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return match === null ? phone : `+375 ${match[2]} ${match[3]}-${match[4]}-${match[5]}`;
}

const createdFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCreatedAt(iso: string): string {
  return createdFormatter.format(new Date(iso)).replace(',', '');
}

export interface RowAction {
  label: string;
  status: string;
}

/**
 * Кнопки действий — точная копия inline-клавиатур Telegram-бота
 * (apps/api/src/requests/telegram.ts keyboardsFor, booking.telegram.ts keyboardsForBooking).
 */
export function actionsFor(row: InboxRow): RowAction[] {
  if (row.kind === 'callback') {
    if (row.status === 'new') {
      return [{ label: 'Перезвонил', status: 'called' }];
    }
    if (row.status === 'called') {
      return [
        { label: 'Заказ взят', status: 'taken' },
        { label: 'Отменено', status: 'cancelled' },
      ];
    }
    return [];
  }
  if (row.status === 'booked') {
    return [{ label: 'Подтверждена', status: 'confirmed' }];
  }
  if (row.status === 'confirmed') {
    return [
      { label: 'Заказ взят', status: 'taken' },
      { label: 'Отменено', status: 'cancelled' },
    ];
  }
  return [];
}

/**
 * Откат статуса — только для админки (в Telegram такого нет):
 * взят/отменён → на шаг назад по цепочке.
 */
export function returnAction(row: InboxRow): RowAction | null {
  if (row.status !== 'taken' && row.status !== 'cancelled') {
    return null;
  }
  return {
    label: 'Вернуть',
    status: row.kind === 'callback' ? 'called' : 'confirmed',
  };
}

export function statusLabel(row: InboxRow): string {
  if (row.kind === 'callback') {
    return row.status in REQUEST_STATUS_LABELS
      ? REQUEST_STATUS_LABELS[row.status as RequestStatus]
      : row.status;
  }
  if (row.status === 'booked') {
    return 'Ждёт подтверждения';
  }
  return row.status in BOOKING_STATUS_LABELS
    ? BOOKING_STATUS_LABELS[row.status as BookingStatus]
    : row.status;
}

export function badgeVariantFor(status: string): BadgeVariant {
  switch (status) {
    case 'new':
    case 'booked':
      return 'accent-soft';
    case 'taken':
      return 'success';
    default:
      return 'neutral';
  }
}
