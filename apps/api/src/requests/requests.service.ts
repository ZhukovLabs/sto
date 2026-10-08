import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { loadEnv } from '../env';
import { isBlocked, registerFailure } from '../auth/rate-limiter';
import {
  REQUEST_STATUSES,
  compactRequestMessages,
  formatReminderMessage,
  formatRequestMessage,
  isRequestStatus,
  isTelegramEnabled,
  keyboardsFor,
  sendTelegramMessage,
  type RequestMessageRef,
  type RequestStatus,
  type TelegramConfig,
} from './telegram';

const NAME_PATTERN = /^.{2,80}$/s;
const PHONE_PATTERN = /^[0-9+()\-\s]{9,20}$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const DUPLICATE = Symbol('duplicate');
const HOUR_MS = 60 * 60 * 1000;
const REMINDER_INTERVAL_MS = HOUR_MS;
const REMINDER_MAX_AGE_MS = 24 * HOUR_MS;

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);
  private readonly telegram: TelegramConfig | null;

  constructor(private readonly prisma: PrismaService) {
    const env = loadEnv();
    this.telegram =
      env.TELEGRAM_BOT_TOKEN !== undefined ? { botToken: env.TELEGRAM_BOT_TOKEN } : null;
  }

  get telegramConfig(): TelegramConfig | null {
    return this.telegram;
  }

  async create(
    name: unknown,
    phone: unknown,
    clientKey: string,
    idempotencyKey?: string,
  ): Promise<{ id: string; duplicate: boolean }> {
    if (isBlocked(clientKey)) {
      throw new HttpException(
        'Слишком много заявок, попробуйте позже',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    if (!NAME_PATTERN.test(cleanName)) {
      throw new BadRequestException('Имя: от 2 до 80 символов');
    }
    if (!PHONE_PATTERN.test(cleanPhone)) {
      throw new BadRequestException('Некорректный номер телефона');
    }
    if (idempotencyKey !== undefined && !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      throw new BadRequestException('Некорректный Idempotency-Key');
    }

    if (idempotencyKey !== undefined) {
      const existing = await this.prisma.request.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (existing !== null) {
        return { id: existing.id, duplicate: true };
      }
    }

    const created = await this.prisma.request
      .create({
        data: { name: cleanName, phone: cleanPhone, idempotencyKey },
        select: { id: true },
      })
      .catch(async (error: unknown): Promise<typeof DUPLICATE> => {
        if (
          idempotencyKey !== undefined &&
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          return DUPLICATE;
        }
        throw error;
      });
    if (created === DUPLICATE) {
      const existing = await this.prisma.request.findUnique({
        where: { idempotencyKey: idempotencyKey ?? '' },
        select: { id: true },
      });
      if (existing === null) {
        throw new HttpException('Не удалось создать заявку', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return { id: existing.id, duplicate: true };
    }
    registerFailure(clientKey);

    this.notify(created.id, { name: cleanName, phone: cleanPhone, createdAt: new Date() });
    return { id: created.id, duplicate: false };
  }

  async list(
    status?: unknown,
  ): Promise<Array<{ id: string; name: string; phone: string; status: string; createdAt: Date }>> {
    const filter =
      typeof status === 'string' && (REQUEST_STATUSES as readonly string[]).includes(status)
        ? { status }
        : {};
    return this.prisma.request.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, phone: true, status: true, createdAt: true },
    });
  }

  async countNew(): Promise<number> {
    return this.prisma.request.count({ where: { status: 'new' } });
  }

  async updateStatus(id: string, status: unknown): Promise<{ status: RequestStatus }> {
    if (!isRequestStatus(status)) {
      throw new BadRequestException(`Статус: ${REQUEST_STATUSES.join(', ')}`);
    }
    const request = await this.prisma.request
      .update({
        where: { id },
        data: { status },
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          createdAt: true,
          messages: { select: { id: true, chatId: true, messageId: true } },
        },
      })
      .catch(() => {
        throw new NotFoundException('Заявка не найдена');
      });
    this.syncTelegram(request);
    return { status: request.status as RequestStatus };
  }

  async remindStale(): Promise<number> {
    if (!isTelegramEnabled(this.telegram)) {
      return 0;
    }
    const now = new Date();
    const hourAgo = new Date(now.getTime() - REMINDER_INTERVAL_MS);
    const dayAgo = new Date(now.getTime() - REMINDER_MAX_AGE_MS);
    const stale = await this.prisma.request.findMany({
      where: {
        status: 'new',
        createdAt: { gte: dayAgo, lte: hourAgo },
        OR: [{ lastReminderAt: null }, { lastReminderAt: { lte: hourAgo } }],
      },
      select: { id: true, name: true, phone: true, createdAt: true },
    });
    if (stale.length === 0) {
      return 0;
    }
    const masters = await this.prisma.master.findMany({
      where: { isActive: true },
      select: { telegramChatId: true },
    });
    if (masters.length === 0) {
      this.logger.warn('Нет активных мастеров — напоминания не отправлены');
      return 0;
    }
    let sent = 0;
    for (const request of stale) {
      const hoursWaiting = Math.floor((now.getTime() - request.createdAt.getTime()) / HOUR_MS);
      const html = formatReminderMessage(request, hoursWaiting);
      const buttons = keyboardsFor('new', request.id);
      const delivered: Array<{ chatId: bigint; messageId: number }> = [];
      for (const master of masters) {
        try {
          const messageId = await sendTelegramMessage(
            this.telegram,
            master.telegramChatId,
            html,
            buttons,
          );
          delivered.push({ chatId: master.telegramChatId, messageId });
        } catch (error: unknown) {
          this.logger.error(
            `Напоминание ${request.id} не ушло мастеру ${master.telegramChatId}: ${String(error)}`,
          );
        }
      }
      if (delivered.length === 0) {
        continue;
      }
      try {
        await this.prisma.$transaction([
          this.prisma.requestMessage.createMany({
            data: delivered.map((item) => ({ requestId: request.id, ...item })),
          }),
          this.prisma.request.update({
            where: { id: request.id },
            data: { lastReminderAt: now },
            select: { id: true },
          }),
        ]);
        sent += 1;
      } catch (error: unknown) {
        this.logger.error(`Не сохранились напоминания ${request.id}: ${String(error)}`);
      }
    }
    if (sent > 0) {
      this.logger.log(`Напоминаний отправлено: ${sent}`);
    }
    return sent;
  }

  private notify(id: string, contact: { name: string; phone: string; createdAt: Date }): void {
    if (!isTelegramEnabled(this.telegram)) {
      this.logger.warn('Telegram не настроен: TELEGRAM_BOT_TOKEN отсутствует');
      return;
    }
    const config = this.telegram;
    void (async () => {
      const masters = await this.prisma.master
        .findMany({ where: { isActive: true }, select: { telegramChatId: true } })
        .catch((error: unknown): Array<{ telegramChatId: bigint }> => {
          this.logger.error(`Не прочитались мастера для заявки ${id}: ${String(error)}`);
          return [];
        });
      if (masters.length === 0) {
        this.logger.warn(`Нет активных мастеров — заявка ${id} не отправлена в Telegram`);
        return;
      }
      const html = formatRequestMessage(contact);
      const buttons = keyboardsFor('new', id);
      for (const master of masters) {
        try {
          const messageId = await sendTelegramMessage(config, master.telegramChatId, html, buttons);
          await this.prisma.requestMessage.create({
            data: { requestId: id, chatId: master.telegramChatId, messageId },
            select: { id: true },
          });
        } catch (error: unknown) {
          this.logger.error(
            `Уведомление ${id} не ушло мастеру ${master.telegramChatId}: ${String(error)}`,
          );
        }
      }
    })();
  }

  private syncTelegram(request: {
    id: string;
    name: string;
    phone: string;
    status: string;
    createdAt: Date;
    messages: RequestMessageRef[];
  }): void {
    if (!isTelegramEnabled(this.telegram) || request.messages.length === 0) {
      return;
    }
    const status = isRequestStatus(request.status) ? request.status : 'new';
    void compactRequestMessages(this.telegram, {
      messages: request.messages,
      requestId: request.id,
      status,
      text: formatRequestMessage(request, status),
    })
      .then((alive) =>
        this.prisma.requestMessage
          .deleteMany({
            where: { requestId: request.id, id: { notIn: alive } },
          })
          .catch((error: unknown) => {
            this.logger.error(`Не расчистились сообщения заявки ${request.id}: ${String(error)}`);
          }),
      )
      .catch((error: unknown) => {
        this.logger.warn(`Не скомпактились сообщения заявки ${request.id}: ${String(error)}`);
      });
  }
}
