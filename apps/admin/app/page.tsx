import Link from 'next/link';
import { cookies } from 'next/headers';
import { Heading, Text } from '@sto/ui';
import { SESSION_COOKIE, apiCountNewRequests, apiCountUnconfirmedBookings } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { LogoutButton } from './logout-button';

export const metadata = { title: 'Панель управления — ПроМакс' };

export default async function AdminHomePage() {
  const user = await requireUser();
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? '';

  const [newRequests, unconfirmedBookings] = await Promise.all([
    apiCountNewRequests(token).catch(() => 0),
    apiCountUnconfirmedBookings(token).catch(() => 0),
  ]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Heading font="display" variant="section" className="uppercase">
        Панель управления
      </Heading>
      <Text variant="mono" color="muted" className="tracking-[0.08em]">
        {'// ВЫ ВОШЛИ КАК '}
        {user.email.toUpperCase()}
        {' · '}
        {user.name.toUpperCase()}
      </Text>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/requests"
          className="flex items-center justify-between rounded-xl border border-border bg-panel px-6 py-5 transition-colors hover:border-primary"
        >
          <span className="flex flex-col items-start gap-1">
            <Text variant="body" className="font-semibold">
              Обращения
            </Text>
            <Text variant="micro" color="dim" className="font-mono">
              ЗАЯВКИ И ЗАПИСИ
            </Text>
          </span>
          <span className="flex items-center gap-1.5">
            {newRequests > 0 ? (
              <span className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1 font-mono text-caption font-semibold text-primary-ink">
                {newRequests}
              </span>
            ) : null}
            {unconfirmedBookings > 0 ? (
              <span className="inline-flex items-center justify-center rounded-full border border-primary/50 px-3 py-1 font-mono text-caption font-semibold text-primary">
                {unconfirmedBookings}
              </span>
            ) : null}
            {newRequests === 0 && unconfirmedBookings === 0 ? (
              <Text variant="micro" color="dim" className="font-mono">
                НОВЫХ НЕТ
              </Text>
            ) : null}
          </span>
        </Link>

        <Link
          href="/booking-settings"
          className="flex items-center justify-between rounded-xl border border-border bg-panel px-6 py-5 transition-colors hover:border-primary"
        >
          <span className="flex flex-col items-start gap-1">
            <Text variant="body" className="font-semibold">
              Настройки записи
            </Text>
            <Text variant="micro" color="dim" className="font-mono">
              ЧАСЫ · ШАГ · ИСКЛЮЧЕНИЯ
            </Text>
          </span>
        </Link>

        <Link
          href="/notifications"
          className="flex items-center justify-between rounded-xl border border-border bg-panel px-6 py-5 transition-colors hover:border-primary"
        >
          <span className="flex flex-col items-start gap-1">
            <Text variant="body" className="font-semibold">
              Уведомления
            </Text>
            <Text variant="micro" color="dim" className="font-mono">
              БАЛАНС SMS · КАНАЛЫ
            </Text>
          </span>
        </Link>

        <Link
          href="/masters"
          className="flex items-center justify-between rounded-xl border border-border bg-panel px-6 py-5 transition-colors hover:border-primary"
        >
          <span className="flex flex-col items-start gap-1">
            <Text variant="body" className="font-semibold">
              Мастера
            </Text>
            <Text variant="micro" color="dim" className="font-mono">
              РАССЫЛКА ЗАЯВОК В TELEGRAM
            </Text>
          </span>
        </Link>
      </div>

      <LogoutButton />
    </main>
  );
}
