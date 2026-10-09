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
import { normalizeBelarusPhone } from '../phones';
import { NAME_PATTERN, PHONE_PATTERN, IDEMPOTENCY_KEY_PATTERN } from '../public-forms';
import { isPrismaErrorCode } from '../prisma-errors';
import { formatCallbackConfirmation, NotificationService } from '../notifications';
import { publicCreateRateLimiter } from '../auth/rate-limiter';
import {
  REQUEST_STATUSES,
  broadcastToMasters,
  compactRequestMessages,
  formatReminderMessage,
  formatRequestMessage,
  isRequestStatus,
  isTelegramEnabled,
  keyboardsFor,
  loadActiveMasterChats,
  type RequestMessageRef,
  type RequestStatus,
  type TelegramConfig,
} from './telegram';

const COMMENT_PATTERN = /^.{0,500}$/s;
const DUPLICATE = Symbol('duplicate');
const HOUR_MS = 60 * 60 * 1000;
const REMINDER_INTERVAL_MS = HOUR_MS;
const REMINDER_MAX_AGE_MS = 24 * HOUR_MS;

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);
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

  async create(
    name: unknown,
    phone: unknown,
    comment: unknown,
    clientKey: string,
    idempotencyKey?: string,
  ): Promise<{ id: string; duplicate: boolean }> {
    if (publicCreateRateLimiter.isBlocked(clientKey)) {
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
    if (normalizeBelarusPhone(cleanPhone) === null) {
      throw new BadRequestException(
        'Укажите белорусский мобильный номер: +375 25/29/33/44 и 7 цифр',
      );
    }
    const cleanComment = typeof comment === 'string' ? comment.trim() : '';
    if (!COMMENT_PATTERN.test(cleanComment)) {
      throw new BadRequestException('Комментарий: до 500 символов');
    }
    const savedComment = cleanComment.length > 0 ? cleanComment : null;
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
        data: { name: cleanName, phone: cleanPhone, comment: savedComment, idempotencyKey },
        select: { id: true },
      })
      .catch(async (error: unknown): Promise<typeof DUPLICATE> => {
        if (idempotencyKey !== undefined && isPrismaErrorCode(error, 'P2002')) {
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
    publicCreateRateLimiter.registerFailure(clientKey);

    this.notifications.deliver(cleanPhone, formatCallbackConfirmation());

    this.notify(created.id, {
      name: cleanName,
      phone: cleanPhone,
      comment: savedComment,
      createdAt: new Date(),
    });
    return { id: created.id, duplicate: false };
  }

  async list(status?: unknown): Promise<
    Array<{
      id: string;
      name: string;
      phone: string;
      comment: string | null;
      status: string;
      createdAt: Date;
    }>
  > {
    const filter =
      typeof status === 'string' && (REQUEST_STATUSES as readonly string[]).includes(status)
        ? { status }
        : {};
    return this.prisma.request.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, phone: true, comment: true, status: true, createdAt: true },
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
          comment: true,
          status: true,
          createdAt: true,
          messages: { select: { id: true, chatId: true, messageId: true } },
        },
      })
      .catch((error: unknown) => {
        if (isPrismaErrorCode(error, 'P2025')) {
          throw new NotFoundException('Заявка не найдена');
        }
        throw error;
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
    const masters = await loadActiveMasterChats(this.prisma, (error) =>
      this.logger.error(`Не прочитались мастера для напоминаний: ${String(error)}`),
    );
    if (masters.length === 0) {
      this.logger.warn('Нет активных мастеров — напоминания не отправлены');
      return 0;
    }
    let sent = 0;
    for (const request of stale) {
      const hoursWaiting = Math.floor((now.getTime() - request.createdAt.getTime()) / HOUR_MS);
      const html = formatReminderMessage(request, hoursWaiting);
      const buttons = keyboardsFor('new', request.id);
      const delivered = await broadcastToMasters(
        this.telegram,
        masters,
        html,
        buttons,
        (chatId, error) =>
          this.logger.error(
            `Напоминание ${request.id} не ушло мастеру ${chatId}: ${String(error)}`,
          ),
      );
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

  private notify(
    id: string,
    contact: {
      name: string;
      phone: string;
      comment: string | null;
      createdAt: Date;
    },
  ): void {
    if (!isTelegramEnabled(this.telegram)) {
      this.logger.warn('Telegram не настроен: TELEGRAM_BOT_TOKEN отсутствует');
      return;
    }
    const config = this.telegram;
    void (async () => {
      const chats = await loadActiveMasterChats(this.prisma, (error) =>
        this.logger.error(`Не прочитались мастера для заявки ${id}: ${String(error)}`),
      );
      if (chats.length === 0) {
        this.logger.warn(`Нет активных мастеров — заявка ${id} не отправлена в Telegram`);
        return;
      }
      const delivered = await broadcastToMasters(
        config,
        chats,
        formatRequestMessage(contact),
        keyboardsFor('new', id),
        (chatId, error) =>
          this.logger.error(`Уведомление ${id} не ушло мастеру ${chatId}: ${String(error)}`),
      );
      await this.saveMessageRows(
        delivered.map((item) => ({ requestId: id, ...item })),
        `Не сохранились сообщения заявки ${id}`,
      );
    })();
  }

  private async saveMessageRows(
    data: Array<{ requestId: string; chatId: bigint; messageId: number }>,
    errorContext: string,
  ): Promise<void> {
    for (const row of data) {
      await this.prisma.requestMessage
        .create({ data: row, select: { id: true } })
        .catch((error: unknown) => {
          this.logger.error(`${errorContext}: ${String(error)}`);
        });
    }
  }

  private syncTelegram(request: {
    id: string;
    name: string;
    phone: string;
    comment: string | null;
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
