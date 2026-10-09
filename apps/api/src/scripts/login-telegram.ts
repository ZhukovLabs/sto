/**
 * Одноразовый вход в личный аккаунт Telegram (GramJS).
 *
 * Запускать интерактивно в отдельном окне PowerShell:
 *   cd apps/api && pnpm login:telegram
 *
 * Спросит номер телефона, код из Telegram и пароль 2FA (если включён),
 * затем напечатает строку сессии — положить её в .env как TELEGRAM_SESSION.
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Api, TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';
import 'dotenv/config';

async function main(): Promise<void> {
  const apiId = Number(process.env.TELEGRAM_API_ID ?? '');
  const apiHash = process.env.TELEGRAM_API_HASH ?? '';
  if (!Number.isFinite(apiId) || apiId <= 0 || apiHash === '') {
    throw new Error('TELEGRAM_API_ID / TELEGRAM_API_HASH не заданы в .env');
  }

  const rl = createInterface({ input: stdin, output: stdout });
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 3,
  });
  await client.start({
    phoneNumber: async () => rl.question('Номер телефона (+375...): '),
    phoneCode: async () => rl.question('Код из Telegram: '),
    password: async () => rl.question('Пароль 2FA (или пусто): '),
    onError: (error) => console.error(error),
  });
  rl.close();

  const me = (await client.getMe()) as Api.User;
  console.log(`\nВошли как: ${me.firstName} (@${me.username ?? 'без username'})`);
  const session = client.session.save() as unknown as string;
  console.log('\n=== TELEGRAM_SESSION ===');
  console.log(session);
  console.log('========================\n');
  console.log('Скопируйте строку выше в .env: TELEGRAM_SESSION=...');
  await client.disconnect();
}

void main().catch((error: unknown) => {
  console.error('Ошибка входа:', error);
  process.exitCode = 1;
});
