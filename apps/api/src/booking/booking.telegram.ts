import { BOOKING_STATUS_LABELS, type BookingStatus } from './booking.settings';
import { prettyPhone, type InlineButton } from '../requests/telegram';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const WEEKDAY_LABELS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function formatScheduledAt(scheduledAt: Date): string {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Minsk',
  });
  return formatter.format(scheduledAt);
}

export function formatBookingMessage(
  booking: {
    name: string;
    phone: string;
    car: string | null;
    services: string[];
    comment: string | null;
    scheduledAt: Date;
  },
  status: BookingStatus,
): string {
  const lines = [
    '🗓 <b>Новая запись</b>',
    `Имя: ${escapeHtml(booking.name)}`,
    `Телефон: ${prettyPhone(booking.phone)}`,
  ];
  if (booking.car !== null) {
    lines.push(`Авто: ${escapeHtml(booking.car)}`);
  }
  if (booking.services.length > 0) {
    lines.push(`Услуги: ${booking.services.map(escapeHtml).join(', ')}`);
  }
  if (booking.comment !== null) {
    lines.push(`Комментарий: ${escapeHtml(booking.comment)}`);
  }
  lines.push(`Когда: ${formatScheduledAt(booking.scheduledAt)}`);
  if (status !== 'booked') {
    lines.push(`— ${BOOKING_STATUS_LABELS[status]}`);
  }
  return lines.join('\n');
}

export function keyboardsForBooking(status: BookingStatus, bookingId: string): InlineButton[][] {
  if (status === 'booked') {
    return [[{ text: 'Подтверждена', callback_data: `bkg:${bookingId}:confirmed` }]];
  }
  if (status === 'confirmed') {
    return [
      [
        { text: 'Заказ взят', callback_data: `bkg:${bookingId}:taken` },
        { text: 'Отменено', callback_data: `bkg:${bookingId}:cancelled` },
      ],
    ];
  }
  return [];
}

export const BOOKING_WEEKDAY_LABELS = WEEKDAY_LABELS;
