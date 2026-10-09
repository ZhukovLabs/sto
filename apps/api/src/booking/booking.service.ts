import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { publicCreateRateLimiter } from '../auth/rate-limiter';
import { loadEnv } from '../env';
import { normalizeBelarusPhone } from '../phones';
import { formatBookingConfirmation, NotificationService } from '../notifications';
import {
  broadcastToMasters,
  compactMessages,
  isTelegramEnabled,
  loadActiveMasterChats,
  type InlineButton,
  type RequestMessageRef,
  type TelegramConfig,
} from '../requests/telegram';
import {
  BOOKING_STATUSES,
  DEFAULT_SCHEDULE,
  isValidDate,
  isValidTime,
  isBookingStatus,
  blockedMinutesFor,
  minutesToTime,
  pruneExceptions,
  slotMoment,
  slotStarts,
  timeToMinutesPublic,
  todayIsoMinsk,
  windowForDate,
  type BookingStatus,
  type BookingSettingsData,
  type ScheduleMap,
  type ExceptionsMap,
} from './booking.settings';
import type { Prisma } from '../generated/prisma/client';
import { NAME_PATTERN, PHONE_PATTERN, IDEMPOTENCY_KEY_PATTERN } from '../public-forms';
import { isPrismaErrorCode } from '../prisma-errors';
import { formatBookingMessage, keyboardsForBooking } from './booking.telegram';

const DUPLICATE = Symbol('duplicate');
const ACTIVE_STATUSES: BookingStatus[] = ['booked', 'confirmed'];
const SETTINGS_ID = 'singleton';

export interface BookingSlotView {
  time: string;
  available: boolean;
}

export interface BookingDateView {
  date: string;
  disabled: boolean;
}

export type DayOverviewSlotStatus = 'free' | 'booked' | 'blocked';

export interface DayOverviewSlotView {
  time: string;
  status: DayOverviewSlotStatus;
  past: boolean;
  bookingNames: string[];
}

export interface DayOverviewView {
  date: string;
  enabled: boolean;
  from?: string;
  to?: string;
  slots: DayOverviewSlotView[];
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly telegram: TelegramConfig | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {
    const env = loadEnv();
    this.telegram =
      env.TELEGRAM_BOT_TOKEN !== undefined ? { botToken: env.TELEGRAM_BOT_TOKEN } : null;
  }

  get telegramConfig(): TelegramConfig | null {
    return this.telegram;
  }

  async getSettings(): Promise<BookingSettingsData> {
    const row = await this.prisma.bookingSettings
      .findUnique({ where: { id: SETTINGS_ID } })
      .catch((error: unknown): null => {
        this.logger.error(`Не прочитались настройки записи: ${String(error)}`);
        return null;
      });
    if (row === null) {
      return {
        slotStepMinutes: 60,
        horizonDays: 14,
        capacity: 1,
        schedule: DEFAULT_SCHEDULE,
        exceptions: {},
      };
    }
    const exceptions = row.exceptions as unknown as ExceptionsMap;
    const pruned = pruneExceptions(exceptions, todayIsoMinsk());
    if (Object.keys(pruned).length !== Object.keys(exceptions).length) {
      await this.prisma.bookingSettings
        .update({ where: { id: SETTINGS_ID }, data: { exceptions: toJsonInput(pruned) } })
        .catch((error: unknown): null => {
          this.logger.warn(`Не почистились прошедшие исключения: ${String(error)}`);
          return null;
        });
    }
    return {
      slotStepMinutes: row.slotStepMinutes,
      horizonDays: row.horizonDays,
      capacity: row.capacity,
      schedule: row.schedule as unknown as ScheduleMap,
      exceptions: pruned,
    };
  }

