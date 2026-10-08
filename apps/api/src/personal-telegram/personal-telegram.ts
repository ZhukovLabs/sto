import bigInt from 'big-integer';
import { Api, TelegramClient } from 'teleproto';
import { Logger } from '@nestjs/common';
import { StringSession } from 'teleproto/sessions';

export interface PersonalTelegramConfig {
  apiId: number;
  apiHash: string;
  session: string;
}

export function loadPersonalTelegramConfig(env: NodeJS.ProcessEnv): PersonalTelegramConfig | null {
  const apiId = Number(env.TELEGRAM_API_ID ?? '');
  const apiHash = env.TELEGRAM_API_HASH ?? '';
  const session = env.TELEGRAM_SESSION ?? '';
  if (!Number.isFinite(apiId) || apiId <= 0 || apiHash === '' || session === '') {
    return null;
  }
  return { apiId, apiHash, session };
}

/** Нормализует телефон к формату E.164 без пробелов: 37529... -> +37529... */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `+${digits}`;
}

export class PersonalTelegramSender {
  private readonly logger = new Logger(PersonalTelegramSender.name);
  private client: TelegramClient | null = null;
  private connecting: Promise<TelegramClient> | null = null;

  constructor(private readonly config: PersonalTelegramConfig) {}

  private async getClient(): Promise<TelegramClient> {
    if (this.client !== null && this.client.connected) {
      return this.client;
    }
    this.connecting ??= (async () => {
      const client = new TelegramClient(
        new StringSession(this.config.session),
        this.config.apiId,
        this.config.apiHash,
        { connectionRetries: 3 },
      );
      await client.connect();
      this.client = client;
      return client;
    })().catch((error: unknown) => {
      this.connecting = null;
      throw error;
    });
    return this.connecting;
  }

  /**
   * Ищет пользователя Telegram по номеру телефона и отправляет сообщение.
   * Возвращает true, если сообщение ушло; false — контакт не найден
   * (у клиента закрыт поиск по номеру) или отправка не удалась.
   */
  async sendByPhone(phone: string, text: string): Promise<boolean> {
    const normalized = normalizePhone(phone);
    try {
      const client = await this.getClient();
      const result = await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: bigInt(1),
              phone: normalized,
              firstName: 'ПроМакс',
              lastName: 'Клиент',
            }),
          ],
        }),
      );
      const user = result.users[0];
      if (user === undefined) {
        this.logger.log(`Telegram не найден по номеру ${normalized}`);
        return false;
      }
      await client.sendMessage(user, { message: text });
      this.logger.log(`Личное сообщение отправлено на ${normalized}`);
      return true;
    } catch (error: unknown) {
      this.logger.warn(`Личное сообщение на ${normalized} не ушло: ${String(error)}`);
      return false;
    }
  }

  async destroy(): Promise<void> {
    await this.client?.disconnect();
    this.client = null;
    this.connecting = null;
  }
}
