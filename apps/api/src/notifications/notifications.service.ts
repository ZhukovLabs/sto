import { BadRequestException, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { loadEnv } from '../env';
import { PERSONAL_TELEGRAM, type PersonalTelegramSender } from '../personal-telegram';
import { SMS, type SmsSender } from '../sms';
import {
  broadcastToMasters,
  loadActiveMasterChats,
  type TelegramConfig,
} from '../requests/telegram';
import { PaidChannelBudget, type PaidBudgetSnapshot } from './paid-budget';
import {
  CHANNELS,
  DEFAULT_CHANNEL_ORDER,
  VIBER_PRICE_PROBE,
  formatCallbackConfirmation,
  type Channel,
  type ChannelsPriceView,
  type NotificationSettingsView,
  type SmsBalanceView,
} from './notifications';

const SETTINGS_ID = 'singleton';
const DEFAULT_DAILY_LIMIT = 50;

function paidDailyLimitFromEnv(variables: NodeJS.ProcessEnv): number {
  const parsed = Number.parseInt(variables.PAID_CHANNELS_DAILY_LIMIT ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DAILY_LIMIT;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly telegram: TelegramConfig | null;
  private readonly budget: PaidChannelBudget;
  private budgetAlertDay: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(PERSONAL_TELEGRAM) private readonly personal: PersonalTelegramSender | null,
    @Optional() @Inject(SMS) private readonly sms: SmsSender | null,
  ) {
    const env = loadEnv();
    this.telegram =
      env.TELEGRAM_BOT_TOKEN !== undefined ? { botToken: env.TELEGRAM_BOT_TOKEN } : null;
    this.budget = new PaidChannelBudget(paidDailyLimitFromEnv(process.env));
  }

  async getSettings(): Promise<NotificationSettingsView> {
    const row = await this.prisma.notificationSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: { channelOrder: true },
    });
    if (row === null) {
      return { channelOrder: DEFAULT_CHANNEL_ORDER };
    }
    return { channelOrder: sanitizeChannels(row.channelOrder) };
  }

  async updateSettings(channelOrder: unknown): Promise<NotificationSettingsView> {
    if (!Array.isArray(channelOrder)) {
      throw new BadRequestException('channelOrder должен быть массивом каналов');
    }
    if (channelOrder.length === 0) {
      throw new BadRequestException('Оставьте хотя бы один активный канал');
    }
    const seen = new Set<string>();
    for (const channel of channelOrder) {
      if (!CHANNELS.includes(channel as Channel)) {
        throw new BadRequestException(`Неизвестный канал «${String(channel)}»`);
      }
      if (seen.has(channel)) {
        throw new BadRequestException(`Канал «${channel}» указан дважды`);
      }
      seen.add(channel);
    }
    const row = await this.prisma.notificationSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { channelOrder: channelOrder as Channel[] },
      create: { id: SETTINGS_ID, channelOrder: channelOrder as Channel[] },
      select: { channelOrder: true },
    });
    return { channelOrder: sanitizeChannels(row.channelOrder) };
  }

  async getSmsBalance(): Promise<SmsBalanceView> {
    if (this.sms === null) {
      return { available: false, error: 'SMS-шлюз не настроен (SMSC_LOGIN/SMSC_PASSWORD)' };
    }
    return this.sms.getBalance();
  }

  getBudget(): PaidBudgetSnapshot {
    return this.budget.getSnapshot();
  }

  /** Одно предупреждение в сутки мастерам: платные каналы исчерпаны. */
  private async alertBudgetExhausted(): Promise<void> {
    const snapshot = this.budget.getSnapshot();
    this.logger.warn('Дневной лимит платных каналов уведомлений исчерпан');
    if (this.budgetAlertDay === snapshot.day || this.telegram === null) {
      return;
    }
    this.budgetAlertDay = snapshot.day;
    const text =
      '⚠️ <b>Дневной лимит платных уведомлений исчерпан</b>\n' +
      'До конца дня подтверждения клиентам уходят только через Telegram.';
    const chats = await loadActiveMasterChats(this.prisma, (error) =>
      this.logger.warn(`Не удалось прочитать мастеров: ${error}`),
    );
    await broadcastToMasters(this.telegram, chats, text, [], (error) =>
      this.logger.warn(`Не удалось отправить предупреждение: ${error}`),
    );
  }

  /**
   * Цена одного подтверждения по каждому платному каналу — без отправки.
   * Telegram-личка бесплатна. Ошибка расчёта не валит запрос: цена просто null.
   */
  async getChannelsPrice(phone: string): Promise<ChannelsPriceView> {
    if (this.sms === null) {
      return { telegram: null, viber: null, sms: null };
    }
    const text = formatCallbackConfirmation();
    const [viber, sms] = await Promise.all([
      this.sms.getPrice(phone, VIBER_PRICE_PROBE, true),
      this.sms.getPrice(phone, text, false),
    ]);
    return { telegram: null, viber, sms };
  }

  /**
   * Доставляет подтверждение клиенту по каналам в порядке из админки.
   * Fire-and-forget: ошибка доставки не влияет на заявку или запись.
   */
  deliver(phone: string, text: string): void {
    void this.deliverInternal(phone, text);
  }

  private async deliverInternal(phone: string, text: string): Promise<void> {
    const settings = await this.getSettings().catch(() => null);
    if (settings === null) {
      this.logger.warn('Не удалось прочитать настройки уведомлений — доставка пропущена');
      return;
    }
    for (const channel of settings.channelOrder) {
      const sent = await this.tryChannel(channel, phone, text);
      if (sent) {
        return;
      }
      const nextChannel = nextAfter(settings.channelOrder, channel);
      if (nextChannel !== null) {
        this.logger.warn(
          `${channelName(channel)} не подошёл для ${phone} — пробуем ${channelName(nextChannel)}`,
        );
      } else {
        this.logger.warn(`${channelName(channel)} не подошёл для ${phone} — других каналов нет`);
      }
    }
  }

  private async tryChannel(channel: Channel, phone: string, text: string): Promise<boolean> {
    if (channel === 'telegram') {
      return this.personal !== null && (await this.personal.sendByPhone(phone, text));
    }
    if (this.sms === null) {
      this.logger.warn('SMS-шлюз не настроен — канал пропущен');
      return false;
    }
    if (!this.budget.tryConsume()) {
      await this.alertBudgetExhausted();
      return false;
    }
    const result =
      channel === 'viber'
        ? await this.sms.sendViber(phone, text)
        : await this.sms.send(phone, text);
    return result.ok;
  }
}

function sanitizeChannels(values: string[]): Channel[] {
  const unique: Channel[] = [];
  for (const value of values) {
    if (CHANNELS.includes(value as Channel) && !unique.includes(value as Channel)) {
      unique.push(value as Channel);
    }
  }
  return unique.length > 0 ? unique : DEFAULT_CHANNEL_ORDER;
}

function channelName(channel: Channel): string {
  if (channel === 'telegram') {
    return 'Telegram';
  }
  if (channel === 'viber') {
    return 'Viber';
  }
  return 'SMS';
}

/** Канал, идущий после неудачного (null — дальше ничего нет). */
function nextAfter(order: Channel[], failed: Channel): Channel | null {
  return order[order.indexOf(failed) + 1] ?? null;
}
