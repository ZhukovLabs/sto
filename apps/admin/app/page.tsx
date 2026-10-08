import Link from 'next/link';
import { cookies } from 'next/headers';
import { Heading, Text } from '@sto/ui';
import { SESSION_COOKIE, apiCountNewRequests } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { LogoutButton } from './logout-button';

export const metadata = { title: 'Панель управления — ПроМакс' };

export default async function AdminHomePage() {
  const user = await requireUser();
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? '';

  const newCount = await apiCountNewRequests(token).catch(() => 0);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Heading font="display" variant="section" className="uppercase">
        Панель управления
      </Heading>
      <Text variant="mono" color="muted" className="tracking-[0.08em]">
        {'ВЫ ВОШЛИ КАК '}
        {user.email.toUpperCase()}
        {' · '}
        {user.name.toUpperCase()}
      </Text>

      <Link
        href="/requests"
        className="flex w-full max-w-sm items-center justify-between rounded-xl border border-border bg-panel px-6 py-5 transition-colors hover:border-primary"
      >
        <span className="flex flex-col items-start gap-1">
          <Text variant="body" className="font-semibold">
            Заявки
          </Text>
          <Text variant="micro" color="dim" className="font-mono">
            «ПЕРЕЗВОНИТЕ МНЕ»
          </Text>
        </span>
        {newCount > 0 ? (
          <span className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1 font-mono text-caption font-semibold text-primary-ink">
            {newCount}
          </span>
        ) : (
          <Text variant="micro" color="dim" className="font-mono">
            НОВЫХ НЕТ
          </Text>
        )}
      </Link>

      <Link
        href="/masters"
        className="flex w-full max-w-sm items-center justify-between rounded-xl border border-border bg-panel px-6 py-5 transition-colors hover:border-primary"
      >
        <span className="flex flex-col items-start gap-1">
          <Text variant="body" className="font-semibold">
            Мастера
          </Text>
          <Text variant="micro" color="dim" className="font-mono">
            РАССЫЛКА ЗАЯВОК В TELEGRAM
          </Text>
        </span>
        <Text variant="micro" color="dim" className="font-mono">
          →
        </Text>
      </Link>

      <LogoutButton />
    </main>
  );
}
