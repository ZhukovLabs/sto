import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { isTelegramEnabled } from './telegram';

const TICK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Ежечасно напоминает в Telegram о необработанных заявках (статус new),
 * пока заявке не исполнится 24 часа.
 */
@Injectable()
export class RequestsReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RequestsReminderService.name);
  private timer: NodeJS.Timeout | undefined;
  private ticking = false;

  constructor(private readonly requests: RequestsService) {}

  onModuleInit(): void {
    if (!isTelegramEnabled(this.requests.telegramConfig)) {
      return;
    }
    this.tick();
    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
    }
  }

  private tick(): void {
    if (this.ticking) {
      return;
    }
    this.ticking = true;
    this.requests
      .remindStale()
      .catch((error: unknown) => {
        this.logger.error(`Не удалось проверить заявки: ${String(error)}`);
      })
      .finally(() => {
        this.ticking = false;
      });
  }
}
