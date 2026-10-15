import { API_URL } from '@/shared/config/api';
import { site } from '@/shared/config/site';
import { prettyPhoneValue } from './model/phone';
import { formatSiteHours } from './model/hours';
import type { SiteHoursData, SiteInfo } from './model/types';

/** Фолбэк из статики — пока api недоступен, телефон не задан или дни выключены. */
export const SITE_INFO_FALLBACK: SiteInfo = {
  phone: { value: site.phones[0].value, pretty: site.phones[0].pretty },
  hours: { label: site.hours.label, short: site.hours.short, note: site.hours.note },
  address: { value: site.address, isSet: false },
  unp: site.unp,
  telegram: site.telegram,
  viber: { value: site.viber, pretty: prettyPhoneValue(site.viber) },
  bookingOnline: true,
  coords: null,
};

/**
 * Публичные данные сайта из админки: телефон и адрес (раздел «Контакты»)
 * и часы работы (медианы расписания «Настроек записи»).
 * Кэшируется с тегом site-settings — сбрасывается вебхуком /api/revalidate.
 */
export async function getSiteInfo(): Promise<SiteInfo> {
  try {
    const response = await fetch(`${API_URL}/site-settings`, {
      next: { tags: ['site-settings'], revalidate: 3600 },
    });
    if (!response.ok) {
      return SITE_INFO_FALLBACK;
    }
    const body = (await response.json()) as {
      phone: string | null;
      address: string | null;
      unp: string | null;
      telegram: string | null;
      viber: string | null;
      lat: number | null;
      lon: number | null;
      bookingOnline?: boolean;
      hours: SiteHoursData | null;
    };
    return {
      phone:
        body.phone !== null && body.phone.trim() !== ''
          ? { value: body.phone, pretty: prettyPhoneValue(body.phone) }
          : SITE_INFO_FALLBACK.phone,
      hours: body.hours !== null ? formatSiteHours(body.hours) : SITE_INFO_FALLBACK.hours,
      address:
        body.address !== null && body.address.trim() !== ''
          ? { value: body.address, isSet: true }
          : SITE_INFO_FALLBACK.address,
      unp: body.unp !== null && body.unp.trim() !== '' ? body.unp : SITE_INFO_FALLBACK.unp,
      telegram:
        body.telegram !== null && body.telegram.trim() !== ''
          ? body.telegram
          : SITE_INFO_FALLBACK.telegram,
      viber:
        body.viber !== null && body.viber.trim() !== ''
          ? { value: body.viber, pretty: prettyPhoneValue(body.viber) }
          : SITE_INFO_FALLBACK.viber,
      bookingOnline: body.bookingOnline !== false,
      coords:
        typeof body.lat === 'number' && typeof body.lon === 'number'
          ? { lat: body.lat, lon: body.lon }
          : null,
    };
  } catch {
    return SITE_INFO_FALLBACK;
  }
}
