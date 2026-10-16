import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import { scheduleSummary, type ScheduleSummary } from '../booking/booking.settings';
import { PrismaService } from '../prisma/prisma.service';
import { notifyWebRevalidate } from '../web-revalidate';

const SETTINGS_ID = 'site';
const DIGITS_MIN = 9;
const DIGITS_MAX = 15;
const ADDRESS_MIN = 2;
const ADDRESS_MAX = 200;

/**
 * Чистит ввод телефона и приводит к каноническому виду +XXXXXXXXX.
 * Белорусская национальная запись «8 0XX…» конвертируется в 375….
 * Возвращает null, если цифр меньше 9 или больше 15.
 */
export function parsePublicPhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('80') && digits.length === 11) {
    digits = `375${digits.slice(2)}`;
  }
  if (digits.length < DIGITS_MIN || digits.length > DIGITS_MAX) {
    return null;
  }
  return `+${digits}`;
}

/**
 * Обрезает пробелы и возвращает адрес; пустая строка → null (сброс, сайт
 * покажет фолбэк). Кидает BadRequest при длине вне 2–200.
 */
export function normalizeSiteAddress(input: string): string | null {
  const address = input.trim();
  if (address.length === 0) {
    return null;
  }
  if (address.length < ADDRESS_MIN || address.length > ADDRESS_MAX) {
    throw new BadRequestException('Адрес: от 2 до 200 символов (пусто — сбросить)');
  }
  return address;
}

/**
 * Валидирует УНП: 9 цифр (пробелы/дефисы игнорируются).
 * Пустая строка → null (сброс, сайт покажет фолбэк из статики).
 */
export function normalizeSiteUnp(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (input.trim() === '' && digits === '') {
    return null;
  }
  if (digits.length !== 9) {
    throw new BadRequestException('УНП: 9 цифр (пусто — сбросить)');
  }
  return digits;
}

/**
 * Telegram-аккаунт для кнопки на сайте: username без @ либо с @,
 * сохраняем канонически с @. Пустая строка → null (сброс на фолбэк).
 */
export function normalizeSiteTelegram(input: string): string | null {
  const username = input.trim().replace(/^@+/, '');
  if (username === '') {
    return null;
  }
  if (!/^[A-Za-z0-9_]{4,32}$/.test(username)) {
    throw new BadRequestException('Telegram: username 4–32 знака (латиница, цифры, _)');
  }
  return `@${username}`;
}

/**
 * Валидирует пару координат из запроса: число или строка ('' — сброс).
 * Возвращает null, если поле не передано; [null, null] при сбросе.
 */
export function parseCoord(
  value: unknown,
  label: string,
  bounds: { min: number; max: number },
): number | null | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  // Сначала тип, потом коерсия: Number([]) === 0 и прочие сюрпризы не проходят.
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new BadRequestException(`${label} должен быть числом`);
  }
  const num = typeof value === 'number' ? value : Number(value.trim());
  if (!Number.isFinite(num) || num < bounds.min || num > bounds.max) {
    throw new BadRequestException(`${label}: число от ${bounds.min} до ${bounds.max}`);
  }
  return num;
}

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly booking: BookingService,
  ) {}

  async get(): Promise<{
    phone: string | null;
    address: string | null;
    unp: string | null;
    telegram: string | null;
    viber: string | null;
    lat: number | null;
    lon: number | null;
    bookingOnline: boolean;
    hours: ScheduleSummary | null;
  }> {
    const [row, bookingSettings] = await Promise.all([
      this.prisma.siteSettings.findUnique({
        where: { id: SETTINGS_ID },
        select: {
          phone: true,
          address: true,
          unp: true,
          telegram: true,
          viber: true,
          lat: true,
          lon: true,
        },
      }),
      this.booking.getSettings(),
    ]);
    return {
      phone: row?.phone ?? null,
      address: row?.address ?? null,
      unp: row?.unp ?? null,
      telegram: row?.telegram ?? null,
      viber: row?.viber ?? null,
      lat: row?.lat ?? null,
      lon: row?.lon ?? null,
      bookingOnline: !bookingSettings.onlineDisabled,
      hours: scheduleSummary(bookingSettings.schedule),
    };
  }

  async update(patch: {
    phone?: unknown;
    address?: unknown;
    unp?: unknown;
    telegram?: unknown;
    viber?: unknown;
    lat?: unknown;
    lon?: unknown;
  }): Promise<void> {
    const data: {
      phone?: string | null;
      address?: string | null;
      unp?: string | null;
      telegram?: string | null;
      viber?: string | null;
      lat?: number | null;
      lon?: number | null;
    } = {};
    if (patch.phone !== undefined) {
      if (typeof patch.phone !== 'string') {
        throw new BadRequestException('phone должен быть строкой');
      }
      if (patch.phone.trim() === '') {
        // Пустое поле - осознанный сброс: сайт покажет фолбэк-контакт.
        data.phone = null;
      } else {
        const phone = parsePublicPhone(patch.phone);
        if (phone === null) {
          throw new BadRequestException('Телефон: 9–15 цифр, например +375 29 000-00-00');
        }
        data.phone = phone;
      }
    }
    if (patch.address !== undefined) {
      if (typeof patch.address !== 'string') {
        throw new BadRequestException('address должен быть строкой');
      }
      data.address = normalizeSiteAddress(patch.address);
    }
    if (patch.unp !== undefined) {
      if (typeof patch.unp !== 'string') {
        throw new BadRequestException('unp должен быть строкой');
      }
      data.unp = normalizeSiteUnp(patch.unp);
    }
    if (patch.telegram !== undefined) {
      if (typeof patch.telegram !== 'string') {
        throw new BadRequestException('telegram должен быть строкой');
      }
      data.telegram = normalizeSiteTelegram(patch.telegram);
    }
    if (patch.viber !== undefined) {
      if (typeof patch.viber !== 'string') {
        throw new BadRequestException('viber должен быть строкой');
      }
      if (patch.viber.trim() === '') {
        // Пустое поле — осознанный сброс: сайт покажет фолбэк.
        data.viber = null;
      } else {
        const viber = parsePublicPhone(patch.viber);
        if (viber === null) {
          throw new BadRequestException('Viber: 9–15 цифр, например +375 29 000-00-00');
        }
        data.viber = viber;
      }
    }
    const lat = parseCoord(patch.lat, 'Широта', { min: -90, max: 90 });
    const lon = parseCoord(patch.lon, 'Долгота', { min: -180, max: 180 });
    if (lat !== undefined) {
      data.lat = lat;
    }
    if (lon !== undefined) {
      data.lon = lon;
    }
    // Координаты имеют смысл только парой: половинчатая передача - ошибка.
    const latProvided = lat !== undefined;
    const lonProvided = lon !== undefined;
    if (latProvided !== lonProvided) {
      throw new BadRequestException('Широта и долгота задаются вместе');
    }
    if ((data.lat === null) !== (data.lon === null)) {
      throw new BadRequestException('Широта и долгота сбрасываются вместе');
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Нечего обновлять: укажите phone, Telegram, Viber, address, УНП или координаты',
      );
    }
    await this.prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });
    this.logger.log(`Настройки сайта обновлены: ${Object.keys(data).join(', ')}`);
    notifyWebRevalidate();
  }
}
