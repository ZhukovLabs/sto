import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { loadEnv } from '../env';
import { BookingService } from '../booking/booking.service';
import { RequestsService } from './requests.service';
import {
  answerCallbackQuery,
  dropWebhook,
  fetchUpdates,
  formatStartReply,
  isTelegramEnabled,
  sendTelegramMessage,
  type TelegramConfig,
  type TelegramUpdate,
} from './telegram';

const REQUEST_CALLBACK_PATTERN = /^req:([0-9a-f-]{36}):(called|taken|cancelled)$/;
const BOOKING_CALLBACK_PATTERN = /^bkg:([0-9a-f-]{36}):(confirmed|taken|cancelled)$/;

@Injectable()
export class TelegramUpdatesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramUpdatesService.name);
  private readonly requests: RequestsService;
  private readonly bookings: BookingService;
  private readonly prisma: PrismaService;
  private readonly config: TelegramConfig | null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private offset = 0;
  private polling = false;

  constructor(
    requestsService: RequestsService,
    bookingService: BookingService,
    prismaService: PrismaService,
  ) {
    this.requests = requestsService;
    this.bookings = bookingService;
    this.prisma = prismaService;
    this.config = requestsService.telegramConfig;
  }

  onModuleInit(): void {
    if (!isTelegramEnabled(this.config)) {
      return;
    }
    const config = this.config;
    void this.seedOwnerFromEnv()
      .catch((error: unknown) => {
        this.logger.error(`Не создался мастер из TELEGRAM_CHAT_ID: ${String(error)}`);
      })
      .then(() =>
        dropWebhook(config).catch((error: unknown) => {
          this.logger.warn(`deleteWebhook: ${String(error)}`);
        }),
      )
      .then(() => {
        this.timer = setInterval(() => void this.poll(), 1100);
      });
  }

  onModuleDestroy(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
  }

  /** Первый запуск с legacy-переменной TELEGRAM_CHAT_ID: создаём «Владельца», чтобы рассылка не потерялась. */
  private async seedOwnerFromEnv(): Promise<void> {
    const env = loadEnv();
    if (env.TELEGRAM_CHAT_ID === undefined) {
      return;
    }
    const chatId = BigInt(env.TELEGRAM_CHAT_ID);
    const existing = await this.prisma.master.findFirst({ select: { id: true } });
    if (existing !== null) {
      return;
    }
    await this.prisma.master.create({
      data: { name: 'Владелец', telegramChatId: chatId },
      select: { id: true },
    });
    this.logger.log('Создан мастер «Владелец» из TELEGRAM_CHAT_ID');
  }

  private async applyCallback(
    queryId: string,
    data: string,
    apply: () => Promise<unknown>,
  ): Promise<void> {
    if (!isTelegramEnabled(this.config)) {
      return;
    }
    try {
      await apply();
      await answerCallbackQuery(this.config, queryId, 'Записано');
    } catch (error: unknown) {
      this.logger.warn(`callback ${data}: ${String(error)}`);
      await answerCallbackQuery(this.config, queryId, 'Не получилось — обратитесь в панель').catch(
        () => undefined,
      );
    }
  }

  private async poll(): Promise<void> {
    if (this.polling || !isTelegramEnabled(this.config)) {
      return;
    }
    this.polling = true;
    try {
      const updates = await fetchUpdates(this.config, this.offset);
      for (const update of updates) {
        this.offset = update.update_id + 1;
        await this.handle(update);
      }
    } catch (error: unknown) {
      this.logger.warn(`getUpdates: ${String(error)}`);
    } finally {
      this.polling = false;
    }
  }

  private async handle(update: TelegramUpdate): Promise<void> {
    if (!isTelegramEnabled(this.config)) {
      return;
    }
    const query = update.callback_query;
    if (query?.data !== undefined) {
      const { data } = query;
      const requestMatch = REQUEST_CALLBACK_PATTERN.exec(data);
      if (requestMatch !== null) {
        const [, requestId, action] = requestMatch;
        await this.applyCallback(query.id, data, () => this.requests.updateStatus(requestId, action));
        return;
      }
      const bookingMatch = BOOKING_CALLBACK_PATTERN.exec(data);
      if (bookingMatch !== null) {
        const [, bookingId, action] = bookingMatch;
        await this.applyCallback(query.id, data, () =>
          this.bookings.updateStatus(bookingId, action),
        );
        return;
      }
      return;
    }
    // Любое сообщение боту: отвечаем chat_id, добавляет только администратор в панели.
    const message = update.message;
    if (message !== undefined) {
      await sendTelegramMessage(
        this.config,
        message.chat.id,
        formatStartReply(message.chat.id),
      ).catch((error: unknown) => {
        this.logger.warn(`Не ответили на сообщение чата ${message.chat.id}: ${String(error)}`);
      });
    }
  }
}