  async updateSettings(patch: {
    slotStepMinutes?: unknown;
    horizonDays?: unknown;
    capacity?: unknown;
    schedule?: unknown;
    exceptions?: unknown;
  }): Promise<BookingSettingsData> {
    const data: {
      slotStepMinutes?: number;
      horizonDays?: number;
      capacity?: number;
      schedule?: ScheduleMap;
      exceptions?: ExceptionsMap;
    } = {};

    if (patch.slotStepMinutes !== undefined) {
      const step = Number(patch.slotStepMinutes);
      if (!Number.isInteger(step) || step < 15 || step > 240 || step % 15 !== 0) {
        throw new BadRequestException('Шаг слота: 15–240 минут, кратно 15');
      }
      data.slotStepMinutes = step;
    }
    if (patch.horizonDays !== undefined) {
      const horizon = Number(patch.horizonDays);
      if (!Number.isInteger(horizon) || horizon < 1 || horizon > 60) {
        throw new BadRequestException('Горизонт записи: 1–60 дней');
      }
      data.horizonDays = horizon;
    }
    if (patch.capacity !== undefined) {
      const capacity = Number(patch.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10) {
        throw new BadRequestException('Одновременных записей: 1–10');
      }
      data.capacity = capacity;
    }
    if (patch.schedule !== undefined) {
      data.schedule = parseSchedule(patch.schedule);
    }
    if (patch.exceptions !== undefined) {
      data.exceptions = pruneExceptions(parseExceptions(patch.exceptions), todayIsoMinsk());
    }

    const current = await this.getSettings();
    const row = await this.prisma.bookingSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        slotStepMinutes: data.slotStepMinutes,
        horizonDays: data.horizonDays,
        capacity: data.capacity,
        schedule: data.schedule !== undefined ? toJsonInput(data.schedule) : undefined,
        exceptions: data.exceptions !== undefined ? toJsonInput(data.exceptions) : undefined,
      },
      create: {
        id: SETTINGS_ID,
        slotStepMinutes: data.slotStepMinutes ?? current.slotStepMinutes,
        horizonDays: data.horizonDays ?? current.horizonDays,
        capacity: data.capacity ?? current.capacity,
        schedule: toJsonInput(data.schedule ?? current.schedule),
        exceptions: toJsonInput(data.exceptions ?? current.exceptions),
      },
    });
    return {
      slotStepMinutes: row.slotStepMinutes,
      horizonDays: row.horizonDays,
      capacity: row.capacity,
      schedule: row.schedule as unknown as ScheduleMap,
      exceptions: row.exceptions as unknown as ExceptionsMap,
    };
  }

  /** Даты горизонта с признаком «нет свободных слотов». */
  async availableDates(): Promise<BookingDateView[]> {
    const settings = await this.getSettings();
    const today = todayIsoMinsk();
    const dates: BookingDateView[] = [];
    for (let offset = 0; offset < settings.horizonDays; offset += 1) {
      const dateIso = addDaysIso(today, offset);
      const window = windowForDate(dateIso, settings);
      if (!window.enabled) {
        dates.push({ date: dateIso, disabled: true });
        continue;
      }
      const slots = await this.slotsForDate(dateIso, settings, window);
      const hasFree = slots.some((slot) => slot.available);
      dates.push({ date: dateIso, disabled: !hasFree });
    }
    return dates;
  }

  async slots(dateIso: unknown): Promise<BookingSlotView[]> {
    if (typeof dateIso !== 'string' || !isValidDate(dateIso)) {
      throw new BadRequestException('Дата: YYYY-MM-DD');
    }
    const settings = await this.getSettings();
    const window = windowForDate(dateIso, settings);
    if (!window.enabled) {
      return [];
    }
    return this.slotsForDate(dateIso, settings, window);
  }

  async create(
    input: {
      name: unknown;
      phone: unknown;
      car?: unknown;
      services?: unknown;
      comment?: unknown;
      date: unknown;
      time: unknown;
    },
    clientKey: string,
    idempotencyKey?: string,
  ): Promise<{ id: string; duplicate: boolean }> {
    if (publicCreateRateLimiter.isBlocked(clientKey)) {
      throw new HttpException(
        'Слишком много попыток записи, попробуйте позже',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    const car = cleanOptional(input.car, 60);
    const services = Array.isArray(input.services)
      ? [
          ...new Set(
            input.services
              .filter((item): item is string => typeof item === 'string')
              .map((item) => item.trim())
              .filter((item) => item.length > 0 && item.length <= 80),
          ),
        ].slice(0, 10)
      : [];
    const comment = cleanOptional(input.comment, 500);
    if (!NAME_PATTERN.test(name)) {
      throw new BadRequestException('Имя: от 2 до 80 символов');
    }
    if (!PHONE_PATTERN.test(phone)) {
      throw new BadRequestException('Некорректный номер телефона');
    }
    if (normalizeBelarusPhone(phone) === null) {
      throw new BadRequestException(
        'Укажите белорусский мобильный номер: +375 25/29/33/44 и 7 цифр',
      );
    }
    if (typeof input.date !== 'string' || !isValidDate(input.date)) {
      throw new BadRequestException('Дата записи: YYYY-MM-DD');
    }
    if (typeof input.time !== 'string' || !isValidTime(input.time)) {
      throw new BadRequestException('Время записи: HH:MM');
    }
    if (idempotencyKey !== undefined && !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      throw new BadRequestException('Некорректный Idempotency-Key');
    }

    if (idempotencyKey !== undefined) {
      const existing = await this.prisma.booking.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (existing !== null) {
        return { id: existing.id, duplicate: true };
      }
    }

    const settings = await this.getSettings();
    const scheduledAt = await this.assertSlotAvailable(input.date, input.time, settings);

    const created = await this.prisma.booking
      .create({
        data: {
          name,
          phone,
          car,
          services,
          comment,
          scheduledAt,
          idempotencyKey,
        },
        select: { id: true, scheduledAt: true },
      })
      .catch(
        async (error: unknown): Promise<typeof DUPLICATE | { id: string; scheduledAt: Date }> => {
          if (idempotencyKey !== undefined && isPrismaErrorCode(error, 'P2002')) {
            return DUPLICATE;
          }
          throw error;
        },
      );
    if (created === DUPLICATE) {
      const existing = await this.prisma.booking.findUnique({
        where: { idempotencyKey: idempotencyKey ?? '' },
        select: { id: true },
      });
      if (existing === null) {
        throw new HttpException('Не удалось создать запись', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return { id: existing.id, duplicate: true };
    }
    publicCreateRateLimiter.registerFailure(clientKey);

    this.notifications.deliver(phone, formatBookingConfirmation(created.scheduledAt));

    this.notify({
      id: created.id,
      name,
      phone,
      car,
      services,
      comment,
      scheduledAt: created.scheduledAt,
    });
    return { id: created.id, duplicate: false };
  }

  async list(status?: unknown): Promise<
    Array<{
      id: string;
      name: string;
      phone: string;
      car: string | null;
      services: string[];
      comment: string | null;
      scheduledAt: Date;
      status: string;
      createdAt: Date;
    }>
  > {
    const filter =
      typeof status === 'string' && (BOOKING_STATUSES as readonly string[]).includes(status)
        ? { status }
        : {};
    return this.prisma.booking.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        car: true,
        services: true,
        comment: true,
        scheduledAt: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async countUnconfirmed(): Promise<number> {
    return this.prisma.booking.count({ where: { status: 'booked' } });
  }

  async dayOverview(dateInput: unknown): Promise<DayOverviewView> {
    if (typeof dateInput !== 'string' || !isValidDate(dateInput)) {
      throw new BadRequestException('Дата — YYYY-MM-DD');
    }
    const settings = await this.getSettings();
    const window = windowForDate(dateInput, settings);
    if (!window.enabled) {
      return { date: dateInput, enabled: false, slots: [] };
    }
    const dayStart = slotMoment(dateInput, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayBookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        scheduledAt: { gte: dayStart, lt: dayEnd },
      },
      select: { name: true, scheduledAt: true },
      orderBy: { scheduledAt: 'asc' },
    });
    const namesBySlot = new Map<number, string[]>();
    for (const booking of dayBookings) {
      const minutesFromMidnight = Math.round(
        (booking.scheduledAt.getTime() - dayStart.getTime()) / 60_000,
      );
      const names = namesBySlot.get(minutesFromMidnight) ?? [];
      names.push(booking.name);
      namesBySlot.set(minutesFromMidnight, names);
    }
    const blocked = blockedMinutesFor(dateInput, settings);
    const now = Date.now();
    const slots: DayOverviewSlotView[] = slotStarts(window, settings.slotStepMinutes).map(
      (start) => {
        const names = namesBySlot.get(start) ?? [];
        const status: DayOverviewSlotStatus = blocked.has(start)
          ? 'blocked'
          : names.length > 0
            ? 'booked'
            : 'free';
        return {
          time: minutesToTime(start),
          status,
          past: slotMoment(dateInput, start).getTime() <= now,
          bookingNames: names,
        };
      },
    );
    return { date: dateInput, enabled: true, from: window.from, to: window.to, slots };
  }

  async updateStatus(id: string, status: unknown): Promise<{ status: BookingStatus }> {
    if (!isBookingStatus(status)) {
      throw new BadRequestException(`Статус: ${BOOKING_STATUSES.join(', ')}`);
    }
    const booking = await this.prisma.booking
      .update({
        where: { id },
        data: { status },
        select: {
          id: true,
          name: true,
          phone: true,
          car: true,
          services: true,
          comment: true,
          scheduledAt: true,
          status: true,
          messages: { select: { id: true, chatId: true, messageId: true } },
        },
      })
      .catch((error: unknown) => {
        if (isPrismaErrorCode(error, 'P2025')) {
          throw new NotFoundException('Запись не найдена');
        }
        throw error;
      });
    this.syncTelegram(booking);
    return { status: booking.status as BookingStatus };
  }

  private async slotsForDate(
    dateIso: string,
    settings: BookingSettingsData,
    window: { from: string; to: string },
  ): Promise<BookingSlotView[]> {
    const starts = slotStarts(window, settings.slotStepMinutes);
    if (starts.length === 0) {
      return [];
    }
    const dayStart = slotMoment(dateIso, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const taken = await this.prisma.booking.groupBy({
      by: ['scheduledAt'],
      where: {
        status: { in: ACTIVE_STATUSES },
        scheduledAt: { gte: dayStart, lt: dayEnd },
      },
      _count: { id: true },
    });
    const occupancy = new Map<number, number>();
    for (const row of taken) {
      const minutesFromMidnight = Math.round(
        (row.scheduledAt.getTime() - dayStart.getTime()) / 60_000,
      );
      occupancy.set(minutesFromMidnight, row._count.id);
    }
    const blocked = blockedMinutesFor(dateIso, settings);
    const now = Date.now();
    return starts.map((start) => {
      const moment = slotMoment(dateIso, start);
      const used = occupancy.get(start) ?? 0;
      return {
        time: minutesToTime(start),
        available: moment.getTime() > now && used < settings.capacity && !blocked.has(start),
      };
    });
  }

  private async assertSlotAvailable(
    dateIso: string,
    time: string,
    settings: BookingSettingsData,
  ): Promise<Date> {
    const window = windowForDate(dateIso, settings);
    if (!window.enabled) {
      throw new BadRequestException('В этот день сервис не работает');
    }
    const starts = slotStarts(window, settings.slotStepMinutes);
    const minutes = timeToMinutesPublic(time);
    if (!starts.includes(minutes)) {
      throw new BadRequestException('Время вне рабочих слотов');
    }
    if (blockedMinutesFor(dateIso, settings).has(minutes)) {
      throw new ConflictException('Время недоступно');
    }
    const moment = slotMoment(dateIso, minutes);
    if (moment.getTime() <= Date.now()) {
      throw new ConflictException('Время уже прошло');
    }
    const used = await this.prisma.booking.count({
      where: { status: { in: ACTIVE_STATUSES }, scheduledAt: moment },
    });
    if (used >= settings.capacity) {
      throw new ConflictException('Слот уже занят');
    }
    return moment;
  }

  private notify(booking: {
    id: string;
    name: string;
    phone: string;
    car: string | null;
    services: string[];
    comment: string | null;
    scheduledAt: Date;
  }): void {
    if (!isTelegramEnabled(this.telegram)) {
      this.logger.warn('Telegram не настроен: TELEGRAM_BOT_TOKEN отсутствует');
      return;
    }
    const config = this.telegram;
    void (async () => {
      const chats = await loadActiveMasterChats(this.prisma, (error) =>
        this.logger.error(`Не прочитались мастера для записи ${booking.id}: ${String(error)}`),
      );
      if (chats.length === 0) {
        this.logger.warn(`Нет активных мастеров — запись ${booking.id} не отправлена в Telegram`);
        return;
      }
      const delivered = await broadcastToMasters(
        config,
        chats,
        formatBookingMessage(booking, 'booked'),
        keyboardsForBooking('booked', booking.id),
        (chatId, error) =>
          this.logger.error(
            `Уведомление о записи ${booking.id} не ушло мастеру ${chatId}: ${String(error)}`,
          ),
      );
      for (const item of delivered) {
        await this.prisma.bookingMessage
          .create({
            data: { bookingId: booking.id, ...item },
            select: { id: true },
          })
          .catch((error: unknown) => {
            this.logger.error(`Не сохранилось сообщение записи ${booking.id}: ${String(error)}`);
          });
      }
    })();
  }

  private syncTelegram(booking: {
    id: string;
    name: string;
    phone: string;
    car: string | null;
    services: string[];
    comment: string | null;
    scheduledAt: Date;
    status: string;
    messages: RequestMessageRef[];
  }): void {
    if (!isTelegramEnabled(this.telegram) || booking.messages.length === 0) {
      return;
    }
    const status = isBookingStatus(booking.status) ? booking.status : 'booked';
    const keyboards: InlineButton[][] = keyboardsForBooking(status, booking.id);
    void compactMessages(this.telegram, {
      messages: booking.messages,
      text: formatBookingMessage(booking, status),
      keyboards,
    })
      .then((alive) =>
        this.prisma.bookingMessage
          .deleteMany({
            where: { bookingId: booking.id, id: { notIn: alive } },
          })
          .catch((error: unknown) => {
            this.logger.error(`Не расчистились сообщения записи ${booking.id}: ${String(error)}`);
          }),
      )
      .catch((error: unknown) => {
        this.logger.warn(`Не скомпактились сообщения записи ${booking.id}: ${String(error)}`);
      });
  }
}

function cleanOptional(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return null;
  }
  return trimmed;
}

function toJsonInput(value: ScheduleMap | ExceptionsMap): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function addDaysIso(dateIso: string, days: number): string {
  const next = new Date(slotMoment(dateIso, 0).getTime() + days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Minsk' }).format(next);
}

function parseSchedule(value: unknown): ScheduleMap {
  if (typeof value !== 'object' || value === null) {
    throw new BadRequestException('Расписание: объект по дням недели');
  }
  const source = value as Record<string, unknown>;
  const result = { ...DEFAULT_SCHEDULE };
  for (const key of Object.keys(DEFAULT_SCHEDULE) as Array<keyof ScheduleMap>) {
    const day = source[key];
    if (day === undefined) {
      continue;
    }
    if (typeof day !== 'object' || day === null) {
      throw new BadRequestException(`Расписание ${key}: объект enabled/from/to`);
    }
    const { enabled, from, to } = day as Record<string, unknown>;
    if (typeof enabled !== 'boolean') {
      throw new BadRequestException(`Расписание ${key}: enabled — boolean`);
    }
    if (
      typeof from !== 'string' ||
      typeof to !== 'string' ||
      !isValidTime(from) ||
      !isValidTime(to)
    ) {
      throw new BadRequestException(`Расписание ${key}: from/to — HH:MM`);
    }
    if (timeToMinutesPublic(from) >= timeToMinutesPublic(to)) {
      throw new BadRequestException(`Расписание ${key}: from должен быть раньше to`);
    }
    result[key] = { enabled, from, to };
  }
  return result;
}

function parseExceptions(value: unknown): ExceptionsMap {
  if (typeof value !== 'object' || value === null) {
    throw new BadRequestException('Исключения: объект по датам');
  }
  const result: ExceptionsMap = {};
  for (const [dateIso, day] of Object.entries(value as Record<string, unknown>)) {
    if (!isValidDate(dateIso)) {
      throw new BadRequestException(`Исключение ${dateIso}: дата YYYY-MM-DD`);
    }
    if (typeof day !== 'object' || day === null) {
      throw new BadRequestException(`Исключение ${dateIso}: объект`);
    }
    const { enabled, from, to } = day as Record<string, unknown>;
    if (typeof enabled !== 'boolean') {
      throw new BadRequestException(`Исключение ${dateIso}: enabled — boolean`);
    }
    if (!enabled) {
      result[dateIso] = { enabled: false };
      continue;
    }
    if (
      typeof from !== 'string' ||
      typeof to !== 'string' ||
      !isValidTime(from) ||
      !isValidTime(to)
    ) {
      throw new BadRequestException(`Исключение ${dateIso}: from/to — HH:MM`);
    }
    if (timeToMinutesPublic(from) >= timeToMinutesPublic(to)) {
      throw new BadRequestException(`Исключение ${dateIso}: from должен быть раньше to`);
    }
    result[dateIso] = {
      enabled: true,
      from,
      to,
      blockedTimes: parseBlockedTimes(day as Record<string, unknown>, dateIso, from, to),
    };
  }
  return result;
}

function parseBlockedTimes(
  day: Record<string, unknown>,
  dateIso: string,
  from: string,
  to: string,
): string[] | undefined {
  const raw = day.blockedTimes;
  if (raw === undefined) {
    return undefined;
  }
  if (!Array.isArray(raw)) {
    throw new BadRequestException(`Исключение ${dateIso}: blockedTimes — массив HH:MM`);
  }
  const fromMinutes = timeToMinutesPublic(from);
  const toMinutes = timeToMinutesPublic(to);
  const unique = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string' || !isValidTime(item)) {
      throw new BadRequestException(`Исключение ${dateIso}: blockedTimes — HH:MM`);
    }
    const minutes = timeToMinutesPublic(item);
    if (minutes < fromMinutes || minutes >= toMinutes) {
      throw new BadRequestException(
        `Исключение ${dateIso}: блокировка ${item} вне окна ${from}–${to}`,
      );
    }
    unique.add(item);
  }
  return [...unique].sort((a, b) => timeToMinutesPublic(a) - timeToMinutesPublic(b));
}
