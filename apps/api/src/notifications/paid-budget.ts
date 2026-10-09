/**
 * Дневной бюджет платных каналов уведомлений (Viber + SMS).
 * Telegram-личка бесплатна и не считается. При исчерпании платные каналы
 * пропускаются до конца дня (по Минску) — баланс шлюза защищён от шторма заявок.
 */

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Minsk',
});

export interface PaidBudgetSnapshot {
  limit: number;
  used: number;
  exhausted: boolean;
  day: string;
}

export class PaidChannelBudget {
  private day = PaidChannelBudget.today();
  private used = 0;

  constructor(
    private readonly limit: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** true — отправка разрешена и засчитана; false — лимит исчерпан. */
  tryConsume(): boolean {
    this.rollDayIfNeeded();
    if (this.used >= this.limit) {
      return false;
    }
    this.used += 1;
    return true;
  }

  getSnapshot(): PaidBudgetSnapshot {
    this.rollDayIfNeeded();
    return {
      limit: this.limit,
      used: this.used,
      exhausted: this.used >= this.limit,
      day: this.day,
    };
  }

  private rollDayIfNeeded(): void {
    const today = PaidChannelBudget.today(this.now);
    if (today !== this.day) {
      this.day = today;
      this.used = 0;
    }
  }

  private static today(now: () => Date = () => new Date()): string {
    return DAY_LABEL_FORMATTER.format(now());
  }
}
