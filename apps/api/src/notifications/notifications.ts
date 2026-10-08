export const CHANNELS = ['telegram', 'viber', 'sms'] as const;

export type Channel = (typeof CHANNELS)[number];

export const DEFAULT_CHANNEL_ORDER: Channel[] = ['telegram', 'viber', 'sms'];

/**
 * Текст для расчёта цены Viber: под общим sender SMSC шлюз считает стоимость
 * только предодобренных шаблонов. Цена от текста не зависит.
 */
export const VIBER_PRICE_PROBE = 'Тест';

export interface NotificationSettingsView {
  channelOrder: Channel[];
}

export interface SmsBalanceView {
  available: boolean;
  balance?: string;
  error?: string;
}

export interface ChannelsPriceView {
  telegram: string | null;
  viber: string | null;
  sms: string | null;
}

export function formatCallbackConfirmation(): string {
  return 'Заявку получили — перезвоним в течение часа. СТО «ПроМакс», Гомель';
}

export function formatBookingConfirmation(scheduledAt: Date): string {
  const when = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Minsk',
  }).format(scheduledAt);
  return `Вы записаны на ${when}. Если планы изменятся — позвоните нам. СТО «ПроМакс»`;
}
