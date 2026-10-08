const TELEGRAM_API = 'https://api.telegram.org';

export const REQUEST_STATUSES = ['new', 'called', 'taken', 'cancelled'] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === 'string' && (REQUEST_STATUSES as readonly string[]).includes(value);
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Новая',
  called: 'Перезвонили',
  taken: 'Заказ взят',
  cancelled: 'Отменена',
};

export const REQUEST_STATUS_LABELS = STATUS_LABELS;

export interface TelegramConfig {
  botToken: string;
}

export function isTelegramEnabled(config: TelegramConfig | null): config is TelegramConfig {
  return config !== null;
}

/** Чат Telegram: id может превышать точность number только для групп — приводим через String. */
export type ChatId = bigint | number | string;

function chatIdPayload(chatId: ChatId): number | string {
  if (typeof chatId === 'bigint') {
    const asNumber = Number(chatId);
    return Number.isSafeInteger(asNumber) ? asNumber : chatId.toString();
  }
  return chatId;
}

interface TelegramApiError extends Error {
  status: number;
}

function isClientError(error: unknown): error is TelegramApiError {
  return error instanceof Error && 'status' in error && (error as TelegramApiError).status >= 400;
}

async function telegramApi<T>(config: TelegramConfig, method: string, payload: object): Promise<T> {
  const response = await fetch(`${TELEGRAM_API}/bot${config.botToken}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const error = new Error(`Telegram API ${response.status}: ${body.slice(0, 200)}`);
    (error as TelegramApiError).status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

interface SendMessageResult {
  result: { message_id: number };
}

export async function sendTelegramMessage(
  config: TelegramConfig,
  chatId: ChatId,
  html: string,
  buttons?: InlineButton[][],
): Promise<number> {
  const payload: Record<string, unknown> = {
    chat_id: chatIdPayload(chatId),
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (buttons !== undefined && buttons.length > 0) {
    payload.reply_markup = { inline_keyboard: buttons };
  }
  const data = await telegramApi<SendMessageResult>(config, 'sendMessage', payload);
  return data.result.message_id;
}

interface InlineButton {
  text: string;
  callback_data: string;
}

export function keyboardsFor(status: RequestStatus, requestId: string): InlineButton[][] {
  if (status === 'new') {
    return [[{ text: 'Перезвонил', callback_data: `req:${requestId}:called` }]];
  }
  if (status === 'called') {
    return [
      [
        { text: 'Заказ взят', callback_data: `req:${requestId}:taken` },
        { text: 'Отменено', callback_data: `req:${requestId}:cancelled` },
      ],
    ];
  }
  return [];
}

export interface RequestMessageRef {
  id: string;
  chatId: ChatId;
  messageId: number;
}

/**
 * Компакция по каждому чату: удаляет все сообщения заявки, кроме последнего
 * (низ чата), оставшееся редактирует под актуальный статус.
 * Возвращает id строк, которые ещё живут в Telegram (пустой список — если
 * и последние недоступны, например удалены пользователем).
 */
export async function compactRequestMessages(
  config: TelegramConfig,
  message: {
    messages: RequestMessageRef[];
    requestId: string;
    status: RequestStatus;
    text: string;
  },
): Promise<string[]> {
  const byChat = new Map<ChatId, RequestMessageRef[]>();
  for (const ref of message.messages) {
    const bucket = byChat.get(ref.chatId);
    if (bucket === undefined) {
      byChat.set(ref.chatId, [ref]);
    } else {
      bucket.push(ref);
    }
  }

  const alive: string[] = [];
  for (const [chatId, refs] of byChat) {
    // С конца: свежие напоминания внизу чата обновляются первыми.
    const ordered = [...refs].sort((a, b) => a.messageId - b.messageId);
    const survivor = ordered[ordered.length - 1];
    for (const ref of ordered.slice(0, -1)) {
      try {
        await telegramApi(config, 'deleteMessage', {
          chat_id: chatIdPayload(chatId),
          message_id: ref.messageId,
        });
      } catch (error: unknown) {
        if (!isClientError(error)) {
          throw error;
        }
      }
    }
    try {
      await telegramApi(config, 'editMessageText', {
        chat_id: chatIdPayload(chatId),
        message_id: survivor.messageId,
        text: message.text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: keyboardsFor(message.status, message.requestId) },
      });
      alive.push(survivor.id);
    } catch (error: unknown) {
      if (!isClientError(error)) {
        throw error;
      }
    }
  }
  return alive;
}

export interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    data?: string;
  };
  message?: {
    chat: { id: number };
    text?: string;
  };
}

export async function fetchUpdates(
  config: TelegramConfig,
  offset: number,
): Promise<TelegramUpdate[]> {
  const data = await telegramApi<{ result: TelegramUpdate[] }>(config, 'getUpdates', {
    offset,
    timeout: 0,
    allowed_updates: ['callback_query', 'message'],
  });
  return data.result;
}

export async function answerCallbackQuery(
  config: TelegramConfig,
  id: string,
  text: string,
): Promise<void> {
  await telegramApi(config, 'answerCallbackQuery', { callback_query_id: id, text }).catch(
    (error: unknown) => {
      if (!isClientError(error)) {
        throw error;
      }
    },
  );
}

export async function dropWebhook(config: TelegramConfig): Promise<void> {
  await telegramApi(config, 'deleteWebhook', { drop_pending_updates: true }).catch(
    (error: unknown) => {
      if (!isClientError(error)) {
        throw error;
      }
    },
  );
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Приводит белорусский номер к виду +375 XX XXX-XX-XX, иначе возвращает как есть. */
export function prettyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const match = /^(375)(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(digits);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Minsk',
  }).format(date);
}

export function formatRequestMessage(
  request: { name: string; phone: string; createdAt?: Date },
  status: RequestStatus = 'new',
): string {
  const lines = [
    '🔔 <b>Новая заявка «Перезвоните мне»</b>',
    `Имя: ${escapeHtml(request.name)}`,
    `Телефон: ${prettyPhone(request.phone)}`,
    `${formatTime(request.createdAt ?? new Date())} (Минск)`,
  ];
  if (status !== 'new') {
    lines.push(`— ${STATUS_LABELS[status]}`);
  }
  return lines.join('\n');
}

export function formatReminderMessage(
  request: { name: string; phone: string; createdAt: Date },
  hoursWaiting: number,
): string {
  const plural = pluralizeHours(hoursWaiting);
  return [
    `⏰ <b>Заявка ждёт уже ${hoursWaiting} ${plural}</b>`,
    `Имя: ${escapeHtml(request.name)}`,
    `Телефон: ${prettyPhone(request.phone)}`,
    `Поступила: ${formatTime(request.createdAt)} (Минск)`,
  ].join('\n');
}

/** Ответ на любое сообщение боту: показываем chat_id, добавляет только администратор. */
export function formatStartReply(chatId: number): string {
  return [
    '<b>СТО «ПроМакс»</b>',
    `Ваш chat_id: <code>${chatId}</code>`,
    'Передайте его администратору — после этого заявки начнут приходить в этот чат.',
  ].join('\n');
}

function pluralizeHours(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return 'час';
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'часа';
  }
  return 'часов';
}
